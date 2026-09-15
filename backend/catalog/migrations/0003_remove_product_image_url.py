from django.db import migrations


def move_legacy_image_urls(apps, schema_editor):
    Product = apps.get_model('catalog', 'Product')
    for product in Product.objects.all().iterator():
        if product.image_url and not product.images:
            product.images = [product.image_url]
            product.save(update_fields=['images'])


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(move_legacy_image_urls,
                             migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='product',
            name='image_url',
        ),
    ]
