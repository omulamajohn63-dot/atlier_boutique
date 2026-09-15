from django.urls import path

from .views import AdminCategoryCreateView, AdminProductArchiveView, AdminProductCreateView, AdminProductUpdateView, AdminStockAdjustmentView, ExpireReservationsView


urlpatterns = [
    path('admin/products', AdminProductCreateView.as_view(),
         name='admin-product-create'),
    path('admin/products/<uuid:product_id>',
         AdminProductUpdateView.as_view(), name='admin-product-update'),
    path('admin/products/<uuid:product_id>/archive',
         AdminProductArchiveView.as_view(), name='admin-product-archive'),
    path('admin/categories', AdminCategoryCreateView.as_view(),
         name='admin-category-create'),
    path('admin/inventory/<uuid:variant_id>',
         AdminStockAdjustmentView.as_view(), name='admin-stock-adjustment'),
    path('admin/maintenance/expire-reservations',
         ExpireReservationsView.as_view(), name='admin-expire-reservations'),
]
