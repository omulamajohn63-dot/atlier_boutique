from rest_framework.views import exception_handler


STATUS_CODES = {
    400: 'VALIDATION_ERROR',
    401: 'AUTHENTICATION_REQUIRED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    409: 'CONFLICT',
    429: 'RATE_LIMITED',
}


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None
    detail = response.data.get('detail') if isinstance(
        response.data, dict) else response.data
    if isinstance(detail, dict):
        details = detail
        message = 'Request validation failed.'
    else:
        details = {}
        message = str(detail)
    code = STATUS_CODES.get(response.status_code, getattr(
        exc, 'default_code', 'api_error').upper())
    response.data = {'error': {'code': code,
                               'message': message, 'details': details}}
    return response
