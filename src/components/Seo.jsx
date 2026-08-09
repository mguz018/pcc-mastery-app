import { useEffect } from 'react';

// Imperative head management. react-helmet-async 2.x silently fails to update
// the document head under React 18 StrictMode, so every page was sharing the
// homepage title/canonical/description — bad for SEO. This updates the head
// directly on each route change instead, which Google's renderer picks up.
const BASE = 'https://pccmastery.com';
const DEFAULT_TITLE = 'PCC Mastery — Practice the Real ICF PCC Exam Format';

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function Seo({ title, description, path, noindex = false }) {
  const full = title ? `${title} | PCC Mastery` : DEFAULT_TITLE;
  const url = `${BASE}${path || ''}`;

  useEffect(() => {
    document.title = full;
    upsertLink('canonical', url);
    upsertMeta('property', 'og:title', full);
    upsertMeta('property', 'og:url', url);
    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
    }
    const robots = document.head.querySelector('meta[name="robots"]');
    if (noindex) upsertMeta('name', 'robots', 'noindex, nofollow');
    else if (robots) robots.remove();
  }, [full, description, url, noindex]);

  return null;
}
