/*
 * Adobe Experience Platform Web SDK (Target + Analytics) via the aem-martech plugin.
 *
 * The settings come from the authored `/configs/site-config` sheet (see
 * site-config.js), `eager` tab, as `key | value` rows:
 *
 *   consentRequired     true | false   (shared with every other vendor; default true)
 *   websdk.enabled      true | false   (missing = off)
 *   websdk.datastreamId datastream UUID
 *   websdk.orgId        <org id>@AdobeOrg
 *   websdk.edgeDomain   optional first-party Edge domain (CNAME), e.g. data.example.com
 *
 * and, in the `delayed` tab, the Tags (Launch) container:
 *
 *   script.launch       https URL of the Launch library (loaded after consent when required;
 *                       independent of websdk.enabled)
 *
 * scripts.js only calls the phase functions below:
 *   eager   -> martechEager()   personalization (Target), no content flicker
 *   lazy    -> martechLazy()    Analytics page view + Adobe Client Data Layer
 *   delayed -> martechDelayed() Launch/Tags container (`script.launch`)
 *
 * If the sheet, the row or a value is missing or invalid, every function here is a
 * no-op (one console warning names the problem) and the site runs unchanged.
 */
// vendored via git subtree, so it is not an installed package
/* eslint-disable import/no-relative-packages */
import {
  initMartech,
  updateUserConsent,
  martechEager as pluginEager,
  martechLazy as pluginLazy,
  pushEventToDataLayer,
} from '../plugins/martech/src/index.js';
/* eslint-enable import/no-relative-packages */
import { getMetadata } from './aem.js';
import { getSheet, isConsentRequired } from './site-config.js';

const PREFIX = 'websdk.';
// longest the first section waits for the sheet + personalization; the page view
// is still sent afterwards, only the offers are skipped
const EAGER_WAIT = 2500;

const RULES = {
  datastreamId: (v) => /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v),
  orgId: (v) => /^[A-F0-9]+@AdobeOrg$/i.test(v),
};

let setupPromise;
let enabled = false;

// Remember the latest consent signal from the moment this module loads, so scripts
// that start later (the delayed phase) still see an event that fired earlier.
window.hlx ??= {};
window.addEventListener('consent.update', (ev) => {
  window.hlx.consent = { consented: !!ev.detail?.consented };
});

function warn(message) {
  // eslint-disable-next-line no-console
  console.warn(`[martech] ${message}`);
}

/**
 * Validated Web SDK settings from the eager tab, or null (off or invalid).
 * @param {Record<string, string>} sheet the eager tab
 */
function readSettings(sheet) {
  const flag = (sheet[`${PREFIX}enabled`] || '').toLowerCase();
  if (flag === 'false' || flag === '') return null; // off
  if (flag !== 'true') {
    warn('invalid value for "websdk.enabled" — not loaded');
    return null;
  }
  const value = (key) => (sheet[`${PREFIX}${key}`] || '').trim();
  const problems = Object.entries(RULES).flatMap(([key, valid]) => {
    if (!value(key)) return [`missing "${PREFIX}${key}"`];
    return valid(value(key)) ? [] : [`invalid value for "${PREFIX}${key}"`];
  });
  const edgeDomain = value('edgeDomain');
  if (edgeDomain && !/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(edgeDomain)) {
    problems.push(`invalid value for "${PREFIX}edgeDomain"`);
  }
  if (problems.length) {
    warn(`${problems.join(', ')} — not loaded`);
    return null;
  }
  return {
    datastreamId: value('datastreamId'),
    orgId: value('orgId'),
    edgeDomain,
  };
}

/**
 * Adobe Analytics + Target context sent with every event.
 * Analytics: https://experienceleague.adobe.com/en/docs/analytics/implementation/aep-edge/data-var-mapping
 * Target: https://experienceleague.adobe.com/en/docs/platform-learn/migrate-target-to-websdk/send-parameters
 * @param {Object} payload the WebSDK event payload
 */
function addPageContext(payload) {
  // eslint-disable-next-line no-underscore-dangle
  const { analytics, target } = payload.data.__adobe;
  const template = getMetadata('template');

  analytics.pageName = document.title;
  analytics.channel = window.location.pathname.split('/')[1] || 'home';
  analytics.eVar1 = document.documentElement.lang || 'en'; // language
  if (template) analytics.eVar2 = template;

  target.pageName = document.title;
  if (template) target['profile.template'] = template;
}

