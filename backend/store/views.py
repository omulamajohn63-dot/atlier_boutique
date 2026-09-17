from django.http import JsonResponse


def health_check(request):
    return JsonResponse({'status': 'ok'})


def api_root(request):
    return JsonResponse({
        'service': 'ATELIER boutique API',
        'health': '/api/health/',
    })
