/* Optional maintainer tests. Synthetic records below are test fixtures, never atlas sites. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../assets/js/atlas-core.js');
let assertions=0;
const ok=(value,label)=>{assert.ok(value,label);assertions++;};
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);assertions++;};
const fixture={id:'TEST-ONLY-001',siteName:'Synthetic test fixture',mmSiteNumber:'00001',lampProjectNumber:'00001.01',streetAddress:'',city:'Synthetic locality',state:'ZZ',zip:'00000',latitude:10,longitude:20,locationConfidence:'Synthetic test coordinate',locationSource:'Automated test fixture, not a facility',collectionStatus:'Previously collected',lastCollectionDate:'2026-01-01',captureMethods:['UAV LiDAR','GNSS or conventional survey'],datasetTypes:['GLB','KML'],dataStatus:'Test status',notes:'Alpha BETA',requiresVerification:true,publicationReviewed:true,glbUrl:'models/test-only.glb',kmlUrl:'kml/test-only.kml',pointCloudUrl:'https://example.org/test-only',projectFolderAvailability:'Available internally',approvedResources:{glbUrl:true,kmlUrl:true,pointCloudUrl:true},dataQualityFlags:['Synthetic test fixture']};
const [s]=C.normalize([fixture]);
const confidence='Coordinates missing; source address unverified';
const scalar=C.normalize([{...fixture,locationConfidence:confidence}])[0];
eq(C.filterValues(scalar.locationConfidence),[confidence],'Scalar filter values retain semicolons');
ok(C.matches(scalar,{locationConfidence:confidence}),'Complete confidence label matches');
ok(!C.matches(scalar,{locationConfidence:'Coordinates missing'}),'Partial confidence label is not a separate category');
eq(C.filterValues(s.captureMethods),s.captureMethods,'Multivalue filters retain their separate choices');
for(const v of [null,undefined,'',' ',false,'not-a-coordinate',Infinity]){const [r]=C.normalize([{...fixture,latitude:v}]);ok(!C.hasCoordinates(r),'Missing/invalid latitude must not map');}
for(const [lat,lon] of [[91,0],[0,181],[-91,0],[0,-181],[10,'']]){ok(!C.hasCoordinates(C.normalize([{...fixture,latitude:lat,longitude:lon}])[0]),'Out-of-range/incomplete pair withheld');}
ok(C.hasCoordinates(C.normalize([{...fixture,latitude:0,longitude:0}])[0]),'Explicit sourced zero is a valid numeric coordinate, not a missing value');
ok(!C.hasCoordinates(C.normalize([{...fixture,locationSource:''}])[0]),'Source-less pair withheld');
ok(!C.hasCoordinates(C.normalize([{...fixture,locationConfidence:'Approximate city point'}])[0]),'Unapproved approximate pair withheld');
ok(C.hasCoordinates(C.normalize([{...fixture,locationConfidence:'Approximate city point',approximateCoordinateApproved:true}])[0]),'Explicitly approved approximate fixture supported');
eq(C.normalize([{...fixture,requiresVerification:false,dataQualityFlags:[]}])[0].collectionStatus,'Previously collected','Verification does not change status');
assert.throws(()=>C.normalize([fixture,fixture]),/Duplicate/);assertions++;
assert.throws(()=>C.normalize([{siteName:'Missing id'}]),/needs an id/);assertions++;
assert.throws(()=>C.normalize({}),/array/);assertions++;
for(const query of ['SYNTHETIC','00001.01','locality','zz','uav lidar','glb','beta'])ok(C.matches(s,{query}),'Case-insensitive cross-field search');
ok(!C.matches(s,{query:'no such record'}),'Unmatched query excluded');
const choices=[['state','ZZ'],['collectionStatus','Previously collected'],['captureMethods','UAV LiDAR'],['datasetTypes','KML'],['dataStatus','Test status'],['locationConfidence','Synthetic test coordinate'],['verify',true],['glb',true],['pc',true],['kml',true],['folder',true]];
for(let mask=0;mask<2**choices.length;mask++){const filters={};choices.forEach(([k,v],i)=>{if(mask&(1<<i))filters[k]=v;});ok(C.matches(s,filters),'All matching filter subsets combine');}
for(const [key] of C.FILTERS)ok(!C.matches(s,{state:'ZZ',captureMethods:'UAV LiDAR',[key]:'nonexistent'}),'Each category constrains combinations');
const noLinks=C.normalize([{...fixture,approvedResources:{},projectFolderAvailability:''}])[0];
for(const key of ['glb','pc','kml','folder'])ok(!C.matches(noLinks,{[key]:true}),'Resource filter requires an approved link or confirmed internal folder');
for(const url of ['javascript:alert(1)','file:///unavailable','/assets/test.glb','../test.glb','https://example.org/test.glb?token=not-a-real-token','https://user:pass@example.org/test.glb','https://example.sharepoint.com/test.glb','https://127.0.0.1/test.glb','models/test.laz','models/test%2eglb','models/a b.glb'])eq(C.resourceURL(url,'glbUrl'),'','Unsafe or wrong-format resource rejected');
eq(C.resourceURL('models/test.glb','glbUrl'),'models/test.glb','Relative GLB retained');
eq(C.resourceURL('https://example.org/test.glb','glbUrl'),'https://example.org/test.glb','Clean approved external GLB shape supported');
eq(C.resource(noLinks,'glbUrl'),'','Link approval required');
const counts=C.counts([s,C.normalize([{...fixture,id:'TEST-ONLY-002',collectionStatus:'Known facility, no collection recorded',latitude:null,longitude:null}])[0]]);
eq(counts.collected,1,'Known facility not counted as collected');eq(counts.mapped,1);eq(counts.missing,1);
const csv=C.csv([{...s,notes:'=TEST("formula"),\nsecond line'}]);ok(csv.startsWith('\ufeff'),'UTF-8 BOM');ok(csv.includes('"\'=TEST(""formula""),\nsecond line"'),'CSV formula prefix, quote and newline escaped');ok(csv.includes('"UAV LiDAR|GNSS or conventional survey"'),'CSV arrays retained');
const roundtrip=C.normalize(JSON.parse(JSON.stringify([s])))[0];eq(roundtrip.id,'TEST-ONLY-001');eq(roundtrip.mmSiteNumber,'00001');eq(roundtrip.captureMethods,s.captureMethods);
ok(!C.esc('<img src=x onerror=1>').includes('<'),'HTML escaped');
for(const [label,win] of [['Leaflet',{}],['Leaflet.markercluster',{L:{}}],['site registry',{L:{markerClusterGroup(){}}}]]){
  const element={hidden:true,textContent:'',setAttribute(k,v){this[k]=v;}};
  const context={window:win,document:{readyState:'complete',getElementById(){return element;}},location:{hostname:'localhost'},L:win.L};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/atlas.js'),'utf8'),context);
  ok(element.textContent.includes(label),'Missing dependency names appear in startup message');eq(element.hidden,false);eq(element.role,'alert');
}
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const watchdog=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
let callback;const fallback={hidden:true,textContent:'',setAttribute(){}};
vm.runInNewContext(watchdog,{window:{setTimeout(fn){callback=fn;}},document:{getElementById(){return fallback;}}});callback();ok(!fallback.hidden&&fallback.textContent.includes('did not finish'),'App-script failure watchdog sets a visible message');
const many=C.normalize(Array.from({length:250},(_,i)=>({...fixture,id:'TEST-ONLY-'+i,state:i%2?'YY':'ZZ'})));
const begin=performance.now();for(let i=0;i<1000;i++)eq(many.filter(r=>C.matches(r,{state:'ZZ',glb:true})).length,125);const duration=performance.now()-begin;
console.log(JSON.stringify({result:'PASS',assertions,filterSubsets:2**choices.length,records:250,filterPasses:1000,filterDurationMs:Math.round(duration),scope:'Pure data logic only; no browser rendering or authoritative-source validation'},null,2));
