from django.urls import path

from .views import ConfirmPaymentView, CreatePaymentIntentView, MpesaCallbackView, PaymentWebhookView


urlpatterns = [
    path('payments/create-intent', CreatePaymentIntentView.as_view(),
         name='payment-create-intent'),
    path('payments/confirm', ConfirmPaymentView.as_view(), name='payment-confirm'),
    path('payments/webhook', PaymentWebhookView.as_view(), name='payment-webhook'),
    path('payments/mpesa/callback', MpesaCallbackView.as_view(),
         name='payment-mpesa-callback'),
]
