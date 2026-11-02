# Data layer findings: ustacoaching.com

Source site: https://www.ustacoaching.com/en/home.html
Investigated: 2026-10-27 and 2026-10-28
Purpose: understand how tracking works on the source site before building the data layer in Edge Delivery Services (EDS).

## 1. Summary

- The source site has **no designed data layer**. `window.dataLayer` exists only as a side effect of Google's `gtag()` and OneTrust.
- The site's real analytics run through **Adobe Launch** (property "Coaching") into **Adobe Analytics**, **Adobe Target** and the Experience Cloud ID service.
- Adobe Launch also **injects** the Google Ads (`gtag.js`), Meta Pixel and TikTok Pixel snippets. None of them is written in the page HTML.
- Only Google's `gtag.js` reads `dataLayer`, and only its `Arguments` entries cause any action. Nothing else on the site was found reading it.
- **Nothing here is a data layer contract to port.** The EDS team decides what the layer contains, then wires Launch to it.

## 2. Contents of `window.dataLayer` on the home page

| # | Entry | Created by | When | Effect |
|---|---|---|---|---|
| 0 | `set developer_id.dYWJhMj true` | `gtag.js` | Library loads | Marker only. No request. |
| 1 | `consent update {ad_storage, analytics_storage, ad_user_data, ad_personalization}` | OneTrust Google integration | Load, from the saved consent choice | Sets Google consent flags. Visible as `gcs=` and `npa=` in later requests. Not present for a visitor with no saved choice. |
| 2 | `OneTrustLoaded` | OneTrust | SDK loaded | Logged only |
| 3 | `OptanonLoaded` | OneTrust | Banner config ready (older name) | Logged only |
| 4 | `OneTrustGroupsUpdated` | OneTrust | Consent set or changed | Logged only |
| 5 | `js <date>` | Launch snippet: `gtag('js', new Date())` | Page load | Initialises the tag |
| 6 | `config AW-17059435017` | Launch snippet: `gtag('config', …)` | Page load | Sends the Google Ads page view and view-through request |
| 7 | `event conversion {send_to: AW-17059435017/geGdCLK0kpccEImkycY_}` | Launch rule "coaching homepage" | Page bottom, `/en/home.html` only | Sends a Google Ads conversion request |
| 8 | `gtm.dom` | `gtag.js` | DOM ready | Google lifecycle marker |
| 9 | `gtm.load` | `gtag.js` | Window load | Google lifecycle marker |

Entries 0, 1, 5, 6 and 7 are `Arguments` objects (pushed by `gtag()`). The others are plain `{event: …}` objects. Each carries a `gtm.uniqueEventId` stamped by Google's `push`.

The array holds only commands and consent state. It stores **no page details**: the page URL and title are read by `gtag.js` when it sends a request and appear only in the network call.

## 3. How it is built

- The page HTML loads OneTrust (`OtAutoBlock.js`, `otSDKStub.js`, `OptanonWrapper`), an inline `window.coaching` config, and the Launch library (`//assets.adobedtm.com/15c795eb812c/9e037e5cb138/launch-969a4d3cba82.min.js`, async).
- The Launch rule **"PS-5814 Rule 1 Global rule for Coaching"** (trigger: Library Loaded) holds custom-code actions that inject the Meta Pixel, `gtag.js` (creating `window.dataLayer` and `gtag()`) and the TikTok Pixel.
- The rule has no path condition in the compiled library, so it should run on every page that loads Launch.
- `dataLayer.push` is replaced by Google's function. It copies each push into Google's internal queue, calls the native push, trims the array past about 100 entries, then processes the queue.

## 4. Adobe Launch rules (from the compiled library)

| Rule | Trigger | Notes |
|---|---|---|
| PS-5814 Rule 1 Global rule for Coaching | Library Loaded | Injects Meta, gtag and TikTok |
| coaching homepage | Page Bottom, path `/en/home.html` | Google Ads conversion |
| PS-5814 Material Pixel rules (Join, Sign In, BASELINE, RALLY, PRO, PRO_PLUS) | Click on `button.coaching-primary-button[data-code=…]` or the sign-in button, 100 ms anchor delay | Ad-pixel events |
| Page load | Library Loaded | Sets Adobe variables, sends the page-view beacon |
| Global Functions | Library Loaded | Defines `globalCoachingAnalyticsFunctions` |
| Load Target | Library Loaded | Adobe Target |
| Global Variables, Breadcrumb, Accordion, Link Click, User Login, User Registration | Page Bottom | Set Adobe variables |
| Quiz, Wizard, Lead Modal, News Search Submitted, Membership Purchase Completed | Direct Call | See identifiers below |

