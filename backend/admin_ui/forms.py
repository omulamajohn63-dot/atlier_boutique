from django import forms

from catalog.models import Category, Product, ProductVariant


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ('name', 'slug', 'description', 'image_url', 'is_active')
        labels = {
            'name': 'Category name',
            'slug': 'Web address name',
            'image_url': 'Category image URL',
            'is_active': 'Visible in storefront',
        }
        help_texts = {
            'slug': 'Lowercase words separated by hyphens, for example evening-wear.',
            'image_url': 'Optional URL for the category image.',
        }


class ProductCreateForm(forms.Form):
    name = forms.CharField(label='Product name', max_length=200,
                           help_text='Use the name customers should see.')
    category = forms.ModelChoiceField(
        label='Collection', queryset=Category.objects.filter(is_active=True))
    price = forms.DecimalField(label='Selling price (KES)', max_digits=12,
                               decimal_places=2, min_value=0)
    status = forms.ChoiceField(
        label='Visibility', choices=Product.Status.choices, initial=Product.Status.ACTIVE,
        help_text='Active products appear in the storefront.')
    sku = forms.CharField(label='Internal item code', max_length=80, required=False,
                          help_text='Leave blank to generate a unique code automatically.')
    size = forms.CharField(label='Size', max_length=40, required=False)
    color = forms.CharField(label='Colour', max_length=80, required=False)
    stock_quantity = forms.IntegerField(label='Starting quantity', min_value=0,
                                        initial=0, help_text='How many are ready to sell?')
    image_file = forms.ImageField(
        label='Upload product image', required=True, help_text='Upload the product photo from your device.')

    def clean(self):
        cleaned = super().clean()
        if cleaned.get('sku') and ProductVariant.objects.filter(sku=cleaned['sku']).exists():
            self.add_error('sku', 'A variant with this SKU already exists.')
        return cleaned


class ProductUpdateForm(forms.Form):
    product_id = forms.UUIDField(widget=forms.HiddenInput())
    name = forms.CharField(label='Product name', max_length=200)
    slug = forms.SlugField(label='Web address name', max_length=100)
    category = forms.ModelChoiceField(
        label='Collection', queryset=Category.objects.filter(is_active=True))
    description = forms.CharField(label='Short description', widget=forms.Textarea(
        attrs={'rows': 3}))
    price = forms.DecimalField(label='Selling price (KES)', max_digits=12,
                               decimal_places=2, min_value=0)
    status = forms.ChoiceField(
        label='Visibility', choices=Product.Status.choices)
    image_file = forms.ImageField(
        label='Replace image', required=False, help_text='Upload a new product photo from your device.')

    def __init__(self, *args, **kwargs):
        self.product = kwargs.pop('product', None)
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned = super().clean()
        slug = cleaned.get('slug')
        if slug and self.product and self.product.slug != slug:
            if Product.objects.filter(slug=slug).exclude(pk=self.product.pk).exists():
                self.add_error(
                    'slug', 'A product with this slug already exists.')
        return cleaned


class StockAdjustmentForm(forms.Form):
    variant = forms.ModelChoiceField(label='Item to update', queryset=ProductVariant.objects.select_related(
        'product').order_by('product__name', 'sku'))
    delta = forms.IntegerField(label='Quantity change', min_value=-100000,
                               max_value=100000, help_text='Add stock with a positive number or remove it with a negative number.')
    reason = forms.CharField(label='Reason', max_length=40,
                             initial='manual_adjustment')
