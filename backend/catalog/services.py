import csv
import io
import json
import os
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils.text import slugify
from openpyxl import load_workbook

from .models import Category, Product, ProductImage, ProductImportLog


REQUIRED_COLUMNS = {'name', 'price', 'category', 'sku', 'stock_quantity'}


@dataclass
class ImportRowResult:
    row_number: int
    sku: str = ''
    status: str = 'failed'
    product_id: Optional[str] = None
    errors: List[str] = field(default_factory=list)


@dataclass
class ImportResult:
    rows_total: int = 0
    rows_success: int = 0
    rows_failed: int = 0
    rows: List[ImportRowResult] = field(default_factory=list)
    messages: List[str] = field(default_factory=list)
    file_name: str = ''

    @property
    def success_rate(self) -> float:
        if self.rows_total <= 0:
            return 0.0
        return round((self.rows_success / self.rows_total) * 100, 2)


class ProductGenerationService:
    """Optional Google AI enrichment for imported products."""

    @staticmethod
    def generate_internal_code(name: str) -> str:
        """Create a short unique internal code for a product variant."""
        from .models import ProductVariant

        base = re.sub(r'[^A-Z0-9]+', '-', (name or '').upper()).strip('-')
        base = (base[:24] or 'PRODUCT').rstrip('-')
        candidate = f'AT-{base}'
        suffix = 1
        while ProductVariant.objects.filter(sku=candidate).exists():
            suffix += 1
            candidate = f'AT-{base[:(78 - len(str(suffix)))]}-{suffix}'
        return candidate[:80]

    @staticmethod
    def is_configured() -> bool:
        return bool(os.getenv('GOOGLE_API_KEY'))

    @staticmethod
    def _next_unique_slug(base_slug: str) -> str:
        candidate = slugify(base_slug)[:100] or 'product'
        suffix = 2
        while Product.objects.filter(slug=candidate).exists():
            candidate = f'{slugify(base_slug)[:88]}-{suffix}'
            suffix += 1
        return candidate

    @staticmethod
    def _safe_json_text(raw_value):
        if raw_value is None:
            return ''
        if isinstance(raw_value, str):
            return raw_value.strip()
        if isinstance(raw_value, dict):
            return json.dumps(raw_value)
        return str(raw_value)

    @staticmethod
    def _parse_json_response(raw_value) -> dict:
        text = ProductGenerationService._safe_json_text(raw_value)
        if text.startswith('```'):
            text = re.sub(r'^```(?:json)?\s*|\s*```$', '',
                          text.strip(), flags=re.IGNORECASE)
        return json.loads(text)

    @staticmethod
    def _fallback_product_metadata(name: str) -> dict:
        product_name = (name or '').strip() or 'New Product'
        return {
            'description': (
                f'{product_name} brings refined style, comfortable wear, and considered '
                'craftsmanship to your everyday wardrobe.'
            ),
            'slug': ProductGenerationService._next_unique_slug(product_name),
            'ai_generated': False,
        }

    @staticmethod
    def _build_model_candidates(preferred_model: str, fallback_models: Sequence[str]) -> List[str]:
        candidates: List[str] = []
        seen = set()
        for model_name in [preferred_model, *fallback_models]:
            cleaned = (model_name or '').strip()
            if cleaned and cleaned not in seen:
                seen.add(cleaned)
                candidates.append(cleaned)
        return candidates

    @staticmethod
    def _call_google(model_name: str, prompt: str, response_mime_type: Optional[str] = None):
        if not ProductGenerationService.is_configured():
            return None
        try:
            from google import genai
        except Exception:
            return None

        client = genai.Client(api_key=os.environ['GOOGLE_API_KEY'])
        candidates = ProductGenerationService._build_model_candidates(
            model_name,
            [
                'gemini-3.6-flash',
                'gemini-2.5-flash',
                'gemini-2.5-flash-lite',
                'gemini-2.0-flash',
            ],
        )

        last_error = None
        for candidate in candidates:
            try:
                request_kwargs = {
                    'model': candidate,
                    'contents': prompt,
                }
                if response_mime_type:
                    request_kwargs['config'] = {
                        'response_mime_type': response_mime_type}
                response = client.models.generate_content(**request_kwargs)

                if hasattr(response, 'text'):
                    return response.text
                if isinstance(response, dict):
                    return response.get('text') or json.dumps(response)
                if hasattr(response, 'candidates'):
                    candidate_obj = getattr(response, 'candidates', [None])[0]
                    if candidate_obj is None:
                        continue
                    if hasattr(candidate_obj, 'content'):
                        parts = getattr(candidate_obj.content, 'parts', [])
                        if parts:
                            return ''.join(
                                getattr(part, 'text', '')
                                for part in parts
                                if getattr(part, 'text', '')
                            )
                    if hasattr(candidate_obj, 'text'):
                        return candidate_obj.text
            except Exception as exc:
                last_error = exc
                continue

        if last_error is not None:
            return None
        return None

    @staticmethod
    def generate_product_assets(name: str, category: str = '', color: str = '', size: str = '', style: str = '') -> Optional[dict]:
        if not ProductGenerationService.is_configured():
            return None

        product_name = (name or '').strip()
        if not product_name:
            return None

        prompt = (
            f"Create premium boutique ecommerce product metadata for '{product_name}'. "
            f"Category: {category or 'general'}; color: {color or 'neutral'}; "
            f"size: {size or 'standard'}; style: {style or 'classic modern boutique'}. "
            "Respond with valid JSON containing exactly these keys: "
            "title, slug, description, image_prompt. "
            "The title should be a polished product name. The slug should be URL-safe and concise. "
            "The description should be a single persuasive paragraph for a boutique storefront. "
            "The image_prompt should describe a clean editorial studio product shot."
        )

        try:
            raw = ProductGenerationService._call_google(
                os.getenv('GOOGLE_PRODUCT_MODEL', 'gemini-3.6-flash'),
                prompt,
                response_mime_type='application/json',
            )
            if not raw:
                return None

            text = ProductGenerationService._safe_json_text(raw)
            if text.startswith('```'):
                text = text.strip('`')
                if text.lower().startswith('json'):
                    text = text[4:].lstrip()

            payload = json.loads(text)
            title = str(payload.get('title') or product_name).strip()
            slug = slugify(payload.get('slug') or title)[
                :100] or slugify(product_name)[:100] or 'product'
            slug = ProductGenerationService._next_unique_slug(slug)
            description = str(payload.get('description') or '').strip() or (
                f"{title} designed for elevated everyday styling and boutique craftsmanship."
            )
            image_prompt = str(payload.get(
                'image_prompt') or f"{title} product shot, premium boutique fashion, studio lighting, ecommerce photography").strip()
        except Exception:
            return None

        try:
            image_result = ProductGenerationService._call_google(
                os.getenv('GOOGLE_IMAGE_MODEL', 'imagen-3.0-generate-002'),
                image_prompt,
            )
            image_url = None
            if image_result:
                image_bytes = None
                if hasattr(image_result, 'generated_images'):
                    first_image = getattr(
                        image_result, 'generated_images', [None])[0]
                    if first_image is not None:
                        image_bytes = getattr(first_image, 'image_bytes', None) or getattr(
                            first_image, 'bytes', None)
                        if image_bytes is None and hasattr(first_image, 'image'):
                            image_bytes = getattr(first_image.image, 'image_bytes', None) or getattr(
                                first_image.image, 'bytes', None)
                elif isinstance(image_result, dict):
                    candidate = image_result.get(
                        'generated_images') or image_result.get('images') or []
                    if candidate:
                        first = candidate[0]
                        if isinstance(first, dict):
                            image_bytes = first.get(
                                'image_bytes') or first.get('bytes')
                if image_bytes:
                    filename = f'{slugify(title)[:60] or "product"}.png'
                    saved_path = default_storage.save(
                        f'products/{filename}', ContentFile(image_bytes))
                    image_url = settings.MEDIA_URL.rstrip(
                        '/') + '/' + saved_path
        except Exception:
            image_url = None

        return {
            'title': title,
            'slug': slug,
            'description': description,
            'image_url': image_url,
            'image_prompt': image_prompt,
        }

    @staticmethod
    def generate_product_metadata(name: str, category: str = '') -> Optional[dict]:
        """Generate storefront copy and a URL slug without generating an image."""
        if not (name or '').strip():
            return None

        product_name = name.strip()
        fallback = ProductGenerationService._fallback_product_metadata(
            product_name)
        if not ProductGenerationService.is_configured():
            return fallback
        prompt = (
            f"Create ecommerce metadata for the boutique product '{product_name}'. "
            f"Category: {category or 'general'}. Respond with valid JSON containing exactly "
            "description and slug. The description must be one polished, persuasive sentence "
            "for a fashion storefront. The slug must be lowercase URL-safe words separated by "
            "hyphens and based on the product name."
        )
        try:
            raw = ProductGenerationService._call_google(
                os.getenv('GOOGLE_PRODUCT_MODEL', 'gemini-3.6-flash'),
                prompt,
                response_mime_type='application/json',
            )
            if not raw:
                return None
            payload = ProductGenerationService._parse_json_response(raw)
            description = str(payload.get('description') or '').strip()
            slug = slugify(payload.get('slug') or product_name)[:100]
            if not description or not slug:
                return fallback
            return {
                'description': description,
                'slug': ProductGenerationService._next_unique_slug(slug),
                'ai_generated': True,
            }
        except Exception:
            return fallback