**Direct-call identifiers** (called with `_satellite.track`): `quiz_triggered`, `wizard_triggered`, `leadModal_subscribe`, `news_search_submitted`, `membership_purchase_completed`.

**Click helpers** (`window.globalCoachingAnalyticsFunctions`):
- `sendClickEvent(value)`: `event9`, `eVar15 = ustacoaching:<window.coaching.pageAttr.name>:<value>`, `prop15 = D=v15`, link name "Link Click".
- `sendCustomClickEvent(value, eventName)`: same, with the value and link name passed in.

**Adobe beacon on the home page:** `pageName=ustacoaching:home`, `v74=logged out`, report suite `usta.global`.

## 5. Vendors

| Vendor | Evidence | Reads `dataLayer`? |
|---|---|---|
| Google Ads (`AW-17059435017`) via `gtag.js` | `gtag/js?id=AW-17059435017`, requests to `doubleclick.net`, `google.com/pagead`, `googlesyndication.com` | **Yes** (it owns `push`) |
| Adobe Analytics, Target, ECID, Audience Manager | `omtrdc.net`, `demdex.net`, `adobedtm.com` | No. Runs from Launch rules and `s.tl` calls. |
| Adobe Advertising Cloud | `cm.everesttech.net` | No |
| Meta Pixel `1064539792522092` | `fbq(...)` snippet | No. Initialised **twice**. |
| TikTok Pixel `COKNFLBC77U7P5ED4CV0` | `ttq` snippet | No |
| AppNexus, The Trade Desk | `acdn.adnxs.com`, `js.adsrvr.org` | No |
| Hotjar (5353315), Zendesk, Feroot, OneTrust, Adobe RUM | Script loads | No |

## 6. Google Ads: what is sent and what it means

- **gtag.js is the tag, not GTM.** The script is `gtag/js?id=AW-…`, the `google_tag_manager` object holds only `AW-17059435017`, and no `GTM-` container ID appears anywhere.
- **`AW-17059435017`** is the Google Ads account (conversion ID). **`geGdCLK0kpccEImkycY_`** is the label of the conversion action ("Page View - Coaching conversion page").
- **`doubleclick.net` is a Google ad hostname, not a separate vendor.** The host varies with consent and ping type. Read `en=` (`gtag.config` or `page_view` is the page view, `conversion` is the conversion), not the host.
- **This is measurement, not ad serving.** USTA is an advertiser. Its ads appear elsewhere (Search, YouTube, partner sites). The tag reports visits and conversions after a click or view.
- **The conversion fires on every home-page view.** It is a Launch rule limited to `/en/home.html`, not tied to a click or form. Google Ads credits it to a campaign only when it can match the visit to an ad click or view.
- **The page view is sent by `gtag('config')`.** `send_page_view` defaults to true and the site does not override it.

### Request parameters seen

| Parameter | Meaning |
|---|---|
| `gcs=G1xy` | `x` is `ad_storage`, `y` is `analytics_storage`. `1` is granted, `0` is denied. |
| `npa=1` | Non-personalised ads |
| `pscdl=denied` | Cookie access denied |
| `auid=`, `gcl_ctr=` | Cookie-derived ad identifiers, present only with ad consent |

## 7. Consent behaviour observed

| Consent state | Active groups | `consent update` flags | `gcs` | `npa` | Hosts used |
|---|---|---|---|---|---|
| Fresh visitor | `C0001` | no `consent update` entry seen | not captured | not captured | `googleads.g.doubleclick.net` |
| Analytics and functional allowed | `C0001,C0002,C0003` | analytics `granted`, three ad flags `denied` | `G101` | `1` | `googlesyndication.com`, `google.com/pagead/uconversion` |
| Targeting allowed | `C0001,C0002,C0004` | all four `granted` | `G111` | `0` | `googleads.g.doubleclick.net`, `google.com`, `google.co.in` (`1p-conversion`) |
| After a banner-close action in the test session | not recorded | not recorded | `G110`, decoded as analytics denied | `0` | `googleads.g.doubleclick.net` (blocked by a client extension) |

Other consent facts:
- `OnetrustActiveGroups` lists the allowed categories. `C0001` necessary, `C0002` analytics, `C0003` functional, `C0004` targeting, `C0005` social. The IDs can be renamed in the OneTrust admin, so confirm them there.
- `OneTrustLoaded`, `OptanonLoaded` and `OneTrustGroupsUpdated` are each a snapshot. The current state is the latest `OneTrustGroupsUpdated` or `window.OnetrustActiveGroups`.
- **OneTrust blocks scripts until consent.** A stack trace shows `substitutePlainTextScriptTags` → `unBlockTag` → `reactivateScriptTag` leading to the Meta Pixel running after the banner closed.
- **Site cookie groups** (`window.coaching.cookies`): `analyticsUserUaid`, `userLogin_success`, `accountRegistration_success` need `C0002`. `notification-closed` needs `C0003`. `oauth_state` and `wcmmode` are `C0001`.

