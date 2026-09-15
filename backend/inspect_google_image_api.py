import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / '.env')

from google import genai

client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))
print('HAS_GENERATE_IMAGES', hasattr(client.models, 'generate_images'))
print('HAS_GENERATE_CONTENT', hasattr(client.models, 'generate_content'))
print('MODEL_ATTRS', [a for a in dir(client.models) if 'image' in a.lower() or 'generate' in a.lower()][:50])
if hasattr(client.models, 'generate_images'):
    try:
        result = client.models.generate_images(model='imagen-3.0-generate-002', prompt='Luxury silk dress', number_of_images=1)
        print('RESULT_TYPE', type(result))
        print('RESULT_REPR', repr(result)[:1000])
        print('HAS_GENERATED_IMAGES', hasattr(result, 'generated_images'))
        if hasattr(result, 'generated_images'):
            print('GEN_LEN', len(result.generated_images))
            first = result.generated_images[0]
            print('FIRST_TYPE', type(first))
            print('FIRST_FIELDS', [a for a in dir(first) if not a.startswith('_')][:50])
            print('FIRST_IMAGE_BYTES', getattr(first, 'image_bytes', None))
            print('FIRST_BYTES', getattr(first, 'bytes', None))
    except Exception as exc:
        print('ERROR', type(exc).__name__, exc)
