import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'botique_backend.settings')
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / '.env')

import django
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from catalog.models import Category, Product
from catalog.services import ProductImportService

# Use a unique category name and SKU and avoid deleting any protected category rows.
category_name = 'Dresses AI Import Test Safe Two'
slug = 'dresses-ai-import-test-safe-two'
category, created = Category.objects.get_or_create(
    name=category_name,
    defaults={'slug': slug},
)
sku = 'SKU-LUNA-002'
Product.objects.filter(sku=sku).delete()

csv_text = f'name,price,category,sku,stock_quantity\nLuna Silk Dress,2450,{category_name},{sku},10\n'
file_obj = SimpleUploadedFile('products.csv', csv_text.encode('utf-8'), content_type='text/csv')
result = ProductImportService.import_products_from_file(
    file_obj,
    image_files=[],
    created_by=None,
    generate_ai=True,
)

print('rows_total=', result.rows_total)
print('rows_success=', result.rows_success)
print('rows_failed=', result.rows_failed)
print('messages=', result.messages)
print('statuses=', [r.status for r in result.rows])
print('errors=', result.rows[0].errors if result.rows else [])
product = Product.objects.filter(sku=sku).first()
print('product_exists=', product is not None)
if product:
    print('name=', product.name)
    print('slug=', product.slug)
    print('description_len=', len(product.description or ''))
    print('description_preview=', (product.description or '')[:200])
    print('images=', product.images)