## 8. What `gtag.js` does with the OneTrust events

From the downloaded library (460 KB, minified):
- It contains no references to `OneTrust`, `Optanon` or `OnetrustActiveGroups`.
- Its built-in rules match only on the event names `gtm.init`, `gtag.config` and `gtm.js`. None matches `OneTrustLoaded`, `OptanonLoaded`, `OneTrustGroupsUpdated`, `gtm.dom` or `gtm.load`.
- It pushes `gtm.dom` and `gtm.load` itself, at DOM ready and window load. `gtm.load` also has some internal handling that was not traced.
- Conclusion: it ingests the OneTrust events through its `push` and I found no action taken on them.

## 9. Pages covered

All 112 URLs in `sitemap.xml` returned 200 and include the Launch script. None has `gtag` or `AW-17059435017` written in the HTML. So the Google Ads config and page view should run on all of them, and only the home page sends the conversion. This was a check of the raw HTML only.

## 10. Issues found

1. **The conversion is not tied to a user action.** It reports every home-page view as a conversion.
2. **The Meta Pixel is initialised twice.** Meta's own console warning says `Duplicate Pixel ID: 1064539792522092`.
3. **The page data sent to Adobe is thin.** Only `pageName` and `v74` (logged in or out) are sent on load.
4. **A Google Maps API key is in the page source.** Confirm it is restricted by referrer.
5. **Several Google Ads requests returned 503 in one capture.** The cause is not known. The same requests failed with consent denied and with consent granted.

## 11. Recommendations for EDS

1. **Do not write a gtag script.** Load the same Launch library and its rule brings gtag, Meta and TikTok back. Inject it from `scripts/scripts.js` or `scripts/delayed.js`, because `head.html` must not be changed.
2. **Load OneTrust first** (`OtAutoBlock.js`, `otSDKStub.js`, `OptanonWrapper`), so consent is set before Launch injects any pixel.
3. **Recreate what Launch reads:**
   - `window.coaching.pageAttr.name`, used for `pageName` and `eVar15`.
   - The logged-in state used for `v74`.
   - The click helpers, or an equivalent that sets the same `event9`, `eVar15` and `prop15`.
4. **Keep the direct-call identifiers** (`quiz_triggered`, `wizard_triggered`, `leadModal_subscribe`, `news_search_submitted`, `membership_purchase_completed`) so the existing Launch rules keep working.
5. **Keep the cookie-to-consent mapping** in `window.coaching.cookies`, including the `userLogin_success` and `accountRegistration_success` names.
6. **Design a real event layer** on top: a page object (name, template, language, user state) and event objects for clicks, login, registration, quiz, lead modal and purchase.
7. **Review the Launch property for EDS:**
   - Check whether the library or rules depend on the source hostname, or whether a staging or dev Launch environment is needed.
   - Update the conversion rule's path, which is currently `/en/home.html`.
   - Remove the duplicate Meta Pixel snippet.
   - Decide with the Google Ads owner whether the conversion should fire on a real action.
8. **If Launch is dropped for Google Ads**, load `gtag.js` yourself after checking `OnetrustActiveGroups`, call `config` with `send_page_view: false` if you need to control the timing, and keep `js`, `config`, then events in that order.

## 12. Not verified

- Runtime behaviour on any page other than the home page.
- The zero-consent and Accept All states in a single clean network capture. Captures started late, listed few requests, and some were affected by a blocking extension, so absence of Meta, TikTok, Hotjar, AppNexus or The Trade Desk requests in them is not proof they were blocked.
- Which OneTrust category gates the Meta and TikTok pixels.
- The exact OneTrust to Google Consent Mode mapping (read from the flags observed, not from the OneTrust configuration).
- Whether any script other than `gtag.js` reads `dataLayer`. The Launch library showed only the gtag snippet that creates it. A wider search of the other scripts was not completed.
- Whether any page serves actual Google ads. None of the home-page requests or scripts used ad-serving code (`securepubads`, `adsbygoogle`, `gampad`), and the all-pages scan for it was not completed.
- Launch rule selectors and conditions, which come from the compiled library and were not seen in the Launch UI.
- Interaction events (quiz, lead modal, login, registration, purchase), which are inferred from rule names and the click helper code and were not observed firing.
