from rest_framework import serializers

from catalog.serializers import major_units

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    productId = serializers.SerializerMethodField()
    variantId = serializers.SerializerMethodField()
    productName = serializers.CharField(source='product_name')
    variantSku = serializers.CharField(source='variant_sku')
    variantSize = serializers.CharField(source='variant_size')
    variantColor = serializers.CharField(source='variant_color')
    imageUrl = serializers.SerializerMethodField()
    unitPrice = serializers.SerializerMethodField()
    lineTotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ('id', 'productId', 'variantId', 'productName', 'variantSku',
                  'variantSize', 'variantColor', 'imageUrl', 'unitPrice', 'quantity', 'lineTotal')

    def _image_url(self, image, request):
        if not image:
            return ''
        if image.startswith('http://') or image.startswith('https://'):
            return image
        if image.startswith('/') and request:
            return request.build_absolute_uri(image)
        if image.startswith('/'):
            return image
        return image

    def get_imageUrl(self, obj):
        request = self.context.get('request')
        return self._image_url(obj.image_url or '', request)

    def get_productId(self, obj):
        return str(obj.product_id) if obj.product_id else ''

    def get_variantId(self, obj):
        return str(obj.variant_id) if obj.variant_id else ''

    def get_unitPrice(self, obj):
        return major_units(obj.unit_price_minor)

    def get_lineTotal(self, obj):
        return major_units(obj.line_total_minor)


class OrderSerializer(serializers.ModelSerializer):
    orderNumber = serializers.CharField(source='order_number')
    cartId = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    shippingCost = serializers.SerializerMethodField()
    tax = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    shippingMethod = serializers.CharField(source='shipping_method')
    paymentMethod = serializers.CharField(source='payment_method')
    paymentStatus = serializers.CharField(source='payment_status')
    paymentIntentId = serializers.CharField(
        source='payment_intent_id', allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at')
    updatedAt = serializers.DateTimeField(source='updated_at')
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'orderNumber', 'cartId', 'customer', 'items', 'subtotal', 'shippingCost', 'tax', 'total',
                  'shippingMethod', 'paymentMethod', 'status', 'paymentStatus', 'paymentIntentId', 'currency', 'createdAt', 'updatedAt')

    def get_cartId(self, obj):
        return obj.cart.cart_key if obj.cart else ''

    def get_subtotal(self, obj):
        return major_units(obj.subtotal_minor)

    def get_shippingCost(self, obj):
        return major_units(obj.shipping_cost_minor)

    def get_tax(self, obj):
        return major_units(obj.tax_minor)

    def get_total(self, obj):
        return major_units(obj.total_minor)