/** @param {boolean} consented applies the visitor's choice to every Adobe category */
function applyConsent(consented) {
  updateUserConsent({
    collect: consented,
    marketing: consented,
    personalize: consented,
    share: consented,
  }).catch((e) => warn(`consent update failed (${e.message})`));
}

/**
 * Maps the site's consent signal (`consent.update`, latest state in
 * `window.hlx.consent`) to Adobe's consent standard. Until a decision arrives the
 * SDK stays in its default `pending` state and queues events.
 */
function listenForConsent() {
  window.addEventListener('consent.update', (ev) => applyConsent(!!ev.detail?.consented));
  if (window.hlx?.consent) applyConsent(!!window.hlx.consent.consented);
}

async function configure() {
  const sheet = await getSheet('eager', getMetadata('target') ? 'high' : undefined);
  const settings = readSettings(sheet);
  if (!settings) return;

  try {
    const consentRequired = await isConsentRequired();
    const ready = initMartech(
      {
        datastreamId: settings.datastreamId,
        orgId: settings.orgId,
        ...(settings.edgeDomain && { edgeDomain: settings.edgeDomain }),
        onBeforeEventSend: addPageContext,
        // edgeConfigOverrides: {}, // per-environment datastream overrides
      },
      {
        // Target only runs on pages that opt in with the `target` metadata (any value)
        personalization: !!getMetadata('target'),
        analytics: true,
        // decisionScopes: ['my-scope'], // extra Target mboxes besides __view__
      },
    );
    enabled = true;
    // initMartech has configured the plugin synchronously; consent calls queue until alloy is ready
    if (consentRequired) listenForConsent();
    else applyConsent(true);
    await ready;
  } catch (e) {
    enabled = false;
    warn(`failed (${e.message})`);
  }
}

/**
 * Reads the site config and initializes the Web SDK. Safe to call more than once;
 * call it first thing in loadEager so the sheet request starts early.
 * @returns {Promise<void>} resolves when the SDK is ready (or off); never rejects
 */
export function setupMartech() {
  setupPromise ??= configure();
  return setupPromise;
}

/** Eager phase: apply personalization before first paint (Target pages only). */
export async function martechEager() {
  if (!getMetadata('target')) return; // nothing to personalize — never hold LCP
  const run = setupMartech().then(() => (enabled ? pluginEager() : undefined));
  await Promise.race([run, new Promise((resolve) => { setTimeout(resolve, EAGER_WAIT); })]);
}

/** Lazy phase: data layer + Analytics page view. */
export async function martechLazy() {
  await setupMartech();
  if (enabled) await pluginLazy();
}

/** Resolves once the visitor has consented; never resolves otherwise. */
function whenConsented() {
  if (window.hlx.consent?.consented) return Promise.resolve();
  return new Promise((resolve) => {
    const listener = (ev) => {
      if (!ev.detail?.consented) return;
      window.removeEventListener('consent.update', listener);
      resolve();
    };
    window.addEventListener('consent.update', listener);
  });
}

/**
 * Loads the Tags (Launch) library from the `script.launch` row of the delayed tab, as a
 * classic script: ES modules run in strict mode, which can break Tags custom code.
 * Waits for consent when `consentRequired` is true.
 */
async function loadLaunch() {
  const raw = (await getSheet('delayed'))['script.launch'];
  if (!raw) return;
  let url;
  try {
    url = new URL(raw);
  } catch {
    // reported below
  }
  if (url?.protocol !== 'https:') {
    warn('"script.launch" is not a valid https URL — not loaded');
    return;
  }
  if (await isConsentRequired()) await whenConsented();
  if ([...document.scripts].some((script) => script.src === url.href)) return;
  const script = document.createElement('script');
  script.src = url.href;
  script.async = true;
  document.head.append(script);
}

/** Delayed phase: Launch container. */
export async function martechDelayed() {
  await setupMartech();
  await loadLaunch();
}

/**
 * Tracks a custom event (Analytics + Edge). No-op when martech is not configured.
 * @param {string} name event name (also the data layer event)
 * @param {Object} [xdm] XDM fields
 * @param {Object} [data] extra data, e.g. { __adobe: { analytics: { eVar5: 'x' } } }
 */
export function trackEvent(name, xdm = {}, data = {}) {
  if (!enabled) return;
  pushEventToDataLayer(name, xdm, data);
}
