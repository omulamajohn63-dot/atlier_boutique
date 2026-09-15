from django.db.models.signals import post_save
from django.dispatch import receiver

from catalog.models import ProductVariant
from orders.models import Order

from .models import AdminNotification, notify_customer, notify_staff


@receiver(post_save, sender=Order)
def order_notification_signal(sender, instance, created, **kwargs):
    if created:
        customer_name = (instance.customer or {}).get('fullName') or (instance.customer or {}).get(
            'full_name') or (instance.customer or {}).get('name') or 'A customer'
        notify_staff(
            AdminNotification.Category.ORDER,
            'Order placed',
            f'New order {instance.order_number} was placed by {customer_name}.',
            link=f'/admin/dashboard/orders/{instance.pk}/',
            event_key=f'order-created:{instance.pk}',
        )
        if instance.user is not None:
            notify_customer(
                instance.user,
                'order',
                'Order placed',
                f'Your order {instance.order_number} has been placed and is being prepared.',
                link=f'/account/orders/{instance.order_number}',
                event_key=f'customer-order-created:{instance.pk}',
            )
        return

    if instance.status == Order.Status.CANCELLED:
        notify_staff(
            AdminNotification.Category.ORDER,
            'Order cancelled',
            f'Order {instance.order_number} was cancelled.',
            link=f'/admin/dashboard/orders/{instance.pk}/',
            event_key=f'order-cancelled:{instance.pk}',
        )
        if instance.user is not None:
            notify_customer(
                instance.user,
                'order',
                'Order cancelled',
                f'Your order {instance.order_number} has been cancelled.',
                link=f'/account/orders/{instance.order_number}',
                event_key=f'customer-order-cancelled:{instance.pk}',
            )

    if instance.payment_status == Order.PaymentStatus.REFUNDED:
        notify_staff(
            AdminNotification.Category.PAYMENT,
            'Refund processed',
            f'Order {instance.order_number} was refunded.',
            link=f'/admin/dashboard/orders/{instance.pk}/',
            event_key=f'order-refunded:{instance.pk}',
        )
        if instance.user is not None:
            notify_customer(
                instance.user,
                'payment',
                'Refund processed',
                f'Your refund for order {instance.order_number} has been processed.',
                link=f'/account/orders/{instance.order_number}',
                event_key=f'customer-order-refunded:{instance.pk}',
            )


@receiver(post_save, sender=ProductVariant)
def low_stock_notification_signal(sender, instance, **kwargs):
    if instance.stock_quantity > 3:
        return
    product_name = getattr(instance.product, 'name', 'Product')
    notify_staff(
        AdminNotification.Category.INVENTORY,
        'Low stock alert',
        f'Low stock: {product_name} ({instance.sku}) is down to {instance.stock_quantity}.',
        link=f'/admin/dashboard/inventory/adjust/?variant={instance.pk}',
        event_key=f'low-stock:{instance.pk}',
    )
