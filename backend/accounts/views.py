from rest_framework.response import Response
from rest_framework.views import APIView

from admin_ui.models import CustomerNotification

from .permissions import IsAdmin, IsAuthenticatedSupabaseUser, IsStaffOrAdmin


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticatedSupabaseUser]

    def get(self, request):
        return Response({
            'id': request.user.username.removeprefix('supabase_'),
            'email': request.user.email,
            'role': getattr(request.user, 'supabase_role', 'customer'),
        })


class AdminAccessView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        return Response({'status': 'ok', 'role': request.user.supabase_role})


class OwnerAccessView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({'status': 'ok', 'role': request.user.supabase_role})


class CustomerNotificationsView(APIView):
    permission_classes = [IsAuthenticatedSupabaseUser]

    def get(self, request):
        queryset = CustomerNotification.objects.filter(user=request.user)
        total = queryset.count()
        unread_count = queryset.filter(is_read=False).count()
        limit = min(int(request.query_params.get('limit', 20)), 500)
        notifications = queryset.order_by('-created_at')[:limit]
        return Response({
            'count': total,
            'unread_count': unread_count,
            'results': [{
                'id': str(notification.id),
                'category': notification.category,
                'title': notification.title,
                'message': notification.message,
                'link': notification.link,
                'isRead': notification.is_read,
                'createdAt': notification.created_at.isoformat(),
            } for notification in notifications],
        })


class MarkAllCustomerNotificationsReadView(APIView):
    permission_classes = [IsAuthenticatedSupabaseUser]

    def post(self, request):
        updated = CustomerNotification.objects.filter(
            user=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response({'ok': True, 'unread_count': 0, 'updated': updated})


class MarkCustomerNotificationReadView(APIView):
    permission_classes = [IsAuthenticatedSupabaseUser]

    def post(self, request, notification_id):
        notification = CustomerNotification.objects.filter(
            user=request.user,
            pk=notification_id,
        ).first()
        if not notification:
            return Response({'ok': False}, status=404)

        notification.is_read = True
        notification.save(update_fields=['is_read'])
        unread_count = CustomerNotification.objects.filter(
            user=request.user, is_read=False).count()
        return Response({'ok': True, 'unread_count': unread_count})
