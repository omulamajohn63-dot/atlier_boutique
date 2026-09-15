from django.urls import path

from .views import CategoryDetailView, CategoryListView, ProductDetailView, ProductListView


urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<str:identifier>', ProductDetailView.as_view(),
         name='product-detail-no-slash'),
    path('products/<str:identifier>/',
         ProductDetailView.as_view(), name='product-detail'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>', CategoryDetailView.as_view(),
         name='category-detail-no-slash'),
    path('categories/<slug:slug>/',
         CategoryDetailView.as_view(), name='category-detail'),
]
