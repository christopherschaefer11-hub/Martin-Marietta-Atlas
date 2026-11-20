/* Pure validation, filtering and export helpers. No network or DOM access. */
(function (root) {
  'use strict';
  const STATUS = Object.freeze({
    'Known facility, no collection recorded': '#697783',
    'Previously collected': '#2563a8',
    'Current usable dataset available': '#2e7d32',
    'Scheduled or requested': '#a95600',
    'Requires verification': '#c62828'
  });
  const FILTERS = [['state','State'],['collectionStatus','Collection status'],['captureMethods','Capture method'],['datasetTypes','Dataset type'],['dataStatus','Data status'],['locationConfidence','Location confidence']];
  const RESOURCES = ['glbUrl','pointCloudUrl','kmlUrl','projectFolderUrl','siteRecordUrl'];
  const TEXT = ['id','siteName','mmSiteNumber','lampProjectNumber','streetAddress','city','state','zip','locationConfidence','locationSource','collectionStatus','lastCollectionDate','dataStatus',...RESOURCES,'resourceAvailability','projectFolderAvailability','constraints','notes'];
  const ARRAYS = ['captureMethods','datasetTypes','dataQualityFlags'];
  const BOOLS = ['isAuthoritativeBoundary','requiresVerification','publicationReviewed','approximateCoordinateApproved'];
  const FIELDS = [...TEXT,'latitude','longitude',...ARRAYS,...BOOLS,'approvedResources','collectionEvents'];
  const EVENT_KINDS = ['Field download','Report map'];
  const PRECISIONS = ['day','file','month','quarter','year'];
  const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const text = v => v == null ? '' : String(v).trim();
  const array = v => Array.isArray(v) ? v.map(text).filter(Boolean) : text(v).split(/[|;]/).map(text).filter(Boolean);
  const filterValues = v => Array.isArray(v) ? v : (text(v) ? [text(v)] : []);
  const bool = v => v === true || /^(true|yes|1)$/i.test(text(v));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numeric = v => v === null || v === undefined || (typeof v === 'string' && !v.trim()) ? null : (typeof v === 'number' || typeof v === 'string') && Number.isFinite(Number(v)) ? Number(v) : null;
  function hasCoordinates(s) {
    return typeof s.latitude === 'number' && typeof s.longitude === 'number' && Number.isFinite(s.latitude) && Number.isFinite(s.longitude) && Math.abs(s.latitude) <= 90 && Math.abs(s.longitude) <= 180;
  }
  function resourceURL(value, kind, base) {
    const raw = text(value);
    if (!raw || /[\s\\\x00-\x1f]/.test(raw) || raw.startsWith('/') || /(^|\/)\.\.?([/]|$)/.test(raw) || /%2e|%2f|%5c/i.test(raw)) return '';
    if (/^[a-z][\w+.-]*:/i.test(raw) && !/^https:\/\//i.test(raw)) return '';
    try {
      const u = new URL(raw, base || 'https://atlas.invalid/repository/');
      if (u.username || u.password || u.search || u.hash || u.hostname.startsWith('[') || /(^|\.)(sharepoint\.com|1drv\.ms|onedrive\.live\.com|localhost)$|\.local$|\.internal$/i.test(u.hostname) || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)) return '';
      if (kind === 'glbUrl' && !/\.glb$/i.test(u.pathname)) return '';
      if (kind === 'kmlUrl' && !/\.kml$/i.test(u.pathname)) return '';
      return raw;
    } catch { return ''; }
  }
  function resource(s, key) { return s.approvedResources?.[key] === true ? resourceURL(s[key], key) : ''; }

  /* ---- Collection history (timeline) ----
     A collection event is {date, precision, kind, label, files, reportMaps}.
     date: YYYY-MM-DD (day/file), YYYY-MM (month/quarter, first month) or YYYY (year).
     Months are indexed as year*12 + (month-1) for window arithmetic. */
  const pad = n => String(n).padStart(2,'0');
  function realDay(y,m,d) { const t = new Date(Date.UTC(y,m-1,d)); return t.getUTCFullYear()===y && t.getUTCMonth()===m-1 && t.getUTCDate()===d; }
  function monthIndex(y,m) { return y*12 + (m-1); }
  function monthLabel(i) { if (!Number.isFinite(i)) return ''; const y=Math.floor(i/12), m=i%12; return MONTHS[m][0].toUpperCase()+MONTHS[m].slice(1)+' '+y; }
  function eventSpan(e) {
    const m = /^(\d{4})(?:-(\d{2}))?/.exec(e.date || ''); if (!m) return null;
    const y = Number(m[1]), mo = m[2] ? Number(m[2]) : 1;
    if (e.precision === 'year') return [monthIndex(y,1), monthIndex(y,12)];
    const a = monthIndex(y,mo); return [a, e.precision === 'quarter' ? a+2 : a];
  }
  function eventLabel(e) {
    const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(e.date || ''); if (!m) return 'Undated';
    if (e.precision === 'year') return m[1];
    if (e.precision === 'quarter') return m[1]+' Q'+(Math.floor((Number(m[2])-1)/3)+1);
    if (e.precision === 'month') return monthLabel(monthIndex(Number(m[1]),Number(m[2])));
    return e.date + (e.precision === 'file' ? ' (file date)' : '');
  }
  function normalizeEvents(value, flags) {
    let list = value;
    if (typeof list === 'string') { if (!list.trim()) return []; try { list = JSON.parse(list); } catch { flags.add('Invalid collection history withheld'); return []; } }
    if (list == null) return [];
    if (!Array.isArray(list)) { flags.add('Invalid collection history withheld'); return []; }
    const out = [];
    for (const raw of list.slice(0, 2000)) {
      if (!raw || typeof raw !== 'object') continue;
      const e = {date:text(raw.date), precision:text(raw.precision).toLowerCase(), kind:text(raw.kind), label:text(raw.label).slice(0,200), files:Math.max(0,Math.floor(numeric(raw.files) || 0)), reportMaps:Math.max(0,Math.floor(numeric(raw.reportMaps) || 0))};
      if (!PRECISIONS.includes(e.precision)) e.precision = /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? 'day' : /^\d{4}-\d{2}$/.test(e.date) ? 'month' : 'year';
      if (!EVENT_KINDS.includes(e.kind)) e.kind = 'Field download';
      const d = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(e.date);
      const ok = d && Number(d[1]) >= 1900 && Number(d[1]) <= 2100 && (!d[2] || (Number(d[2]) >= 1 && Number(d[2]) <= 12)) && (!d[3] || realDay(Number(d[1]),Number(d[2]),Number(d[3])));
      const shapeOk = ok && ((['day','file'].includes(e.precision) && d[3]) || (['month','quarter'].includes(e.precision) && d[2] && !d[3]) || (e.precision === 'year' && !d[2]));
      if (!shapeOk) { flags.add('Undated or invalid collection event withheld'); continue; }
      out.push(e);
    }
    if (Array.isArray(list) && list.length > 2000) flags.add('Collection history truncated at 2,000 events');
    return out.sort((a,b) => eventSpan(a)[0]-eventSpan(b)[0] || a.date.localeCompare(b.date));
  }
  function eventsInWindow(s, from, to) {
    return (s.collectionEvents || []).filter(e => { const sp = eventSpan(e); return sp && sp[1] >= from && sp[0] <= to; });
  }
  function timelineRange(rows) {
    let min = Infinity, max = -Infinity;
    rows.forEach(s => (s.collectionEvents || []).forEach(e => { const sp = eventSpan(e); if (sp) { min = Math.min(min, sp[0]); max = Math.max(max, sp[1]); } }));
    return min <= max ? {min, max} : null;
  }
  /* Parse a date out of one folder name. Returns {precision, date} or null. */
  function parseSegmentDate(seg) {
    const t = text(seg);
    let m = /(?<!\d)((?:19|20)\d{2})[-_. ](0?[1-9]|1[0-2])[-_. ](0?[1-9]|[12]\d|3[01])(?!\d)/.exec(t) || /(?<!\d)((?:19|20)\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?!\d)/.exec(t);
    if (m && realDay(+m[1],+m[2],+m[3])) return {precision:'day', date:`${m[1]}-${pad(+m[2])}-${pad(+m[3])}`};
    m = /(?<!\d)(0?[1-9]|1[0-2])[-_.](0?[1-9]|[12]\d|3[01])[-_.]((?:19|20)\d{2})(?!\d)/.exec(t);
    if (m && realDay(+m[3],+m[1],+m[2])) return {precision:'day', date:`${m[3]}-${pad(+m[1])}-${pad(+m[2])}`};
    const year = /(?<!\d)((?:19|20)\d{2})(?!\d)/.exec(t);
    if (!year) return null;
    const lower = t.toLowerCase();
    const mi = MONTHS.findIndex(name => new RegExp('(?<![a-z])'+name+'[a-z]*(?![a-z])').test(lower));
    if (mi >= 0) return {precision:'month', date:`${year[1]}-${pad(mi+1)}`};
    m = /(?<!\d)((?:19|20)\d{2})[-_](0[1-9]|1[0-2])(?!\d)/.exec(t);
    if (m) return {precision:'month', date:`${m[1]}-${m[2]}`};
    m = /(?<![a-z0-9])q([1-4])(?![0-9])/i.exec(t) || /quarter[ _-]*([1-4])/i.exec(t);
    if (m) return {precision:'quarter', date:`${year[1]}-${pad((Number(m[1])-1)*3+1)}`};
    return {precision:'year', date:year[1]};
  }
  const RANK = {day:4, month:3, quarter:2, year:1};
  function fileDay(v) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(v)); return m && realDay(+m[1],+m[2],+m[3]) ? `${m[1]}-${m[2]}-${m[3]}` : ''; }
  function isInventory(fields) { return Array.isArray(fields) && ['MM Site Name','Project Folder Name','File Type','Parent Folder','Last Modified Date'].every(f => fields.includes(f)); }
  /* Convert the read-only file inventory CSV (one row per file) into site records with
     collection events. Folder paths are used only to group and date files; they are not kept. */
  function inventoryToSites(rows, existing) {
    const projects = new Map();
    for (const r of rows) {
      const folder = text(r['Project Folder Name']); if (!folder) continue;
      if (!projects.has(folder)) projects.set(folder, {folder, site:text(r['MM Site Name']), number:text(r['Project Number']), files:[]});
      const segs = text(r['Parent Folder']).split(/[\\/]+/);
      const anchor = segs.findIndex(x => /^(field download|stockpiles)$/i.test(x));
      if (anchor < 0) continue;
      projects.get(folder).files.push({type:/^pdf$/i.test(text(r['File Type'])) ? 'PDF' : 'CSV', rel:segs.slice(anchor+1).filter(Boolean), day:fileDay(r['Last Modified Date'])});
    }
    const records = [];
    for (const p of projects.values()) {
      const groups = new Map(), maps = [];
      for (const f of p.files) {
        let best = null, at = -1;
        f.rel.forEach((seg,i) => { const d = parseSegmentDate(seg); if (d && (!best || RANK[d.precision] >= RANK[best.precision])) { best = d; at = i; } });
        if (f.type === 'PDF') { maps.push({folder:best, day:f.day, label:f.rel.join(' / ') || 'Report map'}); continue; }
        const keyPath = best && best.precision === 'day' ? f.rel.slice(0, at+1) : f.rel;
        const key = keyPath.join('/') + (best || keyPath.length ? '' : '|' + f.day); // undated loose files: one event per file day
        if (!groups.has(key)) groups.set(key, {folder:best, days:[], label:keyPath.join(' / ') || 'Field download (top level)', files:0});
        const g = groups.get(key); g.files++; if (f.day) g.days.push(f.day);
      }
      const resolve = (folder, days) => {
        const first = days.sort()[0] || '';
        if (folder && folder.precision === 'day') return folder;
        if (first) {
          const fileEvent = {precision:'file', date:first};
          if (!folder) return fileEvent;
          const fs = eventSpan(fileEvent), ps = eventSpan(folder);
          if (fs[0] >= ps[0] && fs[0] <= ps[1]) return fileEvent;
        }
        return folder;
      };
      const events = [];
      for (const g of groups.values()) { const d = resolve(g.folder, g.days); if (d) events.push({...d, kind:'Field download', label:g.label, files:g.files, reportMaps:0}); }
      for (const m of maps) {
        const d = resolve(m.folder, m.day ? [m.day] : []); if (!d) continue;
        const end = eventSpan(d)[1];
        const target = events.filter(e => e.kind === 'Field download' && eventSpan(e)[0] <= end && eventSpan(e)[0] >= end-3).sort((a,b) => eventSpan(b)[0]-eventSpan(a)[0])[0];
        if (target) target.reportMaps++; else events.push({...d, kind:'Report map', label:m.label, files:1, reportMaps:1});
      }
      const name = p.site.replace(/^[\s\-–—_]+/, '').trim() || p.folder;
      records.push({id:'inv-' + (p.number || p.folder), siteName:'Martin Marietta – ' + name, lampProjectNumber:p.number, collectionStatus:events.some(e => e.kind === 'Field download') ? 'Previously collected' : 'Known facility, no collection recorded', collectionEvents:events, dataQualityFlags:['Collection history derived from file inventory; verify against project records']});
    }
    if (!Array.isArray(existing) || !existing.length) return records;
    const byNumber = new Map(records.filter(r => r.lampProjectNumber).map(r => [r.lampProjectNumber, r]));
    const used = new Set();
    const merged = existing.map(s => { const r = s.lampProjectNumber && byNumber.get(s.lampProjectNumber); if (!r) return s; used.add(r.id); return {...s, collectionEvents:r.collectionEvents, dataQualityFlags:[...new Set([...(s.dataQualityFlags||[]), ...r.dataQualityFlags])]}; });
    const ids = new Set(merged.map(s => s.id));
    return [...merged, ...records.filter(r => !used.has(r.id) && !ids.has(r.id))];
  }
  function normalize(rows) {
    if (!Array.isArray(rows)) throw new Error('The site registry must be an array.');
    if (rows.length > 5000) throw new Error('Registry exceeds the 5,000-record safety limit.');
    const ids = new Set();
    return rows.map((row, i) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error(`Record ${i+1} is not an object.`);
      const s = {};
      TEXT.forEach(k => s[k] = text(row[k]));
      if (!s.id || !s.siteName) throw new Error(`Record ${i+1} needs an id and siteName; no identifiers were invented.`);
      if (ids.has(s.id)) throw new Error(`Duplicate id: ${s.id}. Reconcile it before importing.`);
      ids.add(s.id);
      ARRAYS.forEach(k => s[k] = [...new Set(array(row[k]))]);
      BOOLS.forEach(k => s[k] = bool(row[k]));
      const flagsEarly = new Set(array(row.dataQualityFlags));
      s.collectionEvents = normalizeEvents(row.collectionEvents, flagsEarly);
      s.dataQualityFlags = [...flagsEarly];
      s.latitude = numeric(row.latitude); s.longitude = numeric(row.longitude);
      const flags = new Set(s.dataQualityFlags);
      if (text(row.latitude) || text(row.longitude)) {
        if (!hasCoordinates(s)) { s.latitude = null; s.longitude = null; flags.add('Invalid or incomplete coordinates withheld'); }
      }
      if (/approx|rounded|prototype/i.test(s.locationConfidence) && !s.approximateCoordinateApproved) {
        if (hasCoordinates(s)) flags.add('Unapproved approximate coordinates withheld');
        s.latitude = null; s.longitude = null;
      }
      if (!hasCoordinates(s)) { s.latitude = null; s.longitude = null; flags.add('Missing coordinates'); }
      if (hasCoordinates(s) && !s.locationSource) { s.latitude = null; s.longitude = null; flags.add('Coordinate source missing; coordinates withheld'); }
      if (!STATUS[s.collectionStatus]) flags.add('Collection status not classified');
      if (!s.lastCollectionDate) flags.add('Missing collection date');
      if (!s.lampProjectNumber) flags.add('Missing project number');
      if (!s.mmSiteNumber) flags.add('Missing MM site number');
      let approvals = row.approvedResources || {};
      if (typeof approvals === 'string') { try { approvals = JSON.parse(approvals); } catch { approvals = {}; flags.add('Invalid resource approvals'); } }
      s.approvedResources = {};
      RESOURCES.forEach(k => {
        const candidate = resourceURL(s[k], k);
        s.approvedResources[k] = bool(approvals[k]) && Boolean(candidate);
        if (s[k] && (!candidate || !s.approvedResources[k])) { flags.add('Unapproved or unsafe resource link withheld'); s[k] = ''; }
      });
      s.requiresVerification = s.requiresVerification || flags.size > 0;
      s.dataQualityFlags = [...flags];
      return s;
    });
  }
  function matches(s, filters) {
    const q = text(filters.query).toLocaleLowerCase();
    if (q && ![s.siteName,s.mmSiteNumber,s.lampProjectNumber,s.streetAddress,s.city,s.state,s.zip,...s.captureMethods,...s.datasetTypes,s.notes].join(' ').toLocaleLowerCase().includes(q)) return false;
    for (const [k] of FILTERS) if (filters[k] && !filterValues(s[k]).includes(filters[k])) return false;
    if (filters.verify && !s.requiresVerification) return false;
    for (const [flag,key] of [['glb','glbUrl'],['pc','pointCloudUrl'],['kml','kmlUrl']]) if (filters[flag] && !resource(s,key)) return false;
    if (filters.folder && !resource(s,'projectFolderUrl') && s.projectFolderAvailability !== 'Available internally') return false;
    if (Number.isFinite(filters.timeTo) && !eventsInWindow(s, Number.isFinite(filters.timeFrom) ? filters.timeFrom : -Infinity, filters.timeTo).length) return false;
    return true;
  }
  function csvCell(v) {
    let s = Array.isArray(v) ? v.join('|') : v && typeof v === 'object' ? JSON.stringify(v) : v == null ? '' : String(v);
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g,'""') + '"';
  }
  function csv(rows) { return '\ufeff' + [FIELDS.map(csvCell).join(','), ...rows.map(s => FIELDS.map(k => csvCell(s[k])).join(','))].join('\r\n'); }
  function counts(rows) {
    return {total:rows.length,mapped:rows.filter(hasCoordinates).length,missing:rows.filter(s=>!hasCoordinates(s)).length,verify:rows.filter(s=>s.requiresVerification).length,collected:rows.filter(s=>['Previously collected','Current usable dataset available'].includes(s.collectionStatus)).length,conflicts:rows.filter(s=>s.dataQualityFlags.some(f=>/conflict/i.test(f))).length};
  }
  const api = {STATUS,FILTERS,RESOURCES,FIELDS,EVENT_KINDS,esc,array,filterValues,bool,numeric,hasCoordinates,resourceURL,resource,normalize,matches,csv,counts,monthIndex,monthLabel,eventSpan,eventLabel,eventsInWindow,timelineRange,parseSegmentDate,isInventory,inventoryToSites};
  root.MMAtlasCore = Object.freeze(api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
