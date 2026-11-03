"""Package an unchanged built-in image result and its WebP browsing preview.

Usage: python scripts/package-catalog-image.py ID native-png-or-base64-file
Requires Pillow for the browsing preview; the original PNG is preserved byte-for-byte.
"""
import base64
import hashlib
import json
import struct
import sys
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
ident=sys.argv[1]
if not ident.replace('-','').isalnum(): raise ValueError('Invalid asset identifier')
specs=json.loads((root/'data/catalog-generation-specs.json').read_text(encoding='utf8'))
spec=next(item for item in specs if item['id']==ident)
transfer=Path(sys.argv[2]).resolve()
native=transfer.suffix.lower()=='.png'
if native:
 transfer.relative_to(Path.home()/'.codex/generated_images')
 blob=transfer.read_bytes()
else:
 transfer.relative_to(root/'backups')
 blob=base64.b64decode(transfer.read_text(encoding='utf8').strip(),validate=True)
if blob[:8]!=b'\x89PNG\r\n\x1a\n': raise ValueError('Expected original PNG output')
folder=root/'public/library-assets'/spec['kind']
folder.mkdir(parents=True,exist_ok=True)
target=folder/(ident+'.png')
if target.exists(): raise FileExistsError(f'Image already exists: {ident}; use a versioned sibling for replacements')
target.write_bytes(blob)
preview=root/'public/library-assets/thumbs'/(ident+'.webp')
preview.parent.mkdir(parents=True,exist_ok=True)
with Image.open(target) as img:
 img.thumbnail((512,640))
 img.convert('RGB').save(preview,'WEBP',quality=84,method=6)
width,height=struct.unpack('>II',blob[16:24])
record={'id':ident,'url':'/library-assets/'+spec['kind']+'/'+ident+'.png','thumbnail':'/library-assets/thumbs/'+ident+'.webp','width':width,'height':height,'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),'generator':'Codex built-in image generation','review':'pending_visual_review'}
records=root/'backups/catalog-render-records'
records.mkdir(parents=True,exist_ok=True)
(records/(ident+'.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
if not native: transfer.unlink()
print(json.dumps({'id':ident,'width':width,'height':height,'pngBytes':len(blob),'previewBytes':preview.stat().st_size}))
