import uuid

from django.db import models

from orders.models import Order


class PaymentIntent(models.Model):
    class Method(models.TextChoices):
        MPESA = 'mpesa', 'M-Pesa'
        CARD = 'card', 'Card'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCEEDED = 'succeeded', 'Succeeded'
        FAILED = 'failed', 'Failed'

    id = models.CharField(primary_key=True, max_length=100)
    order = models.ForeignKey(
        Order, on_delete=models.PROTECT, related_name='payment_intents')
    amount_minor = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, default='KES')
    method = models.CharField(max_length=10, choices=Method.choices)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING)
    client_secret = models.CharField(max_length=160)
    gateway_reference = models.CharField(max_length=160, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class PaymentEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.CharField(max_length=160, unique=True)
    payment_intent = models.ForeignKey(
        PaymentIntent, null=True, blank=True, on_delete=models.SET_NULL, related_name='events')
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
