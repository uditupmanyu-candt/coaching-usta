/*
 * Adobe Experience Platform Web SDK (Target + Analytics) via the aem-martech plugin.
 *
 * All project-specific martech configuration lives here; scripts.js only calls
 * the three phase functions below:
 *   eager   -> martechEager()   personalization (Target), no content flicker
 *   lazy    -> martechLazy()    Analytics page view + Adobe Client Data Layer
 *   delayed -> martechDelayed() optional Launch/Tags containers
 *
 * Until DATASTREAM_ID and ORG_ID are filled in, every function here is a no-op,
 * so the site runs unchanged. See MIGRATION.md ("Martech") for the setup steps.
 */
// vendored via git subtree, so it is not an installed package
/* eslint-disable import/no-relative-packages */
import {
  initMartech,
  updateUserConsent,
  martechEager as pluginEager,
  martechLazy as pluginLazy,
  martechDelayed as pluginDelayed,
  pushEventToDataLayer,
} from '../plugins/martech/src/index.js';
/* eslint-enable import/no-relative-packages */
import { getMetadata } from './aem.js';

/* ---- fill these in once the datastream exists (client-side values, not secrets) ---- */
const DATASTREAM_ID = ''; // Experience Platform > Datastreams, e.g. 'a1b2c3d4-...'
const ORG_ID = ''; // IMS org, e.g. 'ABCDEF0123456789@AdobeOrg'
const LAUNCH_URLS = []; // optional Tags container(s), loaded in the delayed phase

let martechReady = null;

/** @returns {boolean} true once a datastream and org ID are configured */
export function isMartechEnabled() {
  return Boolean(DATASTREAM_ID && ORG_ID);
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

/**
 * Maps the site's consent signal to Adobe's consent standard. The dummy
 * scripts/consent-check.js fires `consent.update`; a real CMP (OneTrust,
 * Cookiebot, ...) should call updateUserConsent the same way. Until a decision
 * arrives the SDK stays in its default `pending` state and queues events.
 */
function listenForConsent() {
  window.addEventListener('consent.update', (ev) => {
    const consented = !!ev.detail?.consented;
    updateUserConsent({
      collect: consented,
      marketing: consented,
      personalize: consented,
      share: consented,
    });
  });
}

/**
 * Initializes the Web SDK. Call once, first thing in loadEager.
 * @returns {Promise|null} resolves when the SDK is ready, null when not configured
 */
export function setupMartech() {
  if (!isMartechEnabled()) return null;
  listenForConsent();
  martechReady = initMartech(
    {
      datastreamId: DATASTREAM_ID,
      orgId: ORG_ID,
      onBeforeEventSend: addPageContext,
      // edgeConfigOverrides: {}, // per-environment datastream overrides
    },
    {
      // Target only runs on pages that opt in with the `target` metadata (any value)
      personalization: !!getMetadata('target'),
      analytics: true,
      launchUrls: LAUNCH_URLS,
      // decisionScopes: ['my-scope'], // extra Target mboxes besides __view__
    },
  );
  return martechReady;
}

/** Eager phase: apply personalization before first paint. */
export async function martechEager() {
  if (!martechReady) return;
  await martechReady.then(pluginEager);
}

/** Lazy phase: data layer + Analytics page view. */
export async function martechLazy() {
  if (!martechReady) return;
  await pluginLazy();
}

/** Delayed phase: Launch containers. */
export async function martechDelayed() {
  if (!martechReady) return;
  await pluginDelayed();
}

/**
 * Tracks a custom event (Analytics + Edge). No-op when martech is not configured.
 * @param {string} name event name (also the data layer event)
 * @param {Object} [xdm] XDM fields
 * @param {Object} [data] extra data, e.g. { __adobe: { analytics: { eVar5: 'x' } } }
 */
export function trackEvent(name, xdm = {}, data = {}) {
  if (!martechReady) return;
  pushEventToDataLayer(name, xdm, data);
}
