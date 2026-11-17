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
  const FIELDS = [...TEXT,'latitude','longitude',...ARRAYS,...BOOLS,'approvedResources'];
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
  const api = {STATUS,FILTERS,RESOURCES,FIELDS,esc,array,filterValues,bool,numeric,hasCoordinates,resourceURL,resource,normalize,matches,csv,counts};
  root.MMAtlasCore = Object.freeze(api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
