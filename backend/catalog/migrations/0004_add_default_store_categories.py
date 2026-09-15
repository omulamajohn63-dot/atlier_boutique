from django.db import migrations


DEFAULT_CATEGORIES = [
    {
        'name': 'Women',
        'slug': 'women',
        'description': 'The complete womenswear collection.',
    },
    {
        'name': 'Men',
        'slug': 'men',
        'description': 'The complete menswear collection.',
    },
    {
        'name': 'Shoes',
        'slug': 'shoes',
        'description': 'Footwear selected to finish every look.',
    },
]


def create_default_categories(apps, schema_editor):
    Category = apps.get_model('catalog', 'Category')
    for category in DEFAULT_CATEGORIES:
        Category.objects.get_or_create(
            slug=category['slug'],
            defaults={
                'name': category['name'],
                'description': category['description'],
                'is_active': True,
            },
        )


def remove_default_categories(apps, schema_editor):
    Category = apps.get_model('catalog', 'Category')
    Category.objects.filter(slug__in=['women', 'men', 'shoes']).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0003_remove_product_image_url'),
    ]

    operations = [
        migrations.RunPython(create_default_categories,
                             remove_default_categories),
    ]
