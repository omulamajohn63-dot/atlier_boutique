from django.contrib import admin

from .models import InventoryTransaction, StockReservation


@admin.register(StockReservation)
class StockReservationAdmin(admin.ModelAdmin):
    list_display = ('order', 'variant', 'quantity',
                    'status', 'expires_at', 'released_at')
    list_filter = ('status',)
    search_fields = ('order__order_number', 'variant__sku')
    readonly_fields = ('order', 'variant', 'quantity', 'status',
                       'expires_at', 'created_at', 'released_at')


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ('variant', 'quantity_delta', 'previous_quantity',
                    'new_quantity', 'reason', 'actor', 'created_at')
    list_filter = ('reason', 'created_at')
    search_fields = ('variant__sku', 'order__order_number', 'reason')
    readonly_fields = ('variant', 'quantity_delta', 'previous_quantity',
                       'new_quantity', 'reason', 'order', 'actor', 'created_at')
