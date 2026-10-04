// units.js — show every measurement in both imperial and metric, everywhere.
// Finds things like "24 kg", "40 m", "3.9 km", "7:43/km", "210 lb", "39 in"
// in page text (including text drawn later by other scripts) and adds the
// other system after it: "24 kg (53 lb)". The added part is CSS ::after
// content (data-alt), so code that reads textContent still sees the original
// text and nothing that parses targets or names breaks.
// Skip a block with data-units="done" when it already shows both.
(() => {
  const N = '(\\d{1,3}(?:,\\d{3})+|\\d+(?:\\.\\d+)?)';
  const R = `(?<![\\d.,:/])${N}(?:\\s?[–-]\\s?${N})?`;
  const PER = '(?:\\s?\\/\\s?(?:hand|hd|side|arm|leg))?';
  const num = (s) => Number(String(s).replace(/,/g, ''));
  const trim = (x, dp) => { const v = Number(x.toFixed(dp)); return v >= 1000 ? Math.round(v).toLocaleString() : String(v); };
  const range = (m, f) => (m[2] != null ? `${f(num(m[1]))}–${f(num(m[2]))}` : f(num(m[1])));
  const paceTo = (m, k, u) => { const s = (Number(m[1]) * 60 + Number(m[2])) * k; return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}${u}`; };
  const metres = (v) => (v < 100 ? `${trim(v * 3.28084, 0)} ft` : v < 1600 ? `${trim(v * 1.09361, 0)} yd` : `${trim(v / 1609.344, 2)} mi`);

  // [regex, convert(match) → text, regex that means "the other unit is already here"]
  const RULES = [
    [new RegExp('(?<![\\d:])(\\d{1,2}):(\\d{2})\\s?\\/\\s?km\\b', 'g'), (m) => paceTo(m, 1.609344, '/mi'), /\/\s?mi\b/],
    [new RegExp('(?<![\\d:])(\\d{1,2}):(\\d{2})\\s?\\/\\s?mi\\b', 'g'), (m) => paceTo(m, 1 / 1.609344, '/km'), /\/\s?km\b/],
    [new RegExp(`${R}\\s?km\\/h\\b`, 'g'), (m) => `${range(m, (v) => trim(v / 1.609344, 1))} mph`, /mph\b/],
    [new RegExp(`${R}\\s?(?:km|kms|kilometres|kilometers)\\b(?![/])`, 'g'), (m) => `${range(m, (v) => trim(v / 1.609344, v < 10 ? 2 : 1))} mi`, /\b(?:mi|miles?)\b/],
    [new RegExp(`${R}\\s?(?:mi|miles?)\\b`, 'g'), (m) => `${range(m, (v) => trim(v * 1.609344, 2))} km`, /\bkm\b/],
    [new RegExp(`${R}\\s?(?:kg|kgs)\\b${PER}`, 'g'), (m) => `${range(m, (v) => trim(v * 2.20462, v < 10 ? 1 : 0))} lb`, /\blbs?\b/],
    [new RegExp(`${R}\\s?(?:lb|lbs)\\b${PER}`, 'g'), (m) => `${range(m, (v) => trim(v * 0.45359237, 1))} kg`, /\bkg\b/],
    [new RegExp(`${R}\\s?cm\\b`, 'g'), (m) => `${range(m, (v) => trim(v / 2.54, 1))} in`, /\bin\b|″|"/],
    [new RegExp(`${R}\\s?(?:m|metres|meters)\\b(?![/²'’])`, 'g'), (m) => (m[2] != null ? `${metres(num(m[1])).replace(/ \w+$/, '')}–${metres(num(m[2]))}` : metres(num(m[1]))), /\b(?:ft|yd|feet|yards?)\b/],
    [new RegExp('(?<![\\d.,:/])(\\d+(?:\\.\\d+)?)([¼½¾])?\\s?(?:inches|inch|in)\\b(?=\\s*(?:$|[).,·;:|]))', 'g'), (m) => `${trim((Number(m[1]) + ({ '¼': 0.25, '½': 0.5, '¾': 0.75 }[m[2]] || 0)) * 2.54, 1)} cm`, /\bcm\b/],
  ];
  const SKIP = 'script,style,textarea,input,select,option,svg,code,pre,title,[data-units="done"],[contenteditable],.u-v';

  function annotate(node) {
    const text = node.nodeValue;
    if (!text || !/\d/.test(text)) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const hits = [];
    for (const [re, conv, other] of RULES) {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text))) {
        const a = m.index, b = a + m[0].length;
        const after = text.slice(b, b + 20), before = text.slice(Math.max(0, a - 20), a);
        const otherSrc = other.source;
        if (new RegExp(`^\\s*[(/·|≈~=,]*\\s*≈?\\s*[\\d.,:–-]+\\s*(?:${otherSrc})`).test(after)) continue;
        if (new RegExp(`(?:${otherSrc})\\s*[(/·|≈~=,]*\\s*≈?\\s*$`).test(before)) continue;
        if (hits.some((h) => a < h.b && b > h.a)) continue;
        hits.push({ a, b, alt: conv(m) });
      }
    }
    if (!hits.length) return;
    hits.sort((x, y) => x.a - y.a);
    const frag = document.createDocumentFragment(); let at = 0;
    for (const h of hits) {
      if (h.a > at) frag.appendChild(document.createTextNode(text.slice(at, h.a)));
      const span = document.createElement('span');
      span.className = 'u-v'; span.dataset.alt = ` (${h.alt})`;
      span.textContent = text.slice(h.a, h.b);
      frag.appendChild(span); at = h.b;
    }
    if (at < text.length) frag.appendChild(document.createTextNode(text.slice(at)));
    node.parentNode.replaceChild(frag, node);
  }

  function walk(root) {
    if (root.nodeType === 3) { annotate(root); return; }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const list = []; let n; while ((n = tw.nextNode())) list.push(n);
    list.forEach(annotate);
  }

  const queue = new Set(); let scheduled = false;
  function flush() { scheduled = false; const items = [...queue]; queue.clear(); items.forEach((n) => n.isConnected && walk(n)); }
  function enqueue(n) { queue.add(n); if (!scheduled) { scheduled = true; requestAnimationFrame(flush); } }

  function start() {
    const style = document.createElement('style');
    style.textContent = '.u-v::after{content:attr(data-alt);color:var(--muted,#8e8e93);font-weight:500;font-size:.92em;white-space:nowrap}';
    document.head.appendChild(style);
    walk(document.body);
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'characterData') enqueue(m.target);
        else m.addedNodes.forEach((n) => { if (!(n.nodeType === 1 && n.classList.contains('u-v'))) enqueue(n); });
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  window.Units = { annotate: walk };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
