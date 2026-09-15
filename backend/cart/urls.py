from django.urls import path

from .views import CartItemCreateView, CartItemView, CartView


urlpatterns = [
    path('cart', CartView.as_view(), name='cart'),
    path('cart/items', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<uuid:item_id>', CartItemView.as_view(), name='cart-item'),
]
