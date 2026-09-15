from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = ('product_name', 'variant_sku',
                       'unit_price_minor', 'quantity', 'line_total_minor')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer_name', 'total_minor',
                    'status', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status',
                   'shipping_method', 'payment_method')
    search_fields = ('order_number', 'customer__email',
                     'customer__fullName', 'customer__phone')
    readonly_fields = ('order_number', 'cart', 'user', 'customer', 'subtotal_minor', 'shipping_cost_minor',
                       'tax_minor', 'total_minor', 'payment_intent_id', 'currency', 'created_at', 'updated_at')
    inlines = (OrderItemInline,)

    @admin.display(description='Customer')
    def customer_name(self, obj):
        return obj.customer.get('fullName', '')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product_name', 'variant_sku',
                    'quantity', 'line_total_minor')
    search_fields = ('order__order_number', 'product_name', 'variant_sku')
    readonly_fields = ('order', 'product', 'variant', 'product_name',
                       'variant_sku', 'unit_price_minor', 'quantity', 'line_total_minor')
