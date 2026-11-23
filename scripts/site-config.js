/**
 * Site configuration from the authored `/configs/site-config` sheet (DA). Each
 * environment is its own DA site with its own sheet, so values are used as-is:
 * there is no environment logic.
 *
 * The sheet has one tab per page-load phase — `eager`, `lazy`, `delayed` — each
 * with `key | value` rows. A tab is fetched on its own
 * (`/configs/site-config.json?sheet=<tab>`), once, when its phase first needs it,
 * so each request stays small. Put a setting in the tab of the phase that uses it.
 *
 * A missing tab or setting means the feature it configures is off. The one
 * exception is `consentRequired` (eager tab, so Target can decide before the
 * first section renders): anything other than `true` / `false` counts as required.
 */

const CONFIG_URL = '/configs/site-config.json';

/** @type {Map<string, Promise<Record<string, string>>>} */
const sheets = new Map();

function warn(message) {
  // eslint-disable-next-line no-console
  console.warn(`[site-config] ${message}`);
}

/**
 * `key | value` rows → { key: value } (trimmed; rows without a key skipped).
 * @param {object} json single-sheet JSON
 * @param {string} name tab name, for warnings
 * @returns {Record<string, string>}
 */
function toSettings(json, name) {
  const rows = Array.isArray(json?.data) ? json.data : [];
  const settings = Object.create(null);
  let keyless = 0;
  rows.forEach((row) => {
    const key = typeof row?.key === 'string' ? row.key.trim() : '';
    const value = row?.value == null ? '' : String(row.value).trim();
    if (key) settings[key] = value;
    else if (value) keyless += 1;
  });
  if (keyless) warn(`tab "${name}": ${keyless} row(s) without a key — skipped`);
  return settings;
}

/**
 * Settings of one tab as a plain object. Fetched once per page; resolves to {}
 * (with one warning) when the tab is unavailable.
 * @param {string} name tab name: `eager`, `lazy` or `delayed`
 * @param {RequestPriority} [priority] fetch priority if this call starts the request
 * @returns {Promise<Record<string, string>>}
 */
export function getSheet(name, priority) {
  if (!sheets.has(name)) {
    const url = `${CONFIG_URL}?sheet=${encodeURIComponent(name)}`;
    sheets.set(name, fetch(url, priority ? { priority } : {})
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((json) => toSettings(json, name))
      .catch((error) => {
        warn(`tab "${name}" unavailable — its settings are not applied (${error.message})`);
        return Object.create(null);
      }));
  }
  return sheets.get(name);
}

let consentRequired;

/**
 * Whether the visitor must consent before martech loads — the one setting for
 * every vendor (`consentRequired`, eager tab). Anything other than `true` /
 * `false` (or no row) is reported once and counts as required.
 * @returns {Promise<boolean>}
 */
export function isConsentRequired() {
  consentRequired ??= getSheet('eager').then((settings) => {
    const value = (settings.consentRequired || '').toLowerCase();
    if (value !== 'true' && value !== 'false') {
      warn('invalid value for "consentRequired" — consent treated as required');
    }
    return value !== 'false';
  });
  return consentRequired;
}

window.hlx ??= {};
window.hlx.siteConfig = Object.freeze({ getSheet, isConsentRequired });
