(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const APP_NOTE = 'This application is a data-discovery and visualization tool. Locations, extents, models, and links must be validated against the authoritative project record before technical or contractual use.';
  const KML_NOTE = 'Approximate location or extent. Not an authoritative property boundary.';
  const DEFAULT_VIEW = {center:[39.7,-96.2],zoom:5}; // Map camera only; never a facility coordinate.
  let C, map, cluster, sites=[], filtered=[], selectedId=null, imported=false;
  let markers=new Map(), listRows=new Map(), kmlLayer=null, kmlAbort=null, modelTimer=null, modelToken=0, modelOpener=null;
  const libraryPromises = new Map();
  function announce(s) { $('announcer').textContent=s; }
  function message(s) { $('mapMessage').textContent=s; $('mapMessage').hidden=!s; announce(s); }
  function startError(s) { $('startup').hidden=false; $('startup').setAttribute('role','alert'); $('startup').textContent=s; }
  function loadScript(src, module=false) {
    if(libraryPromises.has(src)) return libraryPromises.get(src);
    const promise=new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;if(module)el.type='module';const timer=setTimeout(()=>reject(new Error('Library request timed out. Check the network and reload to retry.')),20000);el.onload=()=>{clearTimeout(timer);resolve();};el.onerror=()=>{clearTimeout(timer);reject(new Error('Optional library could not load. Check your connection or CDN policy.'));};document.head.append(el);});
    libraryPromises.set(src,promise);return promise;
  }
  function icon(s,selected=false) {
    return L.divIcon({className:`atlas-marker ${s.requiresVerification?'needs-review ':''}${selected?'selected-marker':''}`,html:`<div class="marker-pin" style="--status:${C.STATUS[s.collectionStatus]||'#697783'}"></div>`,iconSize:[22,28],iconAnchor:[11,26],popupAnchor:[0,-25]});
  }
  function popup(s) {
    const box=document.createElement('div');
    box.innerHTML=`<div class="popup-site">${C.esc(s.siteName)}</div><div>${C.esc(s.collectionStatus||'Not recorded')}</div><p>${C.esc(s.captureMethods.join(', ')||'Unknown or TBD')}</p>${s.requiresVerification?'<p class="tag warn">Requires verification</p>':''}`;
    const btn=document.createElement('button');btn.className='btn small popup-button';btn.textContent='Open site details';btn.addEventListener('click',()=>selectSite(s.id,false,true));box.append(btn);return box;
  }
  function createMap() {
    map=L.map('map',{...DEFAULT_VIEW,minZoom:2});
    const base='https://server.arcgisonline.com/ArcGIS/rest/services/';
    const attrs={street:'Tiles &copy; Esri — Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), NOSTRA, OpenStreetMap contributors, GIS User Community',imagery:'Tiles &copy; Esri — Esri, Maxar, Earthstar Geographics, GIS User Community',topo:'Tiles &copy; Esri — Esri, HERE, Garmin, Intermap, INCREMENT P, GEBCO, USGS, FAO, NPS, NRCan, Esri Japan, METI, Esri China (Hong Kong), OpenStreetMap contributors, GIS User Community'};
    const layers={'Esri World Street Map':L.tileLayer(base+'World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:attrs.street}),'Esri World Imagery':L.tileLayer(base+'World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:attrs.imagery}),'Esri World Topographic Map':L.tileLayer(base+'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:attrs.topo})};
    let active=layers['Esri World Street Map'], failed=0;
    Object.values(layers).forEach(layer=>{layer.on('tileerror',()=>{if(layer===active&&++failed===3)message('Basemap unavailable. Site records remain usable. Check your connection or switch basemaps.');});layer.on('tileload',()=>{if(layer===active&&failed){failed=0;if($('mapMessage').textContent.startsWith('Basemap unavailable'))message('');}});});
    active.addTo(map); L.control.layers(layers,null,{position:'topright'}).addTo(map);L.control.scale({imperial:true,metric:true,position:'bottomleft'}).addTo(map);
    map.on('baselayerchange',e=>{active=e.layer;failed=0;message('');});
    cluster=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:50,animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});map.addLayer(cluster);
    const fitControl=L.control({position:'topleft'});fitControl.onAdd=()=>{const el=L.DomUtil.create('button','btn leaflet-bar');el.type='button';el.textContent='Fit';el.title='Fit filtered site locations';el.setAttribute('aria-label','Fit filtered site locations');L.DomEvent.disableClickPropagation(el);el.addEventListener('click',()=>fit(filtered));return el;};fitControl.addTo(map);
    new ResizeObserver(()=>map.invalidateSize({pan:false})).observe($('map'));
  }
  function buildRegistry(rows) {
    cluster.clearLayers();markers.clear();listRows.clear();
    rows.forEach(s=>{
      if(C.hasCoordinates(s)){const m=L.marker([s.latitude,s.longitude],{icon:icon(s),title:`${s.siteName}: ${s.collectionStatus}${s.requiresVerification?' — requires verification':''}`,alt:s.siteName,keyboard:true});m.bindPopup(()=>popup(s),{maxWidth:300});m.on('click',()=>selectSite(s.id,false,false));markers.set(s.id,m);}
      const row=document.createElement('button');row.type='button';row.className='site-item';row.dataset.id=s.id;row.style.borderLeftColor=C.STATUS[s.collectionStatus]||'#697783';row.setAttribute('aria-pressed','false');
      row.innerHTML=`<strong>${C.esc(s.siteName)}</strong><span class="sub">${C.esc([s.city,s.state].filter(Boolean).join(', ')||'Location not recorded')}</span><div class="sub">${C.esc(s.collectionStatus||'Collection status not recorded')}</div><div class="tags"><span class="tag">${C.esc(s.captureMethods.join(', ')||'Unknown or TBD')}</span>${s.requiresVerification?'<span class="tag warn">Verify</span>':''}${!C.hasCoordinates(s)?'<span class="tag">No map pin</span>':''}</div>`;
      row.addEventListener('click',()=>selectSite(s.id,true,true));listRows.set(s.id,row);
    });
    $('filterGrid').replaceChildren();
    C.FILTERS.forEach(([key,label])=>{const wrapper=document.createElement('label');wrapper.htmlFor='filter-'+key;wrapper.textContent=label;const select=document.createElement('select');select.id='filter-'+key;select.dataset.key=key;select.add(new Option('All',''));[...new Set(rows.flatMap(s=>C.filterValues(s[key])))].sort().forEach(v=>select.add(new Option(v,v)));select.addEventListener('change',applyFilters);wrapper.append(select);$('filterGrid').append(wrapper);});
    const n=C.counts(rows);$('totalCount').textContent=n.total;$('dataCount').textContent=n.collected;$('verifyCount').textContent=n.verify;
    $('dqSummary').textContent=`${n.mapped} usable coordinate pairs · ${n.missing} missing coordinates · ${n.conflicts} flagged conflicts · ${n.verify} require verification. Coordinate presence is not proof of accuracy.`;
  }
  function filters(){const f={query:$('search').value,verify:$('fVerify').checked,glb:$('fGlb').checked,pc:$('fPc').checked,kml:$('fKml').checked,folder:$('fFolder').checked};document.querySelectorAll('#filterGrid select').forEach(el=>f[el.dataset.key]=el.value);return f;}
  function applyFilters() {
    filtered=sites.filter(s=>C.matches(s,filters()));
    const visibleIds=new Set(filtered.map(s=>s.id));
    for(const [id,m] of markers){if(visibleIds.has(id)){if(!cluster.hasLayer(m))cluster.addLayer(m);}else if(cluster.hasLayer(m))cluster.removeLayer(m);}
    if(selectedId&&!visibleIds.has(selectedId))closeDetail(false);
    const fragment=document.createDocumentFragment();
    for(const [label,predicate] of [['Mapped sites',C.hasCoordinates],['Missing coordinates',s=>!C.hasCoordinates(s)]]){
      const group=filtered.filter(predicate);if(!group.length)continue;const heading=document.createElement('h3');heading.className='group-title';heading.textContent=`${label} (${group.length})`;fragment.append(heading);group.forEach(s=>fragment.append(listRows.get(s.id)));
    }
    $('siteList').replaceChildren(fragment);$('noResults').hidden=filtered.length>0;
    if(!sites.length)$('noResults').textContent='No approved directory is bundled. Open a review JSON or CSV from your device to browse it in this tab.';else $('noResults').textContent='No matching sites. Clear filters or revise the search.';
    $('visibleCount').textContent=`${filtered.length} results · ${filtered.filter(C.hasCoordinates).length} mapped`;
    $('exportCsv').disabled=$('exportJson').disabled=!filtered.length;
  }
  function clearFilters(){$('search').value='';document.querySelectorAll('#filterGrid select').forEach(x=>x.value='');['fVerify','fGlb','fPc','fKml','fFolder'].forEach(id=>$(id).checked=false);applyFilters();}
  function fit(rows){const points=rows.filter(C.hasCoordinates).map(s=>[s.latitude,s.longitude]);if(!points.length){message('No usable coordinates in these results. Every matching record remains available in the site list.');return;}message('');if(points.length===1)map.setView(points[0],13);else map.fitBounds(points,{padding:[45,45],maxZoom:13});}
  function detailHTML(s){
    const rows=[['MM site number',s.mmSiteNumber],['Lamp project',s.lampProjectNumber],['Street address',s.streetAddress],['City / state / ZIP',[s.city,s.state,s.zip].filter(Boolean).join(', ')],['Coordinates',C.hasCoordinates(s)?`${s.latitude.toFixed(6)}, ${s.longitude.toFixed(6)} (WGS 84)`:'Missing — no map pin'],['Location confidence',s.locationConfidence],['Location source',s.locationSource],['Collection status',s.collectionStatus],['Last collection date',s.lastCollectionDate],['Capture methods',s.captureMethods.join(', ')],['Dataset types',s.datasetTypes.join(', ')],['Data status',s.dataStatus],['Resources',s.resourceAvailability],['Project folder',s.projectFolderAvailability],['Constraints',s.constraints],['Notes',s.notes]];
    return `<div class="tags"><span class="tag">${C.esc(s.collectionStatus||'Not recorded')}</span>${s.requiresVerification?'<span class="tag warn">Requires verification</span>':''}${!s.publicationReviewed?'<span class="tag warn">Publication not approved</span>':''}</div><dl class="detail-grid">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${C.esc(v||'Not recorded')}</dd>`).join('')}</dl><div class="actions" id="detailActions"></div>${s.dataQualityFlags.length?`<div class="dq"><strong>Data-quality flags</strong><ul>${s.dataQualityFlags.map(f=>`<li>${C.esc(f)}</li>`).join('')}</ul></div>`:''}<p class="sub">${APP_NOTE}</p>`;
  }
  function selectSite(id,fromList,focus){
    const s=filtered.find(x=>x.id===id);if(!s)return;
    if(selectedId){const old=sites.find(x=>x.id===selectedId);markers.get(selectedId)?.setIcon(icon(old));const oldRow=listRows.get(selectedId);oldRow?.classList.remove('selected');oldRow?.setAttribute('aria-pressed','false');}
    selectedId=id;const row=listRows.get(id);row.classList.add('selected');row.setAttribute('aria-pressed','true');
    $('detailTitle').textContent=s.siteName;$('detailBody').innerHTML=detailHTML(s);$('siteDetail').hidden=false;
    [['glbUrl','View 3D Preview'],['kmlUrl','Open KML'],['pointCloudUrl','Open Point Cloud'],['projectFolderUrl','Open Project Folder'],['siteRecordUrl','Open Site Record']].forEach(([key,label])=>{
      const url=C.resource(s,key);if(!url)return;const el=document.createElement(['glbUrl','kmlUrl'].includes(key)?'button':'a');el.className='btn small resource';el.textContent=label;
      if(el.tagName==='A'){el.href=url;el.target='_blank';el.rel='noopener noreferrer';}else{el.type='button';el.addEventListener('click',()=>key==='glbUrl'?openModel(s):loadKml(s));}$('detailActions').append(el);
    });
    const m=markers.get(id);if(m){m.setIcon(icon(s,true));if(fromList)cluster.zoomToShowLayer(m,()=>m.openPopup());}else message('This site has no usable coordinates. Details are shown without a map pin.');
    if(!fromList)row.scrollIntoView({block:'nearest'});if(matchMedia('(max-width:820px)').matches)drawer(false,false);if(focus)$('detailTitle').focus();announce(`${s.siteName} selected.`);
  }
  function closeDetail(restore=true){const id=selectedId;if(id){const s=sites.find(x=>x.id===id);markers.get(id)?.setIcon(icon(s));markers.get(id)?.closePopup();listRows.get(id)?.classList.remove('selected');listRows.get(id)?.setAttribute('aria-pressed','false');}selectedId=null;$('siteDetail').hidden=true;if(restore){if(matchMedia('(max-width:820px)').matches)$('menuBtn').focus();else listRows.get(id)?.focus();}}
  function drawer(open,restore=true){$('sidebar').classList.toggle('open',open);$('drawerShade').hidden=!open;$('menuBtn').setAttribute('aria-expanded',String(open));if(open)$('search').focus();else if(restore)$('menuBtn').focus();}
  function removeKml(){kmlAbort?.abort();kmlAbort=null;if(kmlLayer)map.removeLayer(kmlLayer);kmlLayer=null;$('kmlControl').hidden=true;$('kmlVisible').checked=true;}
  function parseKml(content){
    const xml=new DOMParser().parseFromString(content,'application/xml');if(xml.getElementsByTagName('parsererror').length||/<!DOCTYPE|<!ENTITY/i.test(content))throw new Error('Invalid or unsupported XML.');
    const by=(el,name)=>Array.from(el.getElementsByTagNameNS('*',name));
    const tuples=el=>{const raw=by(el,'coordinates')[0]?.textContent.trim();if(!raw)throw new Error('A geometry is missing coordinates.');return raw.split(/\s+/).map(token=>{const p=token.split(',');if(p.length<2||!p[0]||!p[1])throw new Error('Malformed KML coordinates.');const lon=Number(p[0]),lat=Number(p[1]);if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lon)>180||Math.abs(lat)>90)throw new Error('KML must use valid WGS 84 longitude, latitude.');return [lat,lon];});};
    const group=L.featureGroup(), style={color:'#7c3aed',weight:3,dashArray:'6 4',fillColor:'#a78bfa',fillOpacity:.15};let unsupported=0;
    by(xml,'Placemark').forEach(pm=>{const label=by(pm,'name')[0]?.textContent||'KML geometry';
      const geometries=Array.from(pm.getElementsByTagName('*')).filter(n=>['Point','LineString','Polygon'].includes(n.localName));
      if(!geometries.length)unsupported++;
      geometries.forEach(g=>{let layer;const points=g.localName==='Polygon'?null:tuples(g);
        if(g.localName==='Point'){if(points.length!==1)throw new Error('Point must contain one coordinate.');layer=L.circleMarker(points[0],{...style,radius:7});}
        else if(g.localName==='LineString'){if(points.length<2)throw new Error('LineString needs at least two coordinates.');layer=L.polyline(points,style);}
        else {const outer=by(g,'outerBoundaryIs')[0];if(!outer)throw new Error('Polygon missing its outer ring.');const rings=[tuples(outer),...by(g,'innerBoundaryIs').map(tuples)];rings.forEach(r=>{if(r.length<4||r[0][0]!==r.at(-1)[0]||r[0][1]!==r.at(-1)[1])throw new Error('Polygon rings must be closed with at least four tuples.');});layer=L.polygon(rings,style);}
        const p=document.createElement('div');p.textContent=label+' — '+KML_NOTE;layer.bindPopup(p).addTo(group);
      });
    });
    if(!group.getLayers().length)throw new Error('No supported placemarks, lines or polygons found.');
    unsupported+=by(xml,'NetworkLink').length+by(xml,'GroundOverlay').length;
    return {group,unsupported};
  }
  async function loadKml(s){
    const url=C.resource(s,'kmlUrl');if(!url)return;removeKml();const controller=new AbortController();kmlAbort=controller;const timer=setTimeout(()=>controller.abort(),20000);message('Loading requested KML…');
    try{const r=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw new Error(`HTTP ${r.status}`);if(Number(r.headers.get('Content-Length'))>10*1024*1024)throw new Error('KML exceeds the 10 MB browser overlay limit.');const content=await r.text();if(new Blob([content]).size>10*1024*1024)throw new Error('KML exceeds the 10 MB browser overlay limit.');const parsed=parseKml(content);if(kmlAbort!==controller)return;kmlLayer=parsed.group.addTo(map);$('kmlName').textContent=s.siteName+' · KML overlay';$('kmlControl').hidden=false;map.fitBounds(kmlLayer.getBounds(),{padding:[40,40],maxZoom:17});message(parsed.unsupported?`${parsed.unsupported} unsupported KML elements were omitted. ${KML_NOTE}`:KML_NOTE);
    }catch(e){if(kmlAbort!==controller)return;message('KML could not load: '+(e.name==='AbortError'?'request timed out.':e.message)+' Site records remain usable.');}finally{clearTimeout(timer);}
  }
  function resetModel(){const viewer=$('viewerHost').querySelector('model-viewer');if(!viewer)return;viewer.cameraOrbit='0deg 75deg 105%';viewer.cameraTarget='auto auto auto';viewer.fieldOfView='auto';viewer.jumpCameraToGoal?.();}
  function closeModel(){modelToken++;clearTimeout(modelTimer);$('viewerHost').replaceChildren();if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});if($('modelModal').open)$('modelModal').close();modelOpener?.focus();}
  async function openModel(s){
    const url=C.resource(s,'glbUrl');if(!url)return;modelOpener=document.activeElement;const token=++modelToken;$('modelTitle').textContent=s.siteName+' — 3D Preview';$('viewerHost').replaceChildren();$('modelState').textContent='Loading 3D viewer…';$('modelModal').showModal();$('closeModel').focus();
    try{await loadScript('https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js',true);if(!customElements.get('model-viewer'))throw new Error('The 3D viewer did not initialize.');if(token!==modelToken)return;const viewer=document.createElement('model-viewer');viewer.setAttribute('camera-controls','');viewer.setAttribute('touch-action','none');viewer.setAttribute('alt',s.siteName+' visualization derivative');viewer.setAttribute('camera-orbit','0deg 75deg 105%');viewer.setAttribute('camera-target','auto auto auto');
      viewer.addEventListener('load',()=>{if(token!==modelToken)return;clearTimeout(modelTimer);$('modelState').textContent='Preview loaded. Geometry, units and scale still require project-record validation.';});viewer.addEventListener('error',()=>{clearTimeout(modelTimer);$('modelState').textContent='Model could not load. Confirm the GLB exists, is valid, is approved and allows CORS access.';});viewer.addEventListener('progress',e=>{if(token===modelToken)$('modelState').textContent=`Loading model… ${Math.round((e.detail.totalProgress||0)*100)}%`;});
      $('viewerHost').append(viewer);viewer.src=url;modelTimer=setTimeout(()=>{$('modelState').textContent='The model is taking longer than expected. Check the file size, connection and browser WebGL support.';},30000);
    }catch(e){if(token===modelToken)$('modelState').textContent=e.message;}
  }
  function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function importFile(event){const file=event.target.files[0];event.target.value='';if(!file)return;if(file.size>5*1024*1024){message('Registry import exceeds the 5 MB limit.');return;}
    try{let rows;const raw=await file.text();if(/\.csv$/i.test(file.name)){await loadScript('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');const result=Papa.parse(raw,{header:true,skipEmptyLines:'greedy'});if(result.errors.length)throw new Error('CSV could not be parsed cleanly: '+result.errors[0].message);rows=result.data;}else{const parsed=JSON.parse(raw);rows=Array.isArray(parsed)?parsed:parsed.sites;}
      const normalized=C.normalize(rows);
      closeDetail(false);removeKml();sites=normalized;imported=true;buildRegistry(sites);clearFilters();releaseNotice();fit(filtered);announce(`${sites.length} records imported in memory. Refresh to restore the bundled registry.`);
    }catch(e){message('Import failed: '+e.message+' Existing records were retained.');}
  }
  function releaseNotice(){$('reviewWelcome').hidden=sites.length>0;const notice=$('releaseNotice');notice.hidden=false;if(imported){notice.textContent=`Session review · ${sites.length} records · ${sites.filter(s=>!s.publicationReviewed).length} awaiting publication review. Source statuses are unverified. This import stays in this tab and is not published to GitHub.`;}else if(!sites.length){notice.textContent=window.MM_ATLAS_META?.message||'No reviewed directory is bundled. Import an approved registry to begin.';}else{notice.textContent='Published directory export · '+sites.length+' records. Validate technical use against the project record.';}}
  function start(){
    const issues=[];if(!window.L)issues.push('Leaflet');else if(typeof L.markerClusterGroup!=='function')issues.push('Leaflet.markercluster');if(!Array.isArray(window.MM_ATLAS_SITES))issues.push('site registry (data/sites.js)');if(!window.MMAtlasCore)issues.push('atlas-core.js');if(issues.length){startError('Atlas cannot start. Missing or invalid: '+issues.join(', ')+'. Check the files, connection and CDN policy, then reload.');return;}
    C=window.MMAtlasCore;
    try{
      sites=C.normalize(window.MM_ATLAS_SITES);
      if(sites.some(s=>!s.publicationReviewed))throw new Error('Bundled registry contains unapproved records. Remove them from the repository; use the file review control instead.');
      createMap();buildRegistry(sites);
      $('legend').innerHTML=Object.entries(C.STATUS).map(([k,v])=>`<div><span class="dot" style="background:${v}"></span>${C.esc(k)}</div>`).join('');
      let debounce; $('search').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(applyFilters,120);});['fVerify','fGlb','fPc','fKml','fFolder'].forEach(id=>$(id).addEventListener('change',applyFilters));
      $('clearFilters').onclick=clearFilters;$('fitVisible').onclick=$('fitResults').onclick=()=>fit(filtered);$('resetMap').onclick=()=>{map.setView(DEFAULT_VIEW.center,DEFAULT_VIEW.zoom);message('');};
      $('menuBtn').onclick=()=>drawer(!$('sidebar').classList.contains('open'));$('closeDrawer').onclick=$('drawerShade').onclick=()=>drawer(false);$('closeDetail').onclick=()=>closeDetail();
      $('registryFile').onchange=importFile;$('openReview').onclick=()=>{$('transferPanel').open=true;$('registryFile').click();};$('restoreRegistry').onclick=()=>{closeDetail(false);removeKml();sites=C.normalize(window.MM_ATLAS_SITES);imported=false;buildRegistry(sites);clearFilters();releaseNotice();map.setView(DEFAULT_VIEW.center,DEFAULT_VIEW.zoom);message('Bundled registry restored.');};
      $('exportCsv').onclick=()=>download(imported?'mm-atlas-private-review.csv':'mm-atlas-results.csv',C.csv(filtered),'text/csv;charset=utf-8');$('exportJson').onclick=()=>download(imported?'mm-atlas-private-review.json':'mm-atlas-results.json',JSON.stringify({schemaVersion:1,scope:'filtered-results',publicationReviewed:filtered.every(s=>s.publicationReviewed),sites:filtered},null,2),'application/json');
      $('removeKml').onclick=()=>{removeKml();message('KML overlay removed.');};$('kmlVisible').onchange=e=>{if(kmlLayer){if(e.target.checked)kmlLayer.addTo(map);else map.removeLayer(kmlLayer);}};
      $('closeModel').onclick=closeModel;$('modelModal').addEventListener('cancel',e=>{e.preventDefault();closeModel();});$('resetModel').onclick=resetModel;$('fullModel').hidden=!document.fullscreenEnabled;$('fullModel').onclick=()=>{const p=document.fullscreenElement?document.exitFullscreen?.():$('modelModal').requestFullscreen?.();p?.catch(()=>{$('modelState').textContent='Fullscreen is unavailable in this browser.';});};
      document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('modelModal').open){if($('sidebar').classList.contains('open'))drawer(false);else closeDetail();}if(e.key==='Tab'&&$('sidebar').classList.contains('open')&&matchMedia('(max-width:820px)').matches){const focusable=Array.from($('sidebar').querySelectorAll('button,input,select,summary')).filter(el=>!el.disabled&&el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
      matchMedia('(max-width:820px)').addEventListener('change',()=>{drawer(false,false);map.invalidateSize();});
      applyFilters();releaseNotice();if(sites.some(C.hasCoordinates))fit(sites);else message('No approved facility pins. Use Sites & filters to browse a reviewed directory.');
      if(getComputedStyle(document.documentElement).getPropertyValue('--atlas-css').trim()!=='loaded'||getComputedStyle(document.querySelector('.leaflet-map-pane')).position!=='absolute'){startError('A required stylesheet did not load. Check the Leaflet and application CSS paths and reload.');return;}
      window.MM_ATLAS_READY=true;$('startup').hidden=true;
    }catch(e){startError('Atlas could not initialize: '+e.message);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