class ProductImportService:
    """Reusable bulk import service for product catalog data."""

    @staticmethod
    def normalize_sku(value: str) -> str:
        value = (value or '').strip().upper()
        value = re.sub(r'[^A-Z0-9]+', '-', value)
        value = re.sub(r'-+', '-', value).strip('-')
        return value

    @staticmethod
    def normalize_file_prefix(value: str) -> str:
        normalized = (value or '').strip().lower()
        normalized = unicodedata.normalize('NFKD', normalized)
        normalized = ''.join(
            c for c in normalized if not unicodedata.combining(c))
        normalized = re.sub(r'[^a-z0-9]+', '-', normalized)
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized

    @staticmethod
    def parse_file(file) -> Tuple[List[dict], Optional[str]]:
        """Return rows and optional error message from a CSV or XLSX upload."""
        file_name = getattr(file, 'name', '') or 'import-file'
        file_bytes = file.read()
        if file_name.lower().endswith('.csv'):
            text = file_bytes.decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(text))
            if reader.fieldnames is None:
                return [], 'The uploaded file has no header row.'
            rows = list(reader)
            return rows, None

        if file_name.lower().endswith(('.xlsx', '.xls')):
            try:
                workbook = load_workbook(filename=io.BytesIO(
                    file_bytes), read_only=True, data_only=True)
                sheet = workbook.active
                rows = []
                headers = [cell.value for cell in next(
                    sheet.iter_rows(min_row=1, max_row=1))]
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    row_dict = dict(zip(headers, row))
                    rows.append(row_dict)
                return rows, None
            except Exception as exc:
                return [], f'Unable to parse XLSX file: {exc}'

        return [], 'Unsupported file type. Please upload CSV or XLSX.'

    @staticmethod
    def validate_columns(headers: Sequence[str]) -> List[str]:
        normalized_headers = {str(h).strip().lower()
                              for h in headers if h is not None}
        missing = sorted(REQUIRED_COLUMNS.difference(normalized_headers))
        return missing

    @staticmethod
    def determine_category(value: str):
        value = (value or '').strip()
        if not value:
            return None, 'category is required'
        category_obj = Category.objects.filter(slug=slugify(value)).first()
        if category_obj is None:
            category_obj = Category.objects.filter(name__iexact=value).first()
        if category_obj is None:
            # Create a fallback category for the imported data.
            try:
                category_obj = Category.objects.create(
                    name=value.title(),
                    slug=slugify(value),
                    description='Created automatically from bulk product import.',
                    is_active=True,
                )
            except Exception:
                return None, 'category could not be created'
        return category_obj, None

    @staticmethod
    def attach_images_by_sku(product: Product, sku: str, image_files: Optional[Iterable]) -> None:
        if not image_files:
            return

        sku_prefix = ProductImportService.normalize_file_prefix(sku)
        sku_parts = set(re.findall(r'[a-z0-9]+', sku_prefix))
        if not sku_parts:
            return

        selected = []
        for idx, image in enumerate(image_files or []):
            file_name = getattr(image, 'name', '') or ''
            file_prefix = ProductImportService.normalize_file_prefix(file_name)
            merged = re.findall(r'[a-z0-9]+', file_prefix)
            match = any(part in merged for part in sku_parts)
            if match:
                selected.append(image)

        for order, image_file in enumerate(selected, start=1):
            filename = getattr(image_file, 'name',
                               '') or f'import-image-{order}.jpg'
            saved_path = default_storage.save(
                f'products/{slugify(filename)}', image_file)
            image_url = settings.MEDIA_URL.rstrip('/') + '/' + saved_path
            ProductImage.objects.update_or_create(
                product=product,
                image=image_url,
                defaults={
                    'is_primary': order == 1,
                    'order': order,
                },
            )

    @staticmethod
    def generate_ai_row_payload(row: dict, generate_ai: bool = False) -> dict:
        if not generate_ai:
            return {}

        product_name = (row.get('name') or '').strip()
        category_name = (row.get('category') or '').strip()
        color_name = (row.get('color') or '').strip()
        size_name = (row.get('size') or '').strip()
        if not product_name:
            return {}

        assets = ProductGenerationService.generate_product_assets(
            product_name,
            category=category_name,
            color=color_name,
            size=size_name,
        )
        if not assets:
            return {}

        return {
            'name': assets.get('title') or product_name,
            'slug': assets.get('slug') or slugify(product_name),
            'description': assets.get('description') or '',
            'image_url': assets.get('image_url') or '',
        }

    @staticmethod
    @transaction.atomic
    def import_products_from_file(file, image_files=None, created_by=None, generate_ai: bool = False) -> ImportResult:
        """
        Import product rows from a CSV or XLSX file with per-row validation.
        Returns a structured ImportResult containing all row outcomes.
        """
        image_files = list(image_files or [])
        rows, parse_error = ProductImportService.parse_file(file)
        results = ImportResult(file_name=getattr(file, 'name', ''))
        if parse_error:
            results.messages.append(parse_error)
            return results

        if not rows:
            results.messages.append('No rows found in the import file.')
            return results

        # Normalize headers from file. This remains tolerant of spacing/casing.
        headers = list(rows[0].keys()) if rows else []
        required_missing = ProductImportService.validate_columns(headers)
        if required_missing:
            results.messages.append(
                'Missing required columns: ' + ', '.join(required_missing))
            return results

        results.rows_total = len(rows)
        # Keep counter lines not abort batch.
        for row_index, row in enumerate(rows, start=2):
            row_result = ImportRowResult(row_number=row_index)
            raw = {str(k).strip().lower(): str(v).strip() if isinstance(
                v, str) else v for k, v in row.items()}
            # Map common input names.
            sku = (raw.get('sku') or '').strip()
            name = (raw.get('name') or '').strip()
            price = (raw.get('price') or '').strip()
            category = (raw.get('category') or '').strip()
            stock_quantity = (raw.get('stock_quantity') or '').strip()
            description = (raw.get('description') or '').strip()
            size = (raw.get('size') or '').strip()
            color = (raw.get('color') or '').strip()
            is_active = str(raw.get('is_active') or 'true').strip().lower() in {
                '1', 'true', 'yes', 'y'}

            errors = []
            if not name:
                errors.append('name is required')
            if not sku:
                errors.append('sku is required')
            else:
                normalized_sku = ProductImportService.normalize_sku(sku)
                if not re.fullmatch(r'^[A-Z0-9][A-Z0-9\-]{1,79}$', normalized_sku):
                    errors.append('sku format is invalid')
                sku = normalized_sku
            if not category:
                errors.append('category is required')
            if not price:
                errors.append('price is required')
            else:
                try:
                    price_amount = float(price)
                    if price_amount <= 0:
                        errors.append('price must be greater than 0')
                except Exception:
                    errors.append('price must be a number')
            if stock_quantity == '':
                errors.append('stock_quantity is required')
            else:
                try:
                    stock_int = int(stock_quantity)
                    if stock_int < 0:
                        errors.append('stock_quantity must be >= 0')
                except Exception:
                    errors.append('stock_quantity must be an integer')

            if errors:
                row_result.errors = errors
                results.rows.append(row_result)
                results.rows_failed += 1
                continue

            # Determine category and create if necessary.
            category_obj, category_error = ProductImportService.determine_category(
                category)
            if category_error:
                errors.append(category_error)
                row_result.errors = errors
                results.rows.append(row_result)
                results.rows_failed += 1
                continue

            ai_assets = ProductImportService.generate_ai_row_payload(
                row, generate_ai=generate_ai)
            if ai_assets:
                name = ai_assets.get('name') or name
                description = ai_assets.get('description') or description
                generated_slug = ai_assets.get('slug') or slugify(name)
                if generated_slug:
                    slug_value = generated_slug
                else:
                    slug_value = slugify(name) + '-' + slugify(sku)
                generated_image_url = ai_assets.get('image_url') or ''
            else:
                slug_value = slugify(name) + '-' + slugify(sku)
                generated_image_url = ''

            # Convert file price to minor units, assuming two decimal places.
            price_minor = int(round(float(price) * 100))
            # Validate SKU and save.
            product_defaults = {
                'name': name,
                'description': description,
                'price_minor': price_minor,
                'category': category_obj,
                'size': size,
                'color': color,
                'stock_quantity': int(stock_quantity),
                'status': Product.Status.ACTIVE,
                'is_active': is_active,
                'slug': slug_value,
                'sku': sku,
            }
            product, created = Product.objects.update_or_create(
                sku=sku,
                defaults=product_defaults,
            )
            product.stock_quantity = int(stock_quantity)
            product.name = name
            product.description = description or product.description
            product.price_minor = price_minor
            product.category = category_obj
            product.size = size
            product.color = color
            product.is_active = is_active
            product.status = Product.Status.ACTIVE
            product.slug = slug_value or product.slug or slugify(name)
            if generated_image_url:
                product.images = [generated_image_url] + [img for img in (
                    product.images or []) if img and img != generated_image_url]
            product.save(update_fields=[
                'name', 'description', 'price_minor', 'category', 'size', 'color',
                'stock_quantity', 'status', 'is_active', 'slug', 'sku', 'images', 'updated_at'
            ])

            # Associate any image file whose file name contains the SKU prefix or normalized token.
            ProductImportService.attach_images_by_sku(
                product, sku, image_files)

            row_result.row_number = row_index
            row_result.status = 'success'
            row_result.sku = sku
            row_result.product_id = str(product.id)
            results.rows.append(row_result)
            results.rows_success += 1

        # Always create an audit log for this run.
        ProductImportLog.objects.create(
            filename=getattr(file, 'name', ''),
            rows_total=results.rows_total,
            rows_success=results.rows_success,
            rows_failed=results.rows_failed,
            error_details={
                'rows': [
                    {
                        'row_number': row.row_number,
                        'sku': row.sku,
                        'status': row.status,
                        'product_id': row.product_id,
                        'errors': row.errors,
                    }
                    for row in results.rows
                ],
                'messages': results.messages,
            },
            created_by=created_by,
        )

        return results


def import_products_from_file(file, image_files=None, created_by=None, generate_ai: bool = False):
    return ProductImportService.import_products_from_file(
        file,
        image_files,
        created_by,
        generate_ai=generate_ai,
    )
