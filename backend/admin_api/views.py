from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStaffOrAdmin
from catalog.models import Category, Product, ProductVariant
from catalog.serializers import CategorySerializer, ProductSerializer
from inventory.services import adjust_stock, expire_reservations

from .serializers import CategoryWriteSerializer, ProductWriteSerializer, StockAdjustmentSerializer
from .services import create_product, update_product


class AdminAPIView(APIView):
    permission_classes = [IsStaffOrAdmin]
    throttle_scope = 'admin'


class AdminProductCreateView(AdminAPIView):
    def post(self, request):
        serializer = ProductWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(ProductSerializer(create_product(serializer.validated_data)).data, status=201)


class AdminProductUpdateView(AdminAPIView):
    def patch(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        serializer = ProductWriteSerializer(
            product_to_input(product), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(ProductSerializer(update_product(product, serializer.validated_data)).data)


class AdminProductArchiveView(AdminAPIView):
    def post(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        product.status = Product.Status.ARCHIVED
        product.save(update_fields=['status', 'updated_at'])
        return Response(ProductSerializer(product).data)


class AdminCategoryCreateView(AdminAPIView):
    def post(self, request):
        serializer = CategoryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        category = Category.objects.create(
            name=data['name'], slug=data['slug'], description=data.get(
                'description', ''),
            is_active=data.get('isActive', True))
        return Response(CategorySerializer(category).data, status=201)


class AdminStockAdjustmentView(AdminAPIView):
    def patch(self, request, variant_id):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = get_object_or_404(ProductVariant, pk=variant_id)
        adjust_stock(
            variant.id, serializer.validated_data['delta'], serializer.validated_data['reason'], request.user)
        variant.refresh_from_db()
        return Response({'variantId': str(variant.id), 'stockQuantity': variant.stock_quantity})


class ExpireReservationsView(AdminAPIView):
    def post(self, request):
        return Response({'expired': expire_reservations()})


def product_to_input(product):
    return {
        'name': product.name, 'slug': product.slug, 'description': product.description,
        'tagline': product.tagline, 'details': product.details, 'price': product.price_minor / 100,
        'compareAtPrice': product.compare_at_price_minor / 100 if product.compare_at_price_minor is not None else None,
        'categoryId': product.category_id, 'images': product.images,
        'status': product.status, 'isFeatured': product.is_featured, 'isNewArrival': product.is_new_arrival,
        'isBestSeller': product.is_best_seller,
    }
