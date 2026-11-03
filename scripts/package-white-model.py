"""Preserve a built-in generated PNG and produce a lightweight browsing preview."""
import base64,hashlib,json,struct,sys,shutil
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
ident=sys.argv[1]
spec=next(s for s in json.loads((root/'data/white-model-generation-specs.json').read_text(encoding='utf8')) if s['id']==ident)
source=Path(sys.argv[2]).resolve()
folder=root/'public/white-models'/spec['kind'];folder.mkdir(parents=True,exist_ok=True)
target=folder/(ident+'.png')
if source.suffix=='.b64':
 source.relative_to(root/'backups');blob=base64.b64decode(source.read_text(),validate=True);target.write_bytes(blob);source.unlink()
else:shutil.copy2(source,target);blob=target.read_bytes()
assert blob[:8]==b'\x89PNG\r\n\x1a\n'
preview=root/'public/white-models/thumbs'/(ident+'.webp');preview.parent.mkdir(parents=True,exist_ok=True)
with Image.open(target) as img:
 img.thumbnail((512,640));img.convert('RGB').save(preview,'WEBP',quality=86,method=6)
w,h=struct.unpack('>II',blob[16:24])
record={'id':ident,'url':'/white-models/'+spec['kind']+'/'+ident+'.png','thumbnail':'/white-models/thumbs/'+ident+'.webp','width':w,'height':h,'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),'generator':'Codex built-in image generation','review':'pending_visual_review'}
records=root/'backups/white-model-records';records.mkdir(parents=True,exist_ok=True)
(records/(ident+'.json')).write_text(json.dumps(record,indent=2)+'\n',encoding='utf8')
print(json.dumps({'id':ident,'width':w,'height':h,'bytes':len(blob)}))
