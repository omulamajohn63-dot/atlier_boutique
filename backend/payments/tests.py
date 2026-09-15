from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Category, Product, ProductVariant
from orders.models import Order
from payments.models import PaymentIntent


class PaymentApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        category = Category.objects.create(name='Bags', slug='bags')
        product = Product.objects.create(category=category, name='Leather Bag', slug='leather-bag',
                                         description='A structured leather bag for daily use.', price_minor=30000, status=Product.Status.ACTIVE)
        variant = ProductVariant.objects.create(
            product=product, sku='BAG-ONE', stock_quantity=2)
        self.client.post('/api/cart/items', {'variantId': str(
            variant.id), 'quantity': 1}, format='json', HTTP_X_CART_ID='payment-cart')
        self.client.post('/api/orders', {'customer': {'fullName': 'Ada Lovelace', 'email': 'ada@example.com', 'phone': '0712345678',
                         'addressLine1': '1 Market Street', 'city': 'Nairobi', 'county': 'Nairobi'}}, format='json', HTTP_X_CART_ID='payment-cart')
        self.order = Order.objects.get(cart__cart_key='payment-cart')

    def test_create_and_confirm_payment_is_idempotent(self):
        headers = {'HTTP_X_CART_ID': 'payment-cart'}
        created = self.client.post('/api/payments/create-intent', {
                                   'orderNumber': self.order.order_number, 'method': 'mpesa'}, format='json', **headers)
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.json()['amount'], 348)
        intent_id = created.json()['id']

        confirmed = self.client.post('/api/payments/confirm', {
                                     'orderNumber': self.order.order_number, 'paymentIntentId': intent_id}, format='json', **headers)
        self.assertEqual(confirmed.status_code, 200)
        self.assertEqual(confirmed.json()['paymentStatus'], 'paid')
        self.assertEqual(confirmed.json()['status'], 'pending')
        repeated = self.client.post('/api/payments/confirm', {
                                    'orderNumber': self.order.order_number, 'paymentIntentId': intent_id}, format='json', **headers)
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(PaymentIntent.objects.get(
            id=intent_id).status, PaymentIntent.Status.SUCCEEDED)

    def test_payment_intent_cannot_be_accessed_from_another_cart(self):
        response = self.client.post('/api/payments/create-intent', {
                                    'orderNumber': self.order.order_number}, format='json', HTTP_X_CART_ID='other-cart')
        self.assertEqual(response.status_code, 403)
