/**
 * Inline head scripts for old browsers, injected from nuxt.config.ts.
 *
 * Both must run before the module bundle: the polyfills because Vue and Vuetify
 * reach for these methods during the very first render, and the probe because
 * the errors worth seeing are the ones that stop the app from mounting at all.
 * Head scripts are emitted ahead of the entry chunk, which is the same ordering
 * the GitHub Pages 404 restore script already relies on.
 *
 * Written in ES5 for the same reason — they have to parse on an engine that may
 * choke on the bundle itself.
 */

/**
 * ES2022/ES2023 methods Vue, Vuetify and vue-router call unconditionally, each
 * newer than the Chromium in a Samsung Tizen TV:
 *
 * - `Object.hasOwn` (Cr 93) — Vuetify's prop/defaults merge, on every component
 * - `Array.prototype.at` (Cr 92) — vue-router's route matching
 * - `Array.prototype.findLast` (Cr 97) — Vuetify's ripple, on every click
 * - `toSorted`/`toReversed`/`toSpliced` (Cr 110) — Vuetify's text highlighting
 *   and Vue's reactive array instrumentation
 *
 * Defined non-enumerably: a plain assignment would show up in `for…in` over an
 * array and break code that iterates indices.
 */
export const LEGACY_POLYFILL_SCRIPT = `(function(){
var missing=[];
function def(o,n,f){if(o[n])return;if(missing.indexOf(n)<0)missing.push(n);try{Object.defineProperty(o,n,{value:f,writable:true,configurable:true,enumerable:false});}catch(e){o[n]=f;}}
var A=Array.prototype,S=String.prototype;
def(Object,'hasOwn',function(o,k){return Object.prototype.hasOwnProperty.call(Object(o),k);});
function at(n){var l=this.length;n=Math.trunc(Number(n))||0;if(n<0)n+=l;return n<0||n>=l?undefined:this[n];}
def(A,'at',at);def(S,'at',at);
def(A,'findLast',function(f,t){for(var i=this.length-1;i>=0;i--){if(f.call(t,this[i],i,this))return this[i];}});
def(A,'findLastIndex',function(f,t){for(var i=this.length-1;i>=0;i--){if(f.call(t,this[i],i,this))return i;}return -1;});
def(A,'toSorted',function(c){return A.slice.call(this).sort(c);});
def(A,'toReversed',function(){return A.slice.call(this).reverse();});
def(A,'toSpliced',function(){var a=A.slice.call(this);A.splice.apply(a,arguments);return a;});
def(A,'with',function(i,v){var a=A.slice.call(this);a[i<0?i+a.length:i]=v;return a;});
window.__compat=window.__compat||{errors:[]};window.__compat.polyfilled=missing;
})();`;

/**
 * Buffers boot-time failures for common/CompatPanel.vue. A TV browser has no
 * console and no devtools, so an error that fires before Vue mounts is
 * otherwise completely invisible to a bug report.
 */
export const COMPAT_PROBE_SCRIPT = `(function(){
var c=window.__compat=window.__compat||{};c.errors=c.errors||[];c.ua=navigator.userAgent;
function push(s){if(c.errors.length<40)c.errors.push(s);}
window.addEventListener('error',function(e){
  if(e.target&&e.target!==window)return push('load: '+(e.target.src||e.target.href||e.target.tagName));
  push('error: '+(e.message||'?')+' @'+String(e.filename||'').split('/').pop()+':'+e.lineno);
},true);
window.addEventListener('unhandledrejection',function(e){
  var r=e.reason;push('reject: '+((r&&(r.message||r))||'?'));
});
})();`;
