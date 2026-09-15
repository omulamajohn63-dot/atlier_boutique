from datetime import datetime, timedelta, timezone

import jwt
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from catalog.models import Category, Product, ProductVariant


@override_settings(
    SUPABASE_JWT_SECRET='test-secret-that-is-at-least-32-bytes',
    SUPABASE_JWT_ISSUER='',
)
class AdminApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(
            name='Admin Category', slug='admin-category')
        self.product = Product.objects.create(category=self.category, name='Admin Product', slug='admin-product',
                                              description='A product created for admin API testing.', price_minor=10000, status=Product.Status.ACTIVE)
        self.variant = ProductVariant.objects.create(
            product=self.product, sku='ADMIN-ONE', stock_quantity=3)

    def auth(self, role):
        now = datetime.now(timezone.utc)
        token = jwt.encode({'sub': f'{role}-user', 'email': f'{role}@example.com', 'aud': 'authenticated', 'iat': now, 'exp': now +
                           timedelta(minutes=5), 'app_metadata': {'role': role}}, 'test-secret-that-is-at-least-32-bytes', algorithm='HS256')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_staff_can_adjust_stock(self):
        self.auth('staff')
        response = self.client.patch(
            f'/api/admin/inventory/{self.variant.id}', {'delta': 2, 'reason': 'restock'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['stockQuantity'], 5)

    def test_customer_cannot_create_product(self):
        self.auth('customer')
        response = self.client.post('/api/admin/products', {}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_admin_can_archive_product(self):
        self.auth('admin')
        response = self.client.post(
            f'/api/admin/products/{self.product.id}/archive')
        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, Product.Status.ARCHIVED)
