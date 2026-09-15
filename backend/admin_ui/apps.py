from django.apps import AppConfig


class AdminUiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_ui'

    def ready(self):
        import admin_ui.signals  # noqa: F401
