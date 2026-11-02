import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  getMetadata,
  readBlockConfig,
  toCamelCase,
  toClassName,
} from './aem.js';
import {
  runExperimentation,
  runExperimentationLazy,
} from './experiment-loader.js';

const experimentationConfig = {
  prodHost: 'www.ustacoaching.com',
  audiences: {
    desktop: () => window.innerWidth >= 1024,
  },
};

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * The page locale prefix: '/es' for Spanish pages, '' for the default (English).
 * @returns {string}
 */
export function localePrefix() {
  return /(^|\/)es(\/|$)/i.test(window.location.pathname) ? '/es' : '';
}

/**
 * aem.js wrapTextNodes wraps a block cell that STARTS with a picture and has more
 * content (picture + paragraphs/headings/lists, or two pictures) into one outer
 * <p> — a <p> holding <p>s. Puts the cell's own children back so each paragraph,
 * heading or picture is a direct child of the cell again.
 * @param {Element} cell a block cell
 */
export function unwrapCellParagraph(cell) {
  const only = cell.children.length === 1 ? cell.firstElementChild : null;
  if (only && only.tagName === 'P' && only.firstElementChild?.tagName === 'PICTURE'
    && only.querySelector(':scope > :is(p, h1, h2, h3, h4, h5, h6, ul, ol), :scope > picture ~ picture')) {
    only.replaceWith(...only.childNodes);
  }
}

let placeholdersPromise;
/**
 * Fetches the locale's placeholders sheet (Key → Text) once per page. Tries the
 * local dev path (/content/…) first, then the delivered path, like the footer.
 * @returns {Promise<Object<string,string>>} placeholders keyed by camel-cased Key
 */
export function fetchPlaceholders() {
  if (!placeholdersPromise) {
    const prefix = localePrefix();
    const candidates = [`/content${prefix}/placeholders.json`, `${prefix}/placeholders.json`];
    placeholdersPromise = (async () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const path of candidates) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const resp = await fetch(path);
          if (resp.ok) {
            // eslint-disable-next-line no-await-in-loop
            const json = await resp.json();
            return Object.fromEntries((json.data || [])
              .filter((row) => row.Key)
              .map((row) => [toCamelCase(row.Key), row.Text || '']));
          }
        } catch { /* try next */ }
      }
      return {};
    })();
  }
  return placeholdersPromise;
}

/**
 * Page templates with their own code: `templates/{name}/{name}.css|js`, picked
 * by the page metadata `Template` (aem.js already adds it as a body class).
 */
const TEMPLATES = ['news-article', 'landing-page'];

/**
 * Applies a Metadata block still sitting in main as <meta> tags. Delivered
 * pages never have one (the backend turns it into <head> meta), but local
 * content previews serve it as-is — without this the template, keywords and
 * breadcrumb title would be missing and the table would render as content.
 * @param {Element} main The main element
 */
function applyInlineMetadata(main) {
  const block = main.querySelector(':scope > div > div.metadata');
  if (!block) return;
  const config = readBlockConfig(block);
  Object.entries(config).forEach(([key, raw]) => {
    const value = Array.isArray(raw) ? raw.join(', ') : raw;
    if (key === 'title') document.title = value;
    let meta = document.head.querySelector(`meta[name="${key}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = key;
      document.head.append(meta);
    }
    meta.content = value;
  });
  const section = block.parentElement;
  block.remove();
  if (!section.children.length) section.remove();
}

/**
 * Loads the page template's CSS and runs its JS (before the page is decorated).
 * @param {Element} main The main element
 */
async function loadTemplate(main) {
  // the local preview can serve the authored key as-is ("Template"); aem.live lowercases it
  const template = toClassName(getMetadata('template') || getMetadata('Template'));
  if (!TEMPLATES.includes(template)) return;
  document.body.classList.add(template); // aem.js only adds it for the lowercase key
  try {
    const css = loadCSS(`${window.hlx.codeBasePath}/templates/${template}/${template}.css`);
    const mod = await import(`../templates/${template}/${template}.js`);
    if (mod.default) await mod.default(main);
    await css;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Loading template ${template} failed`, error);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
/**
 * Applies `.section-metadata` blocks as section classes / data attributes.
 * The vendored aem.js `decorateSections` does not process section metadata,
 * so we handle it here (before sections are decorated). A `style` key becomes
 * one CSS class per token (e.g. "dark" → `.dark`); every other key/value is
 * stored as a `data-*` attribute on the section.
 * @param {Element} main The main element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll(':scope > div > div.section-metadata').forEach((meta) => {
    const section = meta.parentElement;
    const config = readBlockConfig(meta);
    Object.keys(config).forEach((key) => {
      const value = config[key];
      if (!value) return;
      if (key === 'style') {
        value.split(',').map((s) => toClassName(s.trim())).filter(Boolean)
          .forEach((s) => {
            section.classList.add(s);
            // `narrow-N`: the section's content on N of 12 grid columns (styles.css)
            const span = Number((s.match(/^narrow-(\d+)$/) || [])[1]);
            if (span >= 1 && span <= 12) {
              section.style.setProperty('--section-span', span);
              section.classList.add('narrow-cols');
            }
          });
      } else {
        section.dataset[toCamelCase(key)] = value;
      }
    });
    meta.remove();
  });
}

/**
 * The homepage intro statement ("If tennis starts with love, coaches are the
 * beating heart. Discover the new community for coaches like you.") is a big
 * centred bold statement with two brand-coloured phrases. Colour is authored
 * SEMANTICALLY in the document — italic (<em>) → lime, underline (<u>) → blue
 * (see the `main em` / `main u` rules in styles.css) — so this only needs to
 * add the `.intro-statement` class that drives the large centred typography.
 * Detected by a fully-bold paragraph carrying an <em> or <u> accent, so there
 * is NO hardcoded phrase. "Fully bold" tolerates the bold being split into
 * several <strong> runs (DA/markdown round-trips do this, sometimes nesting one
 * as <em><strong>). No-op on pages without such a statement.
 * @param {Element} main The main element
 */
function decorateIntroStatement(main) {
  // homepage display statement only — a bold+italic paragraph in a news article
  // is ordinary copy (it would otherwise be centred and enlarged)
  if (document.body.classList.contains('news-article')) return;
  main.querySelectorAll('p').forEach((p) => {
    if (!p.querySelector('strong') || !p.querySelector('em, u')) return;
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.textContent.trim() && !node.parentElement.closest('strong')) return;
    }
    const section = p.closest('.section') || p.closest('div');
    if (section) section.classList.add('intro-statement');
  });
}

// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSectionMetadata(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateIntroStatement(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  const main = doc.querySelector('main');
  if (main) applyInlineMetadata(main);
  decorateTemplateAndTheme();
  await runExperimentation(doc, experimentationConfig);
  if (main) {
    await loadTemplate(main);
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection; the site's 1024 breakpoint) or fonts already
       loaded, load fonts.css */
    if (window.innerWidth >= 1024 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));
  await runExperimentationLazy(doc, experimentationConfig);

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load third-party martech (chat, etc.) well after LCP — see scripts/delayed.js
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
