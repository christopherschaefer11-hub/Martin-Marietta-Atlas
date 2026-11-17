"""Optional standard-library maintainer check; no application build dependency."""
import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ['index.html','404.html','data/sites.js','assets/css/atlas.css','assets/js/atlas-core.js','assets/js/atlas.js','assets/icons/atlas.svg','assets/images/README.md','kml/README.txt','models/README.md','README.md','DATA_DICTIONARY.md','QA_QC_CHECKLIST.md','CHANGELOG.md','.gitignore','.nojekyll','DATA_PREPARATION_REPORT.md','VALIDATION_REPORT.md']
errors = []
warnings = []
files = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file()}
for name in REQUIRED:
    if name not in files:
        errors.append('Missing exact-case path: '+name)

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.scripts=[]; self.ids=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag=='script' and a.get('src'): self.scripts.append(a['src'])
        if tag in ('script','link','img'):
            v=a.get('src') or a.get('href')
            if v: self.links.append(v)

html=Links();html.feed((ROOT/'index.html').read_text(encoding='utf-8'))
for link in html.links:
    if link.startswith('https://'):
        if 'cdn.jsdelivr.net' in link and not re.search(r'@\d+\.\d+\.\d+/',link):errors.append('Unpinned CDN dependency: '+link)
    elif link.startswith('/') or '\\' in link or ':' in link:errors.append('Unsafe HTML asset path: '+link)
    elif link not in files:errors.append('Missing exact-case HTML asset: '+link)
if len(html.ids)!=len(set(html.ids)):errors.append('Duplicate HTML IDs')
expected=['https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js','https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js','data/sites.js','assets/js/atlas-core.js','assets/js/atlas.js']
if html.scripts!=expected:errors.append('Unexpected script dependency order')
raw=(ROOT/'data/sites.js').read_text(encoding='utf-8')
match=re.search(r'window\.MM_ATLAS_SITES\s*=\s*(\[.*\])\s*;',raw,re.S)
try:
    rows=json.loads(match.group(1)) if match else None
    if not isinstance(rows,list):raise ValueError('Expected JSON array assignment')
except (ValueError,AttributeError) as e:
    errors.append('Site registry must use a literal JSON array: '+str(e));rows=[]
ids=set()
for i,s in enumerate(rows,1):
    if not isinstance(s,dict):errors.append(f'Record {i} is not an object');continue
    if not s.get('id') or not s.get('siteName'):errors.append(f'Record {i} missing required identity')
    if s.get('id') in ids:errors.append(f'Record {i} duplicates an ID')
    ids.add(s.get('id'))
    if s.get('publicationReviewed') is not True:errors.append(f'Record {i} is not publication reviewed')
    for field in ('captureMethods','datasetTypes','dataQualityFlags'):
        if not isinstance(s.get(field),list):errors.append(f'Record {i}: {field} must be an array')
    lat,lon=s.get('latitude'),s.get('longitude')
    if lat is not None or lon is not None:
        if type(lat) not in (int,float) or type(lon) not in (int,float) or not -90<=lat<=90 or not -180<=lon<=180:errors.append(f'Record {i}: invalid coordinate pair')
        if not s.get('locationSource'):errors.append(f'Record {i}: coordinate source missing')
        if re.search(r'approx|rounded|prototype',s.get('locationConfidence',''),re.I) and not s.get('approximateCoordinateApproved'):errors.append(f'Record {i}: unapproved approximate coordinate')
    for field,ext in [('glbUrl','.glb'),('kmlUrl','.kml'),('pointCloudUrl',None),('projectFolderUrl',None),('siteRecordUrl',None)]:
        value=s.get(field,'')
        if not value:continue
        parsed=urlsplit(value)
        if s.get('approvedResources',{}).get(field) is not True:errors.append(f'Record {i}: resource approval missing')
        if value.startswith('/') or '\\' in value or '..' in value or parsed.query or parsed.fragment or (parsed.scheme and parsed.scheme!='https') or parsed.username or parsed.password:errors.append(f'Record {i}: unsafe resource path')
        if re.search(r'sharepoint\.com|1drv\.ms|onedrive\.live\.com|localhost',parsed.hostname or '',re.I):errors.append(f'Record {i}: protected/internal resource URL')
        if not parsed.scheme and value not in files:errors.append(f'Record {i}: missing exact-case resource file')
        if ext and not parsed.path.lower().endswith(ext):errors.append(f'Record {i}: wrong resource extension')
    if re.search(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',json.dumps(s)):errors.append(f'Record {i}: email requires removal/review')
for name in files:
    p=ROOT/name
    if p.suffix.lower() in ('.xlsx','.xls','.las','.laz','.e57','.dwg','.dxf','.rvt','.pem','.key'):errors.append('Forbidden source/technical file: '+name)
    if 'private-review' in name:errors.append('Private review file in repository: '+name)
    if p.suffix.lower()=='.glb' and p.stat().st_size>50*1024*1024:warnings.append('Optimize model above 50 MB: '+name)
    if p.suffix in ('.html','.js','.css') and 'tests/' not in name:
        t=p.read_text(encoding='utf-8')
        if re.search(r'(?:[A-Z]:[\\/]|file:///)',t) or re.search(r'''["']\\\\\\\\[A-Za-z]''',t):errors.append('Local/network path found in runtime: '+name)
        if re.search(r'(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}\.)',t):errors.append('Potential credential in runtime: '+name)
parser=argparse.ArgumentParser();parser.add_argument('--structural-only',action='store_true');args=parser.parse_args()
blocked=not rows or not re.search(r'workbookReconciled["\']?\s*:\s*true',raw)
result={'structuralErrors':errors,'warnings':warnings,'publicRecords':len(rows),'filesInspected':len(files),'releaseBlocked':blocked,'humanReviewRequired':'Workbook coverage, field/asset approval, live links, coordinates and browser QA are never established by this script.'}
print(json.dumps(result,indent=2))
sys.exit(1 if errors else 2 if blocked and not args.structural_only else 0)
