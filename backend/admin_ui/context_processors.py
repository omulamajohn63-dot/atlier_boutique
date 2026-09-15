from .models import AdminNotification


def admin_notifications(request):
    if not request.user.is_authenticated or not getattr(request.user, 'is_staff', False):
        return {
            'admin_notifications': [],
            'admin_notifications_unread_count': 0,
        }

    notifications = list(AdminNotification.objects.filter(
        recipient=request.user).order_by('-created_at')[:6])
    unread_count = AdminNotification.objects.filter(
        recipient=request.user, is_read=False).count()
    return {
        'admin_notifications': notifications,
        'admin_notifications_unread_count': unread_count,
    }
