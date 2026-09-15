from rest_framework import serializers

from catalog.serializers import major_units

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    productId = serializers.UUIDField(source='variant.product_id')
    variantId = serializers.UUIDField(source='variant_id')
    product = serializers.SerializerMethodField()
    variant = serializers.SerializerMethodField()
    unitPrice = serializers.SerializerMethodField()
    lineTotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ('id', 'productId', 'variantId', 'product',
                  'variant', 'quantity', 'unitPrice', 'lineTotal')

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

    def get_product(self, obj):
        product = obj.variant.product
        request = self.context.get('request')
        image = (product.images or [''])[0]
        return {
            'id': str(product.id),
            'name': product.name,
            'slug': product.slug,
            'image': self._image_url(image, request),
        }

    def get_variant(self, obj):
        variant = obj.variant
        return {
            'id': str(variant.id),
            'sku': variant.sku,
            'size': variant.size,
            'color': variant.color,
            'stockQuantity': variant.stock_quantity,
        }

    def get_unitPrice(self, obj):
        price_minor = obj.variant.price_minor
        if price_minor is None:
            price_minor = obj.variant.product.price_minor
        return major_units(price_minor)

    def get_lineTotal(self, obj):
        return self.get_unitPrice(obj) * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    itemCount = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'items', 'subtotal', 'itemCount', 'currency')

    def get_subtotal(self, obj):
        return sum(item.line_total_minor for item in self._priced_items(obj)) / 100

    def get_itemCount(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_currency(self, obj):
        return 'KES'

    def _priced_items(self, obj):
        items = list(obj.items.select_related('variant__product').all())
        for item in items:
            price_minor = item.variant.price_minor
            if price_minor is None:
                price_minor = item.variant.product.price_minor
            item.line_total_minor = price_minor * item.quantity
        return items
