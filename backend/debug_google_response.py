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
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents="Return JSON with keys title, slug, description, image_prompt for product name Luna Silk Dress. Keep it compact.",
    config={'response_mime_type': 'application/json'}
)

print('TYPE:', type(response))
print('HAS_TEXT:', hasattr(response, 'text'))
print('TEXT:', getattr(response, 'text', None))
print('DIR_SNIPPET:', [x for x in dir(response) if not x.startswith('_')][:80])
if hasattr(response, 'candidates'):
    print('CANDIDATES_TYPE:', type(response.candidates))
    print('CANDIDATES_LEN:', len(response.candidates))
    first = response.candidates[0]
    print('FIRST_CLASS:', type(first))
    print('FIRST_FIELDS:', [x for x in dir(first) if not x.startswith('_')][:80])
    print('FIRST_CONTENT:', getattr(first, 'content', None))
    if hasattr(first, 'content'):
        print('PARTS:', getattr(first.content, 'parts', None))
        if getattr(first.content, 'parts', None):
            for p in first.content.parts:
                print('PART_TYPE:', type(p), 'TEXT:', getattr(p, 'text', None), 'RAW:', p)
    print('FIRST_TEXT:', getattr(first, 'text', None))
    print('REPR_FIRST:', repr(first))
print('REPR_RESPONSE:', repr(response))
