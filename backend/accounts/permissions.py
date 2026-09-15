from rest_framework.permissions import BasePermission


class IsAuthenticatedSupabaseUser(BasePermission):
    message = 'A valid Supabase access token is required.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsStaffOrAdmin(BasePermission):
    message = 'Staff or administrator access is required.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'supabase_role', None) in {'staff', 'admin'}
        )


class IsAdmin(BasePermission):
    message = 'Administrator access is required.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'supabase_role', None) == 'admin'
        )
