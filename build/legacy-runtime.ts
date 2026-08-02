/**
 * Inline head scripts for old browsers, injected from nuxt.config.ts.
 *
 * Both run before the module bundle — head scripts are emitted ahead of the
 * entry chunk and ahead of the stylesheet links, which is the same ordering the
 * GitHub Pages 404 restore script already relies on. Both are written in ES5,
 * because they have to parse on an engine that may choke on the bundle itself.
 */

/**
 * Points browsers without cascade-layer support at the flattened stylesheets
 * `build/legacy-css.ts` emitted next to the originals.
 *
 * Vuetify 4's CSS lives entirely inside `@layer`, which an engine that does not
 * know the at-rule discards wholesale — so a Samsung Tizen TV renders the site
 * with no stylesheet at all. Everyone else keeps the layered originals, which
 * are about a third of the size.
 *
 * A MutationObserver covers both the links the parser is about to create and
 * the ones Vite injects later for lazy route chunks — one mechanism for both.
 * `rel=prefetch` links are rewritten too, so the prefetch warms the file that
 * will actually be requested.
 *
 * Every href is resolved before it is matched: the prerendered links are
 * root-relative, but Vite's preload helper assigns an absolute URL
 * (`import.meta.resolve(…)`), so a raw prefix test silently misses every
 * lazily-loaded route chunk.
 *
 * @param assetsPrefix URL path prefix of the build assets, baseURL included
 *                     (`/_nuxt/` in production, `/jw-cast-staging/_nuxt/` on staging)
 */
export function legacyCssSwapScript(assetsPrefix: string) {
  return `(function(){
if ('CSSLayerBlockRule' in window) return;
var P=${JSON.stringify(assetsPrefix)},S='.nolayers.css';
function swap(l){
  var h=l.getAttribute('href'),u;
  if(!h)return;
  try{u=new window.URL(h,document.baseURI||window.location.href);}catch(e){return;}
  if(u.origin!==window.location.origin)return;
  var p=u.pathname;
  if(p.slice(0,P.length)!==P)return;
  if(p.slice(-4)!=='.css'||p.slice(-S.length)===S)return;
  l.setAttribute('href',p.slice(0,-4)+S+u.search);
}
function sweep(){
  var l=document.querySelectorAll('link[rel~="stylesheet"],link[rel="prefetch"][as="style"]');
  for(var i=0;i<l.length;i++)swap(l[i]);
}
if(window.MutationObserver)new window.MutationObserver(sweep).observe(document.documentElement,{childList:true,subtree:true});
sweep();
})();`;
}

/**
 * Buffers boot-time failures, and records which ES2022/2023 methods the engine
 * was missing, for `common/CompatPanel.vue`.
 *
 * The missing-method census has to happen here, ahead of everything else: the
 * polyfills land before any app code runs, so by the time the panel mounts a
 * live probe would report every engine as complete. Errors are captured for the
 * same reason — a TV browser has no console, and a failure that fires before
 * Vue mounts is otherwise invisible to a bug report.
 */
export const COMPAT_PROBE_SCRIPT = `(function(){
var c=window.__compat={errors:[],ua:navigator.userAgent,polyfilled:[]};
var A=Array.prototype;
var probes=[['hasOwn',Object.hasOwn],['at',A.at],['findLast',A.findLast],['findLastIndex',A.findLastIndex],['toSorted',A.toSorted],['toReversed',A.toReversed],['toSpliced',A.toSpliced],['with',A.with]];
for(var i=0;i<probes.length;i++){if(!probes[i][1])c.polyfilled.push(probes[i][0]);}
function push(s){if(c.errors.length<40)c.errors.push(s);}
window.addEventListener('error',function(e){
  if(e.target&&e.target!==window)return push('load: '+(e.target.src||e.target.href||e.target.tagName));
  push('error: '+(e.message||'?')+' @'+String(e.filename||'').split('/').pop()+':'+e.lineno);
},true);
window.addEventListener('unhandledrejection',function(e){
  var r=e.reason;push('reject: '+((r&&(r.message||r))||'?'));
});
})();`;
