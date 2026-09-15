import uuid

from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Category, Product, ProductVariant


class CartApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        unique = uuid.uuid4().hex[:8]
        category = Category.objects.create(name='Tops', slug=f'tops-{unique}')
        product = Product.objects.create(
            category=category,
            name='Linen Top',
            slug=f'linen-top-{unique}',
            description='A breathable linen top for warm days.',
            price_minor=12000,
            images=['/media/products/test-linen-top.jpg'],
            status=Product.Status.ACTIVE,
        )
        self.variant = ProductVariant.objects.create(
            product=product, sku='LINEN-S', size='S', stock_quantity=2)

    def test_guest_cart_persists_by_header_and_returns_totals(self):
        headers = {'HTTP_X_CART_ID': 'cart_test_123'}
        response = self.client.post(
            '/api/cart/items', {'variantId': str(self.variant.id), 'quantity': 2}, format='json', **headers)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response['x-cart-id'], 'cart_test_123')
        self.assertEqual(response.json()['itemCount'], 2)
        self.assertEqual(response.json()['subtotal'], 240)

        persisted = self.client.get('/api/cart', **headers)
        self.assertEqual(len(persisted.json()['items']), 1)

    def test_cart_returns_absolute_product_image_for_cart_items(self):
        response = self.client.post(
            '/api/cart/items',
            {'variantId': str(self.variant.id), 'quantity': 1},
            format='json',
            HTTP_X_CART_ID='cart_image_test',
        )

        self.assertEqual(response.status_code, 201)
        product_payload = response.json()['items'][0]['product']
        self.assertEqual(
            product_payload['image'], 'http://testserver/media/products/test-linen-top.jpg')

    def test_guest_cart_ignores_invalid_bearer_token(self):
        response = self.client.post(
            '/api/cart/items',
            {'variantId': str(self.variant.id), 'quantity': 1},
            format='json',
            HTTP_X_CART_ID='cart_invalid_token_test',
            HTTP_AUTHORIZATION='Bearer invalid-token',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response['x-cart-id'], 'cart_invalid_token_test')

    def test_cart_rejects_quantity_above_stock(self):
        response = self.client.post(
            '/api/cart/items',
            {'variantId': str(self.variant.id), 'quantity': 3},
            format='json',
            HTTP_X_CART_ID='cart_stock_test',
        )

        self.assertEqual(response.status_code, 400)
