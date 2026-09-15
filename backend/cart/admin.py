from django.contrib import admin

from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    autocomplete_fields = ('variant',)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('cart_key', 'user', 'item_count',
                    'created_at', 'updated_at')
    search_fields = ('cart_key', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    inlines = (CartItemInline,)

    @admin.display(description='Items')
    def item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'variant', 'quantity')
    search_fields = ('cart__cart_key', 'variant__sku',
                     'variant__product__name')
    autocomplete_fields = ('cart', 'variant')
