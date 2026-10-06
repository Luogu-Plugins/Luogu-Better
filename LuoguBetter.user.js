// ==UserScript==
// @name         Luogu Better!
// @namespace    https://github.com/Luogu-Plugins/Luogu-Better
// @version      1.0.0
// @description  更好的洛谷！
// @author       Luogu-Plugins
// @license      MIT
// @match        https://www.luogu.com.cn/*
// @icon         https://fecdn.luogu.com.cn/columba/static.325908fec383795b.logo-single-color.svg
// @require      https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js
// @homepageURL  https://github.com/Luogu-Plugins/Luogu-Better
// @supportURL   https://github.com/Luogu-Plugins/Luogu-Better/issues
// @updateURL    https://github.com/Luogu-Plugins/Luogu-Better/releases/latest/download/LuoguBetter.user.js
// @downloadURL  https://github.com/Luogu-Plugins/Luogu-Better/releases/latest/download/LuoguBetter.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      www.luogu.com.cn
// @connect      *.luogu.com.cn
// @connect      cdn.luogu.com.cn
// @connect      fecdn.luogu.com.cn
// @connect      api.github.com
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    const LB = {
        ID: 'luogu-better',
        NAME: 'Luogu Better!',
        VERSION: '1.0.0',
        P: 'lgb',
        STORE_KEY: 'luogu-better.settings',
        MEDIA_DB: 'luogu-better',
        MEDIA_STORE: 'media',
        REPO_OWNER: 'Luogu-Plugins',
        REPO_NAME: 'Luogu-Better',
        modules: new Map(),
        started: [],
        url: location.href,

        log(...args) {
            console.log(
                `%c${this.NAME}%c v${this.VERSION}`,
                'background:#5e6ad2;color:#fff;padding:1px 6px;border-radius:3px 0 0 3px;font-weight:700',
                'background:#2b2b33;color:#cfcfd8;padding:1px 6px;border-radius:0 3px 3px 0',
                ...args
            );
        },
        warn(...args) {
            console.warn(`[${this.NAME}]`, ...args);
        },
        error(...args) {
            console.error(`[${this.NAME}]`, ...args);
        },

        define(name, factory) {
            this.modules.set(name, factory);
        },
    };

    try {
        LB.VERSION = (typeof GM_info !== 'undefined' && GM_info?.script?.version) || LB.VERSION;
    } catch (_) {}

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function el(tag, props = null, ...children) {
        const node = document.createElement(tag);
        if (props) {
            for (const [key, value] of Object.entries(props)) {
                if (value === null || value === undefined || value === false) continue;
                if (key === 'class' || key === 'className') {
                    node.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
                } else if (key === 'style') {
                    if (typeof value === 'string') node.style.cssText = value;
                    else Object.assign(node.style, value);
                } else if (key === 'text') {
                    node.textContent = String(value);
                } else if (key === 'html') {
                    node.innerHTML = value;
                } else if (key === 'dataset') {
                    Object.assign(node.dataset, value);
                } else if (key.startsWith('on') && typeof value === 'function') {
                    node.addEventListener(key.slice(2).toLowerCase(), value);
                } else if (key in node) {
                    try {
                        node[key] = value;
                    } catch (_) {
                        node.setAttribute(key, String(value));
                    }
                } else {
                    node.setAttribute(key, String(value));
                }
            }
        }
        append(node, children);
        return node;
    }

    function append(parent, children) {
        for (const child of children) {
            if (child === null || child === undefined || child === false) continue;
            if (Array.isArray(child)) append(parent, child);
            else parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
        }
        return parent;
    }

    function on(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        return () => target.removeEventListener(type, handler, options);
    }

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const raf = () => new Promise((r) => requestAnimationFrame(() => r()));

    function debounce(fn, wait = 120) {
        let timer = null;
        const wrapped = (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), wait);
        };
        wrapped.cancel = () => clearTimeout(timer);
        return wrapped;
    }

    function throttle(fn, wait = 120) {
        let last = 0;
        let timer = null;
        return (...args) => {
            const now = Date.now();
            const remain = wait - (now - last);
            if (remain <= 0) {
                clearTimeout(timer);
                timer = null;
                last = now;
                fn(...args);
            } else if (!timer) {
                timer = setTimeout(() => {
                    last = Date.now();
                    timer = null;
                    fn(...args);
                }, remain);
            }
        };
    }

    /**
      * @param {() => Element|null} condition
      * @param {{ timeout?: number, interval?: number, root?: Document }} options
      */
    function waitFor(condition, { timeout = 10000, interval = 100, root = document } = {}) {
        return new Promise((resolve) => {
            const hit = condition();
            if (hit) return resolve(hit);
            const started = Date.now();
            const timer = setInterval(() => {
                const value = condition();
                if (value) {
                    clearInterval(timer);
                    resolve(value);
                } else if (Date.now() - started > timeout) {
                    clearInterval(timer);
                    resolve(null);
                }
            }, interval);
        });
    }

    function domReady() {
        if (document.readyState === 'complete' || document.readyState === 'interactive') return Promise.resolve();
        return new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }

    function styleSheet(id, css, { raise = false } = {}) {
        let node = document.getElementById(id);
        if (!node) {
            const host = document.head || document.documentElement;
            if (!host) {
                LB.warn(`文档还没准备好，暂时无法注入样式 #${id}`);
                return null;
            }
            node = document.createElement('style');
            node.id = id;
            host.append(node);
        }
        if (css !== undefined) node.textContent = css;
        if (raise) raiseStyle(id);
        return node;
    }

    function raiseStyle(id) {
        const node = document.getElementById(id);
        const head = document.head || document.documentElement;
        if (node && node.parentElement === head && head.lastElementChild !== node) head.append(node);
        return node;
    }

    let toastTimer = null;
    function toast(message, type = 'info', duration) {
        const ID = `${LB.P}-toast`;
        document.getElementById(ID)?.remove();
        clearTimeout(toastTimer);
        const colors = { info: '#333', ok: '#2b8a3e', error: '#c0392b' };
        const node = el('div', {
            id: ID,
            text: message,
            style: {
                position: 'fixed', zIndex: '2147483647', left: '50%', bottom: '42px',
                transform: 'translateX(-50%)', padding: '9px 16px', borderRadius: '6px',
                fontSize: '14px', lineHeight: '1.5', color: '#fff', pointerEvents: 'none',
                boxShadow: '0 3px 12px rgba(0,0,0,.25)', transition: 'opacity .3s',
                background: colors[type] || colors.info, fontFamily: 'inherit',
                maxWidth: '70vw', textAlign: 'center',
            },
        });
        document.body.append(node);
        const hide = () => {
            node.style.opacity = '0';
            setTimeout(() => node.remove(), 350);
        };
        toastTimer = setTimeout(hide, duration || (type === 'error' ? 3600 : 1800));
        return node;
    }

    function compareVersion(a, b) {
        const pa = String(a).replace(/^v/i, '').split(/[.\-+]/).map((x) => parseInt(x, 10) || 0);
        const pb = String(b).replace(/^v/i, '').split(/[.\-+]/).map((x) => parseInt(x, 10) || 0);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const x = pa[i] || 0;
            const y = pb[i] || 0;
            if (x !== y) return x > y ? 1 : -1;
        }
        return 0;
    }

    function request(url, { method = 'GET', headers = {}, timeout = 15000, responseType = 'text' } = {}) {
        const canGm = typeof GM_xmlhttpRequest === 'function';
        const sameOrigin = (() => {
            try {
                return new URL(url, location.href).origin === location.origin;
            } catch (_) {
                return false;
            }
        })();

        if (!canGm || sameOrigin) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);
            return fetch(url, { method, headers, signal: controller.signal, credentials: 'same-origin' })
                .then(async (res) => {
                    clearTimeout(timer);
                    const text = await res.text();
                    return { ok: res.ok, status: res.status, text, headers: res.headers };
                })
                .catch((err) => {
                    clearTimeout(timer);
                    if (canGm) return requestViaGm(url, { method, headers, timeout, responseType });
                    throw err;
                });
        }
        return requestViaGm(url, { method, headers, timeout, responseType });
    }

    function requestViaGm(url, { method, headers, timeout, responseType }) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url,
                headers,
                timeout,
                responseType,
                onload: (res) => resolve({ ok: res.status >= 200 && res.status < 300, status: res.status, text: res.responseText, headers: res.responseHeaders }),
                onerror: () => reject(new Error('网络请求失败')),
                ontimeout: () => reject(new Error('网络请求超时')),
            });
        });
    }

    const Store = {
        get hasGm() {
            return typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
        },

        get(key, fallback = null) {
            try {
                if (this.hasGm) {
                    const raw = GM_getValue(key, null);
                    return raw === null || raw === undefined ? fallback : raw;
                }
                const raw = localStorage.getItem(key);
                return raw === null ? fallback : JSON.parse(raw);
            } catch (err) {
                LB.warn('读取设置失败：', key, err);
                return fallback;
            }
        },

        set(key, value) {
            try {
                if (this.hasGm) {
                    GM_setValue(key, value);
                    return true;
                }
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (err) {
                LB.warn('保存设置失败：', key, err);
                return false;
            }
        },

        del(key) {
            try {
                if (this.hasGm) {
                    if (typeof GM_deleteValue === 'function') GM_deleteValue(key);
                    else GM_setValue(key, null);
                } else {
                    localStorage.removeItem(key);
                }
            } catch (err) {
                LB.warn('删除设置失败：', key, err);
            }
        },
    };

    const MediaDB = {
        _db: null,

        open() {
            if (this._db) return Promise.resolve(this._db);
            return new Promise((resolve, reject) => {
                if (typeof indexedDB === 'undefined') return reject(new Error('当前环境不支持 IndexedDB'));
                const req = indexedDB.open(LB.MEDIA_DB, 1);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(LB.MEDIA_STORE)) db.createObjectStore(LB.MEDIA_STORE);
                };
                req.onsuccess = () => {
                    this._db = req.result;
                    resolve(this._db);
                };
                req.onerror = () => reject(req.error || new Error('打开 IndexedDB 失败'));
            });
        },

        async put(key, value) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(LB.MEDIA_STORE, 'readwrite');
                tx.objectStore(LB.MEDIA_STORE).put(value, key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
            });
        },

        async get(key) {
            try {
                const db = await this.open();
                return await new Promise((resolve, reject) => {
                    const tx = db.transaction(LB.MEDIA_STORE, 'readonly');
                    const req = tx.objectStore(LB.MEDIA_STORE).get(key);
                    req.onsuccess = () => resolve(req.result ?? null);
                    req.onerror = () => reject(req.error);
                });
            } catch (err) {
                LB.warn('读取媒体失败：', key, err);
                return null;
            }
        },

        async del(key) {
            try {
                const db = await this.open();
                return await new Promise((resolve, reject) => {
                    const tx = db.transaction(LB.MEDIA_STORE, 'readwrite');
                    tx.objectStore(LB.MEDIA_STORE).delete(key);
                    tx.oncomplete = () => resolve(true);
                    tx.onerror = () => reject(tx.error);
                });
            } catch (err) {
                LB.warn('删除媒体失败：', key, err);
                return false;
            }
        },

        toURL(value) {
            if (!value) return '';
            if (typeof value === 'string') return value;
            return URL.createObjectURL(value);
        },
    };

    const DEFAULT_SETTINGS = {
        cardBlur: 2,
        cardOpacity: 80,
        cardRadius: 15,
        imageRadius: 15,

        cardBlurOn: true,
        cardRadiusOn: true,
        imageRadiusOn: true,
        adBlockOn: true,

        benbenOn: true,
        imageHostingOn: true,
        contestOn: true,

        bgFullscreen: true,
        bgSource: 'theme',

        bg: {
            currentId: null,
            random: true,
            blur: 0,
            brightness: 100,
            saturate: 100,
            overlay: 0,
            navOpacity: 0,
            articleTransparent: true,
            globalGlass: false,
        },

        customCss: '',
        updateChannel: 'stable',
    };

    const Config = {
        data: structuredClone(DEFAULT_SETTINGS),
        _subs: new Map(),
        _loaded: false,

        load() {
            const saved = Store.get(LB.STORE_KEY, null);
            if (saved && typeof saved === 'object') {
                this.data = this._merge(structuredClone(DEFAULT_SETTINGS), saved);
            }
            this._loaded = true;
            return this.data;
        },

        _merge(base, patch) {
            for (const [key, value] of Object.entries(patch || {})) {
                if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object') {
                    this._merge(base[key], value);
                } else if (value !== undefined) {
                    base[key] = value;
                }
            }
            return base;
        },

        get(key) {
            return this.data[key];
        },

        getIn(path) {
            return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), this.data);
        },

        setIn(path, value) {
            const keys = path.split('.');
            const last = keys.pop();
            const target = keys.reduce((acc, k) => (acc[k] ??= {}), this.data);
            target[last] = value;
        },

        set(key, value, { silent = false } = {}) {
            if (key.includes('.')) {
                if (this.getIn(key) === value) return value;
                this.setIn(key, value);
            } else {
                if (this.data[key] === value) return value;
                this.data[key] = value;
            }
            this.save();
            if (!silent) this._emit(key, value);
            return value;
        },

        patch(partial, { silent = false } = {}) {
            const changed = [];
            for (const [key, value] of Object.entries(partial)) {
                if (this.data[key] !== value) {
                    this.data[key] = value;
                    changed.push(key);
                }
            }
            if (changed.length) {
                this.save();
                if (!silent) changed.forEach((k) => this._emit(k, this.data[k]));
            }
            return changed;
        },

        save: debounce(function saveSettings() {
            Store.set(LB.STORE_KEY, Config.data);
        }, 200),

        saveNow() {
            this.save.cancel();
            Store.set(LB.STORE_KEY, this.data);
        },

        on(key, callback) {
            if (!this._subs.has(key)) this._subs.set(key, new Set());
            this._subs.get(key).add(callback);
            return () => this._subs.get(key)?.delete(callback);
        },

        _emit(key, value) {
            this._subs.get(key)?.forEach((cb) => {
                try {
                    cb(value, key);
                } catch (err) {
                    LB.error(`设置 ${key} 的订阅回调出错：`, err);
                }
            });
        },

        notify(keys) {
            for (const key of keys) this._emit(key, this.getIn(key));
        },

        reset() {
            this.data = structuredClone(DEFAULT_SETTINGS);
            this.saveNow();
            for (const key of new Set([...Object.keys(DEFAULT_SETTINGS), ...this._subs.keys()])) {
                this._emit(key, this.get(key));
            }
        },
    };

    const Spa = {
        _navSubs: new Set(),
        _installed: false,

        install() {
            if (this._installed) return;
            this._installed = true;

            for (const method of ['pushState', 'replaceState']) {
                const original = history[method];
                history[method] = function patched(...args) {
                    const result = original.apply(this, args);
                    Spa._check();
                    return result;
                };
            }

            window.addEventListener('popstate', () => this._check());

            new MutationObserver(throttle(() => this._check(), 200)).observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
            setInterval(() => this._check(), 1000);
        },

        _check() {
            if (location.href === LB.url) return;
            const from = LB.url;
            LB.url = location.href;
            this._navSubs.forEach((cb) => {
                try {
                    cb(location.href, from);
                } catch (err) {
                    LB.error('路由回调出错：', err);
                }
            });
        },

        onNavigate(callback) {
            this.install();
            this._navSubs.add(callback);
            return () => this._navSubs.delete(callback);
        },
    };

    /**
      * @param {string} id
      * @param {() => void} create
      * @param {number} interval
      */
    function keepAlive(id, create, interval = 1200) {
        const run = () => {
            if (document.getElementById(id)) return;
            try {
                create();
            } catch (err) {
                LB.error(`重建 #${id} 失败：`, err);
            }
        };
        run();
        const timer = setInterval(run, interval);
        Spa.onNavigate(run);
        return () => clearInterval(timer);
    }

    function observeAdded(selector, callback, { root = null, once = false } = {}) {
        const target = root || document.body || document.documentElement;
        if (!target) {
            LB.warn(`文档还没准备好，观察 ${selector} 失败`);
            return null;
        }
        const seen = new WeakSet();
        const handle = (node) => {
            if (!(node instanceof Element)) return;
            const hits = node.matches(selector) ? [node, ...$$(selector, node)] : $$(selector, node);
            for (const hit of hits) {
                if (seen.has(hit)) continue;
                seen.add(hit);
                callback(hit);
                if (once) {
                    observer.disconnect();
                    return;
                }
            }
        };
        const observer = new MutationObserver((records) => {
            for (const record of records) record.addedNodes.forEach(handle);
        });
        observer.observe(target, { childList: true, subtree: true });
        handle(target);
        return observer;
    }

    function panelSurface() {
        return {
            background: 'rgba(255, 255, 255, 0.98)',
            backdrop: 'blur(0px)',
        };
    }

    function injectBaseStyle() {
        return styleSheet(
            `${LB.P}-base-style`,
            `.${LB.P}-overlay {
                  position: fixed;
                  inset: 0;
                  z-index: 2147483000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 20px;
                  background: rgba(0, 0, 0, .38);
                  animation: ${LB.P}-fade .16s ease-out;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
                      "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
                  font-size: 14px;
                  line-height: 1.4;
                  color: #1e1e2f;
                  text-align: left;
                  box-sizing: border-box;
              }
              .${LB.P}-overlay, .${LB.P}-overlay * { box-sizing: border-box; }
              @keyframes ${LB.P}-fade { from { opacity: 0 } to { opacity: 1 } }

              .${LB.P}-window {
                  position: relative;
                  padding: 28px 24px 24px;
                  background: rgba(255, 255, 255, .98);
                  backdrop-filter: blur(0px);
                  -webkit-backdrop-filter: blur(0px);
                  border-radius: 24px;
                  box-shadow: 0 12px 40px rgba(0, 0, 0, .15);
                  color: #1e1e2f;
                  display: flex;
                  flex-direction: column;
                  width: min(520px, 94vw);
                  max-width: calc(100vw - 70px);
                  max-height: calc(100vh - 40px);
                  animation: ${LB.P}-pop .18s cubic-bezier(.2, .8, .3, 1);
              }
              @keyframes ${LB.P}-pop { from { transform: scale(.96); opacity: .6 } to { transform: none; opacity: 1 } }
              @keyframes ${LB.P}-fade-out { from { opacity: 1 } to { opacity: 0 } }
              @keyframes ${LB.P}-pop-out { from { transform: none; opacity: 1 } to { transform: scale(.96); opacity: 0 } }
              .${LB.P}-overlay.${LB.P}-closing {
                  animation: ${LB.P}-fade-out .16s ease-in both;
                  pointer-events: none;
              }
              .${LB.P}-overlay.${LB.P}-closing .${LB.P}-window { animation: ${LB.P}-pop-out .16s ease-in both; }

              .${LB.P}-window__head { flex: 0 0 auto; }
              .${LB.P}-window__title {
                  margin: 0 0 16px 0;
                  font-size: 22px;
                  font-weight: 600;
                  color: #2c3e50;
                  line-height: 1.3;
              }
              .${LB.P}-window__body {
                  flex: 1 1 auto;
                  min-height: 0;
                  overflow-y: auto;
              }
              .${LB.P}-window__foot {
                  flex: 0 0 auto;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  margin: 6px 0 12px;
              }

              .${LB.P}-close {
                  position: absolute;
                  top: 12px;
                  right: 12px;
                  width: 32px;
                  height: 32px;
                  padding: 0;
                  margin: 0;
                  border: none;
                  border-radius: 50%;
                  background: #ff4d4f;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, .12);
                  color: #fff;
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 22px;
                  font-weight: 400;
                  line-height: 1;
                  text-align: center;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  overflow: hidden;
                  cursor: pointer;
                  transition: background .2s, transform .2s;
              }
              .${LB.P}-close:hover { background: #e04345; transform: scale(1.06); }
              .${LB.P}-close:active { transform: scale(.92); }

              .${LB.P}-row {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  margin: 6px 0 12px;
                  font-size: 14px;
                  line-height: 1.4;
              }
              .${LB.P}-row__label {
                  flex: 0 0 auto;
                  min-width: 5.5em;
                  font-size: 15px;
                  font-weight: 500;
                  color: #34495e;
                  line-height: 1.3;
                  white-space: nowrap;
              }
              .${LB.P}-panel-body .${LB.P}-row__label { width: 6.5em; }
              .${LB.P}-panel-body .${LB.P}-row--wide-label .${LB.P}-row__label { width: 9em; }
              .${LB.P}-slider {
                  flex: 1;
                  -webkit-appearance: none;
                  appearance: none;
                  accent-color: #000;
                  height: 4px;
                  border-radius: 2px;
                  background: #dce3e8;
                  cursor: pointer;
                  margin: 0;
                  padding: 0;
              }
              .${LB.P}-slider::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #000;
                  box-shadow: 0 1px 4px rgba(0, 0, 0, .2);
                  cursor: pointer;
              }
              .${LB.P}-slider::-moz-range-track { height: 4px; border-radius: 2px; background: #dce3e8; }
              .${LB.P}-slider::-moz-range-thumb {
                  width: 16px; height: 16px; border: none; border-radius: 50%;
                  background: #000; box-shadow: 0 1px 4px rgba(0, 0, 0, .2); cursor: pointer;
              }
              .${LB.P}-slider:disabled { opacity: .4; cursor: not-allowed; }
              .${LB.P}-row__value {
                  flex: 0 0 auto;
                  display: inline-block;
                  width: 45px;
                  text-align: center;
                  font-weight: 500;
                  line-height: 1;
              }

              .${LB.P}-checks { display: block; }
              .${LB.P}-check {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  margin: 6px 0 12px;
                  font-size: 14px;
                  line-height: 1.4;
                  cursor: pointer;
                  user-select: none;
              }
              .${LB.P}-check input[type="checkbox"] {
                  flex: 0 0 auto;
                  width: 18px;
                  height: 18px;
                  margin: 0;
                  padding: 0;
                  accent-color: #000;
                  cursor: pointer;
                  vertical-align: middle;
              }
              .${LB.P}-check__text { display: inline-block; cursor: pointer; }
              .${LB.P}-check__text a { color: #0d3d41; text-decoration: none; }
              .${LB.P}-check__text a:hover { text-decoration: underline; }
              .${LB.P}-check > .${LB.P}-select,
              .${LB.P}-check > .${LB.P}-btn { flex: 0 0 auto; }

              .${LB.P}-select {
                  height: 32px;
                  padding: 0 10px;
                  font-size: 14px;
                  font-family: inherit;
                  color: #1e1e2f;
                  background: rgba(255, 255, 255, .9);
                  border: 1px solid #ccc;
                  border-radius: 8px;
                  cursor: pointer;
                  outline: none;
                  transition: border-color .2s, box-shadow .2s;
                  max-width: 100%;
              }
              .${LB.P}-select:hover { border-color: #999; }
              .${LB.P}-select:focus { border-color: #000; box-shadow: 0 0 0 2px rgba(0, 0, 0, .08); }
              .${LB.P}-select:disabled { opacity: .45; cursor: not-allowed; }
              .${LB.P}-select--block { width: 100%; }

              .${LB.P}-btn {
                  display: inline-block;
                  margin: 0;
                  padding: 8px 24px;
                  border: none;
                  border-radius: 30px;
                  font-size: 14px;
                  font-family: inherit;
                  font-weight: 500;
                  line-height: 1.4;
                  cursor: pointer;
                  transition: background .2s, transform .1s;
              }
              .${LB.P}-btn:active { transform: scale(.96); }
              .${LB.P}-btn:disabled { opacity: .55; cursor: not-allowed; }
              .${LB.P}-btn--primary {
                  background: #000;
                  color: #fff;
                  box-shadow: 0 1px 4px rgba(0, 0, 0, .15);
              }
              .${LB.P}-btn--primary:hover:not(:disabled) { background: #333; }
              .${LB.P}-btn--ghost {
                  background: #ecf0f1;
                  color: #2c3e50;
                  box-shadow: 0 1px 4px rgba(0, 0, 0, .05);
              }
              .${LB.P}-btn--ghost:hover:not(:disabled) { background: #d5dbe0; }
              .${LB.P}-btn--sm { padding: 6px 14px; font-size: 13px; }

              .${LB.P}-panel-foot {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  margin: 22px 0 4px;
              }

              .${LB.P}-textarea, .${LB.P}-input {
                  display: block;
                  width: 100%;
                  margin: 0;
                  padding: 8px 10px;
                  border: 1px solid #ccc;
                  border-radius: 4px;
                  background: transparent;
                  color: #1e1e2f;
                  font-family: var(--lfe-code-font, Monospace);
                  font-size: 13px;
                  line-height: 1.5;
                  outline: none;
                  transition: border-color .2s, box-shadow .2s;
              }
              .${LB.P}-textarea {
                  height: clamp(100px, calc(100vh - 700px), 160px);
                  resize: none;
                  overflow: auto;
                  tab-size: 2;
                  -moz-tab-size: 2;
                  white-space: pre;
                  -webkit-appearance: none;
              }
              .${LB.P}-textarea::placeholder { color: #9aa4ad; }
              .${LB.P}-textarea:focus, .${LB.P}-input:focus {
                  border-color: #000;
                  box-shadow: 0 0 0 2px rgba(0, 0, 0, .08);
              }

              .${LB.P}-group-title {
                  margin: 18px 0 6px;
                  font-size: 15px;
                  font-weight: 500;
                  color: #34495e;
                  line-height: 1.3;
              }
              .${LB.P}-hint {
                  display: block;
                  margin: 4px 0 12px;
                  font-size: 12px;
                  line-height: 1.4;
                  color: #8a8a8a;
              }`
        );
    }

    const ICON_CLOSE = '×';

    /**
      * @param {object} opts
      * @param {string} opts.id
      * @param {string} opts.title
      * @param {Node|string} opts.body
      * @param {Array} [opts.actions]
      * @param {string} [opts.width]
      * @param {boolean} [opts.dim]
      * @param {() => void} [opts.onClose]
      */
    function openWindow(opts) {
        injectBaseStyle();
        const { id, title, body, actions = [], width, dim = true, onClose } = opts;
        const windowId = id || `${LB.P}-window-${Date.now()}`;
        document.getElementById(windowId)?.remove();

        const content = typeof body === 'string' ? el('div', { html: body }) : body;

        const surface = panelSurface();
        const windowEl = el(
            'div',
            {
                class: `${LB.P}-window`,
                style: {
                    width,
                    background: surface.background,
                    backdropFilter: surface.backdrop,
                    WebkitBackdropFilter: surface.backdrop,
                },
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': title,
            },
            el('button', {
                class: `${LB.P}-close`,
                type: 'button',
                title: '关闭 (Esc)',
                text: ICON_CLOSE,
                onclick: () => close(),
            }),
            el('div', { class: `${LB.P}-window__head` }, el('div', { class: `${LB.P}-window__title`, text: title })),
            el('div', { class: `${LB.P}-window__body` }, content),
            actions.length
                ? el(
                        'div',
                        { class: `${LB.P}-window__foot` },
                        actions.map((a) =>
                            el('button', {
                                class: `${LB.P}-btn ${a.variant === 'ghost' ? `${LB.P}-btn--ghost` : `${LB.P}-btn--primary`}`,
                                type: 'button',
                                text: a.label,
                                onclick: (event) => a.onClick?.(event, close),
                            })
                        )
                    )
                : null
        );

        const overlay = el(
            'div',
            {
                id: windowId,
                class: `${LB.P}-overlay`,
                style: dim ? null : { background: 'transparent' },
            },
            windowEl
        );

        let closed = false;
        function close({ force = false } = {}) {
            if (closed) return;
            closed = true;
            document.removeEventListener('keydown', onKey, true);
            const done = () => {
                overlay.remove();
                onClose?.();
            };
            if (force || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
                done();
                return;
            }
            overlay.classList.add(`${LB.P}-closing`);
            let finished = false;
            const once = () => {
                if (finished) return;
                finished = true;
                done();
            };
            overlay.addEventListener('animationend', once, { once: true });
            setTimeout(once, 260);
        }
        function onKey(event) {
            if (event.key === 'Escape') {
                event.stopPropagation();
                close();
            }
        }

        overlay.addEventListener('mousedown', (event) => {
            if (event.target === overlay) close();
        });
        document.addEventListener('keydown', onKey, true);
        document.body.append(overlay);

        return { overlay, window: windowEl, close };
    }

    function checkbox(labelText, checked, onChange) {
        const input = el('input', { type: 'checkbox', checked: !!checked });
        input.addEventListener('change', () => onChange?.(input.checked));
        const text = el('span', { class: `${LB.P}-check__text` });
        append(text, [labelText]);
        return el('label', { class: `${LB.P}-check` }, input, text);
    }

    function select(options, value, onChange, { block = false } = {}) {
        const node = el(
            'select',
            { class: `${LB.P}-select${block ? ` ${LB.P}-select--block` : ''}` },
            options.map((o) => el('option', { value: o.value, text: o.label, selected: o.value === value }))
        );
        node.value = value;
        node.addEventListener('change', () => onChange?.(node.value));
        return node;
    }

    function sliderRow({ label, min, max, step = 1, value, unit = '', onInput }) {
        const readout = el('span', { class: `${LB.P}-row__value`, text: `${value}${unit}` });
        const input = el('input', {
            class: `${LB.P}-slider`,
            type: 'range',
            min: String(min),
            max: String(max),
            step: String(step),
            value: String(value),
        });
        input.addEventListener('input', () => {
            readout.textContent = `${input.value}${unit}`;
            onInput?.(Number(input.value));
        });
        const row = el(
            'div',
            { class: `${LB.P}-row` },
            el('span', { class: `${LB.P}-row__label`, text: label }),
            input,
            readout
        );
        row.input = input;
        row.setValue = (v) => {
            input.value = String(v);
            readout.textContent = `${v}${unit}`;
        };
        return row;
    }

    const ENTRY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>';

    const Panel = {
        id: `${LB.P}-panel`,
        _refs: null,
        _unsubs: [],

        isOpen() {
            return !!document.getElementById(this.id);
        },

        open() {
            if (this.isOpen()) return;
            injectBaseStyle();

            const body = el('div', { class: `${LB.P}-panel-body` });
            this._refs = {};
            const refs = this._refs;

            for (const spec of [
                { key: 'cardBlur', label: '卡片模糊度', min: 0, max: 20, unit: 'px' },
                { key: 'cardOpacity', label: '卡片不透明度', min: 0, max: 100, unit: '%' },
                { key: 'cardRadius', label: '卡片圆角曲度', min: 0, max: 30, unit: 'px' },
                { key: 'imageRadius', label: '图片圆角曲度', min: 0, max: 30, unit: 'px' },
                { key: 'bg.navOpacity', label: '顶栏/侧栏不透明度', min: 0, max: 100, unit: '%', wideLabel: true },
            ]) {
                const row = sliderRow({
                    label: spec.label,
                    min: spec.min,
                    max: spec.max,
                    value: Config.getIn(spec.key),
                    unit: spec.unit,
                    onInput: (value) => Config.set(spec.key, value),
                });
                if (spec.wideLabel) row.classList.add(`${LB.P}-row--wide-label`);
                body.append(row);
                refs[`slider:${spec.key}`] = row;
            }

            const checks = el('div', { class: `${LB.P}-checks` });
            const addCheck = (key, label) => {
                const node = checkbox(label, Config.get(key), (checked) => {
                    Config.set(key, checked);
                    this._syncGates();
                });
                checks.append(node);
                refs[`check:${key}`] = node;
                return node;
            };

            addCheck('cardBlurOn', '卡片模糊');
            addCheck('cardRadiusOn', '卡片圆角');
            addCheck('imageRadiusOn', '图片圆角');

            const bgCheck = addCheck('bgFullscreen', '背景全屏');
            const bgSourceSelect = select(
                [
                    { value: 'theme', label: '使用主题配置' },
                    { value: 'custom', label: '自定义背景' },
                ],
                Config.get('bgSource'),
                (value) => {
                    Config.set('bgSource', value);
                    this._syncGates();
                }
            );
            const bgConfigBtn = el('button', {
                class: `${LB.P}-btn ${LB.P}-btn--ghost ${LB.P}-btn--sm`,
                type: 'button',
                text: '配置',
                title: '打开自定义背景配置窗口',
                onclick: () => LB.openBackgroundPanel?.(),
            });
            bgCheck.append(bgSourceSelect, bgConfigBtn);
            refs.bgSourceSelect = bgSourceSelect;
            refs.bgConfigBtn = bgConfigBtn;

            const bgHint = el('div', { class: `${LB.P}-hint` });
            append(bgHint, [
                '需要先在 ',
                el('a', { href: '/theme', target: '_blank', rel: 'noopener', text: '主题' }),
                ' 里启用中景图片设置。',
            ]);
            checks.append(bgHint);
            refs.bgHint = bgHint;

            addCheck('adBlockOn', '关闭广告');
            addCheck('benbenOn', '犇犇优化');
            addCheck('imageHostingOn', '图床优化');
            addCheck('contestOn', '比赛优化');

            body.append(checks);

            body.append(el('div', { class: `${LB.P}-group-title`, text: '自定义 CSS' }));
            const cssArea = el('textarea', {
                class: `${LB.P}-textarea`,
                rows: 5,
                spellcheck: false,
                placeholder: '在这里写入 CSS',
                value: Config.get('customCss'),
            });
            cssArea.addEventListener('input', () => Config.set('customCss', cssArea.value));
            body.append(cssArea);
            this._refs.cssArea = cssArea;

            body.append(el('div', { class: `${LB.P}-group-title`, text: '更新通道' }));
            body.append(
                select(
                    [
                        { value: 'stable', label: '稳定版' },
                        { value: 'latest', label: '最新版' },
                    ],
                    Config.get('updateChannel'),
                    (value) => Config.set('updateChannel', value),
                    { block: true }
                )
            );

            const foot = el(
                'div',
                { class: `${LB.P}-panel-foot` },
                el('button', {
                    class: `${LB.P}-btn ${LB.P}-btn--primary`,
                    type: 'button',
                    text: '检查更新',
                    onclick: (event) => {
                        const btn = event.currentTarget;
                        btn.disabled = true;
                        Promise.resolve(LB.checkUpdate?.({ manual: true })).finally(() => {
                            btn.disabled = false;
                        });
                    },
                }),
                el('button', {
                    class: `${LB.P}-btn ${LB.P}-btn--ghost`,
                    type: 'button',
                    text: '还原设置',
                    onclick: () => this._confirmReset(),
                })
            );
            body.append(foot);

            openWindow({
                id: this.id,
                title: '插件设置',
                body,
                onClose: () => {
                    this._releaseSubs();
                    this._refs = null;
                },
            });

            const syncSlider = (key) =>
                Config.on(key, (value) => refs[`slider:${key}`]?.setValue(Math.round(Number(value))));
            this._unsubs.push(syncSlider('bg.navOpacity'), syncSlider('cardOpacity'));

            this._syncGates();
        },

        _releaseSubs() {
            for (const off of this._unsubs) off();
            this._unsubs = [];
        },

        _syncGates() {
            const refs = this._refs;
            if (!refs) return;

            const gateMap = { cardBlurOn: 'cardBlur', cardRadiusOn: 'cardRadius', imageRadiusOn: 'imageRadius' };
            for (const [gate, key] of Object.entries(gateMap)) {
                const row = refs[`slider:${key}`];
                if (row) row.input.disabled = !Config.get(gate);
            }

            const fullscreen = Config.get('bgFullscreen');
            const custom = Config.get('bgSource') === 'custom';
            refs.bgSourceSelect.style.display = fullscreen ? '' : 'none';
            refs.bgConfigBtn.style.display = fullscreen && custom ? '' : 'none';

            refs.bgHint.style.display = fullscreen && !custom ? '' : 'none';
        },

        _confirmReset() {
            if (!window.confirm('确定要把所有设置还原为默认值吗？')) return;
            Config.reset();
            this.close();
            setTimeout(() => {
                location.reload();
            }, 200);
        },

        close() {
            document.getElementById(this.id)?.remove();
            this._releaseSubs();
            this._refs = null;
        },

        mountEntry() {
            injectBaseStyle();

            try {
                if (typeof GM_registerMenuCommand === 'function') {
                    GM_registerMenuCommand('打开设置面板', () => this.open());
                }
            } catch (_) {}

            document.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.altKey && (event.key === 'l' || event.key === 'L')) {
                    event.preventDefault();
                    this.open();
                }
            });

            keepAlive(`${LB.P}-entry`, () => this._injectEntry(), 1500);
        },

        _findTopRightNav(bar) {
            for (const sel of ['.user-nav', '.user-nav-links', '.nav-links', '.top-bar-right', '.right', 'nav']) {
                const node = bar.querySelector(sel);
                if (node) return node;
            }

            const userLink = bar.querySelector('a[href^="/user/"], a[href^="/setting"]');
            if (userLink) {
                let node = userLink;
                while (node.parentElement && node.parentElement !== bar) node = node.parentElement;
                if (node.parentElement === bar) return node;
            }

            return null;
        },

        _injectEntry() {
            const bar =
                $('.top-bar') ||
                $('nav.lfe-body') ||
                $('header') ||
                $('nav.sidebar.lside') ||
                $('.sidebar.lside') ||
                $('#app > .l-sidebar') ||
                $('.l-sidebar');
            if (!bar) return;

            const host = this._findTopRightNav(bar) || bar;
            const existing = document.getElementById(`${LB.P}-entry`);

            if (existing) {
                if (existing.parentElement !== host) host.insertBefore(existing, host.firstChild);
                return;
            }

            const button = el(
                'button',
                {
                    id: `${LB.P}-entry`,
                    class: `${LB.P}-entry`,
                    type: 'button',
                    title: 'Luogu Better! 设置（Ctrl+Alt+L）',
                    onclick: () => Panel.open(),
                },
                el('span', { class: `${LB.P}-entry__icon`, html: ENTRY_ICON }),
                el('span', { text: 'Luogu Better!' })
            );

            const right = this._findTopRightNav(bar);
            host.insertBefore(button, host.firstChild);

            styleSheet(
                `${LB.P}-entry-style`,
                `.${LB.P}-entry {
                      display: inline-flex;
                      align-items: center;
                      gap: 6px;
                      flex: 0 0 auto;
                      height: 32px;
                      margin: 0 10px 0 0;
                      padding: 0 12px;
                      border: none;
                      border-radius: 8px;
                      background: transparent;
                      color: inherit;
                      font-family: inherit;
                      font-size: 14px;
                      line-height: 1;
                      white-space: nowrap;
                      cursor: pointer;
                      transition: background .15s;
                  }
                  .${LB.P}-entry__icon { display: inline-flex; flex: 0 0 auto; }
                  .${LB.P}-entry__icon svg { display: block; width: 16px; height: 16px; }
                  .${LB.P}-entry:hover { background: rgba(0, 0, 0, .06); }
                  .${LB.P}-entry:active { transform: scale(.97); }`
            );
        },
    };

    LB.define('appearance', () => {
        const ID = {
            rounded: 'lgb-rounded-style',
            blur: 'lgb-blur-style',
            opacity: 'lgb-opacity-style',
            bgFullscreen: 'lgb-bgfullscreen-style',
            customCss: 'lgb-custom-style',
            scrollbar: 'lgb-scrollbar-style',
            idePadding: 'lgb-ide-padding-style',
        };

        const BG_CLASS = 'lgb-bgfullscreen';
        const THEME_SELECTOR = '.theme-page, #luogu-theme';
        const BG_POLL_MS = 1000;

        let bgUpdateRaf = null;
        let bgObserver = null;
        let themeRefreshTimer = null;

        const dropStyle = (id) => document.getElementById(id)?.remove();

        function cardOpacityPercent() {
            const value = Number(Config.get('cardOpacity'));
            return Number.isFinite(value) ? value : 100;
        }

        function applyRoundedCorners() {
            const cardRounded = !!Config.get('cardRadiusOn');
            const picRounded = !!Config.get('imageRadiusOn');
            const cardborderRad = Number(Config.get('cardRadius'));
            const picborderRad = Number(Config.get('imageRadius'));

            if (!Number.isFinite(cardborderRad) && !Number.isFinite(picborderRad)) {
                dropStyle(ID.rounded);
                return;
            }

            const cardRadius = `${Config.get('cardRadius')}px`;
            const picRadius = `${Config.get('imageRadius')}px`;
            let css = '';

            if (cardRounded) {
                css = `.l-card, .lg-article, .card { border-radius: ${cardRadius} !important; }
                       .swal2-popup { border-radius: ${cardRadius} !important; }
                       .l-form-layout, .am-panel { border-radius: ${cardRadius} !important; }
                       .author, .meta {
                               border-top-left-radius: ${cardRadius} !important;
                               border-top-right-radius: ${cardRadius} !important;
                               border-bottom-left-radius: 0px !important;
                               border-bottom-right-radius: 0px !important;
                       }
                       .dropdown .center, .cs-dialog { border-radius: ${cardRadius} !important; }
                       .dropdown.shown { border-radius: ${cardRadius} !important; }
                       .dropdown.shown:has(.user-header-top) { overflow: hidden !important; }
                       .dropdown-container, .am-dropdown-content, .am-selected-content { border-radius: ${cardRadius} !important; }
                       .user-header-top { border-top-left-radius: ${cardRadius}; border-top-right-radius: ${cardRadius}; }
                       .user-header-bottom { border-bottom-left-radius: ${cardRadius}; border-bottom-right-radius: ${cardRadius}; }
                       .user-nav { border-bottom-left-radius: ${cardRadius}; border-bottom-right-radius: ${cardRadius}; }
                       .test-case { border-radius: 10px; }
                       html.lgb-bgfullscreen .article-banner.article-banner { border-top-left-radius: ${cardRadius} !important; border-top-right-radius: ${cardRadius} !important; }
                       html.lgb-bgfullscreen .article-content.article-content { border-bottom-left-radius: ${cardRadius} !important; border-bottom-right-radius: ${cardRadius} !important; }
                       html.lgb-bgfullscreen .toc.toc { border-radius: .5em !important; }
                       .ide-container { border-radius: ${cardRadius} !important; }
                       .ide-textarea[readonly].lfe-code { border-bottom-right-radius: ${cardRadius} !important; }
                       .am-viewport { border-radius: ${cardRadius} !important; }
                       .am-slider-default {
                               background-color: transparent !important;
                               -webkit-box-shadow: 0 0 0px rgba(0,0,0,0) !important;
                               box-shadow: 0 0 0px rgba(0,0,0,0) !important;
                       }
                       .casket.cs-full-screen {
                               border-radius: ${cardRadius} !important;
                               overflow: hidden !important;
                       }`;
            }
            if (picRounded) css += `img:not(.cropper-hide, .${LB.P}-bg-item img) { border-radius: ${picRadius} !important; }`;

            if (!css) {
                dropStyle(ID.rounded);
                return;
            }
            styleSheet(ID.rounded, css);
        }

        function applyCardBlur() {
            if (!Config.get('cardBlurOn')) {
                dropStyle(ID.blur);
                return;
            }

            const blurValue = Number(Config.get('cardBlur'));
            if (!Number.isFinite(blurValue)) {
                dropStyle(ID.blur);
                return;
            }

            const val = blurValue === 0 ? 'none' : `blur(${blurValue}px)`;

            styleSheet(
                ID.blur,
                `.lg-article, .card:not(:has(canvas)), .l-card:not(:has(canvas)) { backdrop-filter: ${val} !important; -webkit-backdrop-filter: ${val} !important; }
                 .dropdown .center, .popup { backdrop-filter: ${val} !important; -webkit-backdrop-filter: ${val} !important; }
                 .am-comment-hd, .am-comment-bd { backdrop-filter: ${val} !important; -webkit-backdrop-filter: ${val} !important; }
                 .article-banner { backdrop-filter: ${val} !important; -webkit-backdrop-filter: ${val} !important; }
                 .top-bar, .sidebar, nav.lfe-body, .user-nav, .wrapper.wrapped.lfe-body.header-layout.tiny { backdrop-filter: ${val} !important; -webkit-backdrop-filter: ${val} !important; }
                 .nav-group, .nav-group *,
                 .top-bar .user-nav, .top-bar .user-nav *,
                 nav.lfe-body > div, .sidebar.lside .nav-group {
                         backdrop-filter: none !important;
                         -webkit-backdrop-filter: none !important;
                 }
                 .dropdown, .dropdown .center, .popup,
                 .lfe-dropdown, .el-dropdown-menu,
                 .el-popper, .dropdown-menu,
                 .ant-dropdown, .ant-select-dropdown {
                         z-index: 999999 !important;
                         transform: translateZ(0) !important;
                 }
                 .dropdown-container, .el-popper, .el-dropdown-menu,
                 .lfe-dropdown, .ant-dropdown, .ant-select-dropdown,
                 .dropdown-menu { overflow: visible !important; }
                 .header-layout, .top-bar { z-index: 1000 !important; }`
            );
        }

        let nativeCardBase = null;
        let writtenCardColor = null;

        const CARD_VAR = '--theme-card-background';

        function readNativeCardBase() {
            const themePage = document.querySelector('.theme-page');
            if (!themePage) return null;

            const inline = themePage.style.getPropertyValue(CARD_VAR).trim();
            const raw = inline && inline !== writtenCardColor
                ? inline
                : getComputedStyle(themePage).getPropertyValue(CARD_VAR).trim();
            if (!raw || raw === writtenCardColor) return null;

            const m = raw.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
            return m ? `${m[1]}, ${m[2]}, ${m[3]}` : null;
        }

        function computeCardColor() {
            const alpha = cardOpacityPercent() / 100;
            if (!nativeCardBase) nativeCardBase = readNativeCardBase();
            return `rgba(${nativeCardBase || '255, 255, 255'}, ${alpha})`;
        }

        function syncThemeCardVar() {
            const cardColor = computeCardColor();
            const themePage = document.querySelector('.theme-page');
            if (!themePage) return cardColor;

            const current = themePage.style.getPropertyValue(CARD_VAR);
            if (current !== cardColor || themePage.style.getPropertyPriority(CARD_VAR) !== 'important') {
                themePage.style.setProperty(CARD_VAR, cardColor, 'important');
            }
            writtenCardColor = cardColor;
            return cardColor;
        }

        function applyCardOpacity() {
            const cardColor = computeCardColor();

            styleSheet(
                ID.opacity,
                `.lg-article, .l-card, .card { background-color: ${cardColor} !important; }
                 .dropdown .center, .popup { background-color: ${cardColor} !important; }
                 .am-comment-hd, .am-comment-bd { background-color: ${cardColor} !important; }
                 nav.lfe-body > div { background-color: transparent !important; }
                 .user-header-bottom { background-color: transparent !important; }
                 .ide-container { background-color: ${cardColor} !important; }
                 .panel-layout>.panel-divider.with-icon { background-color: transparent !important; }
                 .panel-layout>.panel-divider.dragging { background-color: var(--lfe-color--primary) !important; }
                 .ͼ2 .cm-gutters, .ide-toolbar { background-color: transparent !important; border: 0px solid transparent !important; }
                 input:not([type=range]), textarea, .refined-input { background-color: transparent !important; }
                 .panel-divider, .layout-horizontal>.panel-divider { background-color: transparent !important; }
                 .combo-wrapper>.text, .lform-size-middle.block-item.tag-button,
                 .casket.cs-main:not(.cs-full-screen),
                 .casket:not(.cs-full-screen) .cs-header,
                 .casket:not(.cs-full-screen) .cs-footer,
                 code[class*=language-], pre[class*=language-], .lfe-code { background-color: transparent !important; }
                 .lg-article::before, .l-card::before, .card::before,
                 .lg-article::after, .l-card::after, .card::after {
                     background-color: transparent !important;
                     backdrop-filter: none !important;
                     -webkit-backdrop-filter: none !important;
                 }`
            );
            syncThemeCardVar();
        }

        function applyCustomCSS() {
            const customCSS = Config.get('customCss');
            if (!customCSS || String(customCSS).trim() === '') {
                dropStyle(ID.customCss);
                return;
            }
            styleSheet(ID.customCss, customCSS, { raise: true });
        }

        function applyScrollbarStyle() {
            styleSheet(
                ID.scrollbar,
                `* { scrollbar-color: rgb(139, 139, 139) transparent; }

                 nav.sidebar::-webkit-scrollbar,
                 .dropdown::-webkit-scrollbar { width: 8px; }

                 nav.sidebar::-webkit-scrollbar-thumb,
                 .dropdown::-webkit-scrollbar-thumb {
                     background: rgb(139, 139, 139);
                     border-radius: 4px;
                 }`
            );
        }

        let idePaddingCss = '';

        function applyIdePadding() {
            const mainContainer = document.querySelector('.main-container.lside-nav');
            if (!mainContainer) {
                dropStyle(ID.idePadding);
                idePaddingCss = '';
                return;
            }

            const isIdePage = !!mainContainer.querySelector('.panel-layout.ide-container');
            const topBar = document.querySelector('.top-bar');
            const topH = topBar ? topBar.getBoundingClientRect().height : 48;

            let css = `
                .main-container.lside-nav {
                    padding: 10px !important;
                    box-sizing: border-box !important;
                    background: transparent !important;
                }
            `;

            if (isIdePage) {
                css += `
                    .main-container.lside-nav {
                        height: calc(100vh - ${topH}px) !important;
                        max-height: calc(100vh - ${topH}px) !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .main-container.lside-nav > .panel-layout.ide-container {
                        flex: 1 1 auto !important;
                        height: 100% !important;
                        min-height: 0 !important;
                        min-width: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        box-sizing: border-box !important;
                    }
                    .main-container.lside-nav .panel-layout,
                    .main-container.lside-nav .panel {
                        min-height: 0 !important;
                        min-width: 0 !important;
                        box-sizing: border-box !important;
                    }
                    .ide-textarea.lfe-code {
                        scrollbar-width: none !important;
                        -ms-overflow-style: none !important;
                        box-sizing: border-box !important;
                        max-width: 100% !important;
                    }
                    .ide-textarea.lfe-code::-webkit-scrollbar {
                        display: none !important;
                        width: 0 !important;
                        height: 0 !important;
                    }
                    .ide-textarea.lfe-code::-webkit-scrollbar-corner {
                        display: none !important;
                        background: transparent !important;
                    }
                `;
            }

            if (css === idePaddingCss && document.getElementById(ID.idePadding)) return;
            idePaddingCss = css;
            styleSheet(ID.idePadding, css);
        }

        function restoreThemeVars(themePage) {
            if (!themePage || !themePage._lgbSavedVars) return;
            for (const [key, value] of Object.entries(themePage._lgbSavedVars)) {
                if (value) {
                    themePage.style.setProperty(key, value);
                } else {
                    themePage.style.removeProperty(key);
                }
            }
            delete themePage._lgbSavedVars;
        }

        function resolveBackgroundImage(themePage) {
            if (themePage) {
                const cs = getComputedStyle(themePage);
                const img = cs.getPropertyValue('--theme-body-image').trim();
                if (img && img !== 'none') {
                    const urlMatch = img.match(/url\(["']?([^"')]+)["']?\)/);
                    return {
                        image: urlMatch ? `url("${urlMatch[1]}")` : `url("${img.replace(/^["']|["']$/g, '')}")`,
                        repeat: cs.getPropertyValue('--theme-body-image-repeat').trim() || 'no-repeat',
                        size: cs.getPropertyValue('--theme-body-image-size').trim() || 'cover',
                        position: cs.getPropertyValue('--theme-body-image-position').trim() || 'center',
                        filter: cs.getPropertyValue('--theme-body-color-filter').trim() || 'none',
                    };
                }
            }

            const themeScript = document.getElementById('luogu-theme');
            if (themeScript) {
                try {
                    const data = JSON.parse(themeScript.textContent);
                    if (data && data.lBody && data.lBody.image) {
                        const midOpts = data.lBody.midOpts || {};
                        let position = 'center';
                        if (Array.isArray(midOpts.position) && midOpts.position.length >= 2) {
                            position = `${midOpts.position[0]}% ${midOpts.position[1]}%`;
                        }
                        let filter = 'none';
                        if (typeof midOpts.brightness === 'number' && midOpts.brightness !== 0) {
                            filter = `brightness(${100 + midOpts.brightness}%)`;
                        }
                        return {
                            image: `url("${data.lBody.image}")`,
                            repeat: midOpts.notEmpty === false ? 'repeat' : 'no-repeat',
                            size: midOpts.size || 'cover',
                            position: position,
                            filter: filter,
                        };
                    }
                } catch (e) {}
            }

            const bgDiv = document.querySelector('.header-layout .background');
            if (bgDiv) {
                const style = getComputedStyle(bgDiv);
                if (style.backgroundImage && style.backgroundImage !== 'none') {
                    return {
                        image: style.backgroundImage,
                        repeat: style.backgroundRepeat || 'no-repeat',
                        size: style.backgroundSize || 'cover',
                        position: style.backgroundPosition || 'center',
                        filter: 'none',
                    };
                }
            }

            return null;
        }

        function forceMainTransparent() {
            const list = document.querySelectorAll('.main-container > main, main');
            list.forEach((element) => {
                const bgc = element.style.getPropertyValue('background-color').trim();
                const bg = element.style.getPropertyValue('background').trim();
                if (bgc && bgc !== 'transparent' && bgc !== 'rgba(0, 0, 0, 0)') {
                    element.style.setProperty('background-color', 'transparent', 'important');
                }
                if (bg && bg !== 'transparent' && bg !== 'none') {
                    element.style.setProperty('background', 'transparent', 'important');
                }
            });
        }

        function fullscreenEnabled() {
            return !!Config.get('bgFullscreen') && Config.get('bgSource') === 'theme';
        }

        let strippedNav = null;

        function restoreStrippedNav() {
            if (strippedNav) {
                if (!strippedNav.classList.contains('user-nav')) strippedNav.classList.add('user-nav');
                strippedNav = null;
            }
        }

        function applyFullscreenBackground() {
            dropStyle(ID.bgFullscreen);
            document.documentElement.classList.remove(BG_CLASS);

            const themePage = document.querySelector('.theme-page');
            restoreThemeVars(themePage);
            restoreStrippedNav();

            if (!fullscreenEnabled()) return;

            const bg = resolveBackgroundImage(themePage);
            if (!bg) return;

            if (themePage) {
                const varsToOverride = [
                    '--theme-body-image',
                    '--theme-body-color',
                    '--theme-body-mid-mask',
                    '--theme-body-color-filter',
                    '--theme-body-back',
                ];
                const saved = {};
                for (const v of varsToOverride) {
                    saved[v] = themePage.style.getPropertyValue(v);
                }
                themePage._lgbSavedVars = saved;

                themePage.style.setProperty('--theme-body-image', 'none');
                themePage.style.setProperty('--theme-body-color', 'none');
                themePage.style.setProperty('--theme-body-mid-mask', 'none');
                themePage.style.setProperty('--theme-body-color-filter', 'none');
                themePage.style.setProperty('--theme-body-back', 'transparent');
            }

            const nav = document.querySelector('.container nav');
            if (nav && location.pathname === '/' && nav.classList.contains('user-nav')) {
                nav.classList.remove('user-nav');
                strippedNav = nav;
            }

            document.documentElement.classList.add(BG_CLASS);

            const alpha = cardOpacityPercent() / 100;

            styleSheet(
                ID.bgFullscreen,
                `html.lgb-bgfullscreen {
                         background: transparent !important;
                         background-image: none !important;
                 }
                 html.lgb-bgfullscreen::before {
                         content: '' !important;
                         position: fixed !important;
                         top: 0 !important;
                         left: 0 !important;
                         right: 0 !important;
                         bottom: 0 !important;
                         z-index: -1 !important;
                         pointer-events: none !important;
                         background-image: ${bg.image} !important;
                         background-repeat: ${bg.repeat} !important;
                         background-position: ${bg.position} !important;
                         background-size: ${bg.size} !important;
                         filter: ${bg.filter} !important;
                         -webkit-filter: ${bg.filter} !important;
                 }
                 .header-layout.tiny[data-v-7ddab1d5], .lfe-body[data-v-12f19ddc] { background: transparent !important; }
                 .article-banner + div[data-v-fc349d1c] { background: transparent !important; }
                 html.lgb-bgfullscreen .lcolor-bg-background { background: transparent !important; }
                 html.lgb-bgfullscreen .article-banner.article-banner {
                         background: rgba(245, 245, 245, ${alpha}) !important;
                 }
                 html.lgb-bgfullscreen .article-content.article-content {
                         background: rgba(255, 255, 255, ${alpha}) !important;
                 }
                 html.lgb-bgfullscreen .toc.toc {
                         background: white !important;
                         box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .15), 0 0 1px 0 rgba(0, 0, 0, .5) inset;
                         padding: 3px 8px;
                 }
                 html.lgb-bgfullscreen body {
                         background: transparent !important;
                         background-image: none !important;
                 }
                 html.lgb-bgfullscreen main,
                 html.lgb-bgfullscreen .main-container > main {
                         background: transparent !important;
                         background-color: transparent !important;
                 }
                 html.lgb-bgfullscreen .main-container,
                 html.lgb-bgfullscreen #app-old,
                 html.lgb-bgfullscreen .lg-index-content,
                 html.lgb-bgfullscreen .lg-index-content .am-g,
                 html.lgb-bgfullscreen .am-panel {
                         background: transparent !important;
                         background-color: transparent !important;
                 }
                 html.lgb-bgfullscreen .header-layout .background { opacity: 0; }
                 html.lgb-bgfullscreen .wrapper.wrapped:not(.header-layout) .background { display: none; }
                 html.lgb-bgfullscreen .wrapper.wrapped:not(.header-layout) { background: transparent !important; }
                 html.lgb-bgfullscreen .footer { background: transparent !important; }
                 html.lgb-bgfullscreen .theme-page { background: transparent !important; }
                 html.lgb-bgfullscreen .top-bar,
                 html.lgb-bgfullscreen .sidebar,
                 html.lgb-bgfullscreen .nav-group,
                 html.lgb-bgfullscreen nav.lfe-body,
                 html.lgb-bgfullscreen nav.lfe-body > div,
                 html.lgb-bgfullscreen .user-nav,
                 html.lgb-bgfullscreen .header-layout {
                         background: transparent !important;
                         background-color: transparent !important;
                 }
                 html.lgb-bgfullscreen .top-bar { --theme-navi-back: transparent !important; }
                 html.lgb-bgfullscreen body::before,
                 html.lgb-bgfullscreen body::after,
                 html.lgb-bgfullscreen #app::before,
                 html.lgb-bgfullscreen #app::after {
                         background: none !important;
                         background-image: none !important;
                 }
                 html.lgb-bgfullscreen #app { background: transparent !important; }`
            );

            forceMainTransparent();
        }

        function cleanThemeBackground() {
            document.querySelectorAll('.theme-page').forEach((element) => {
                if (element.classList.contains('theme-frosted')) {
                    element.classList.remove('theme-frosted');
                }
                if (element.hasAttribute('style')) {
                    element.removeAttribute('style');
                }
            });
        }

        const BG_VAR_OVERRIDES = [
            ['--theme-body-image', 'none'],
            ['--theme-body-color', 'none'],
            ['--theme-body-mid-mask', 'none'],
            ['--theme-body-color-filter', 'none'],
            ['--theme-body-back', 'transparent'],
        ];

        function isFullscreenBackgroundApplied() {
            if (!fullscreenEnabled()) return false;
            if (!document.documentElement.classList.contains(BG_CLASS)) return false;
            if (!document.getElementById(ID.bgFullscreen)) return false;

            const themePage = document.querySelector('.theme-page');
            if (!themePage) return true;
            if (themePage.classList.contains('theme-frosted')) return false;
            if (!themePage._lgbSavedVars) return false;

            for (const [name, value] of BG_VAR_OVERRIDES) {
                if (themePage.style.getPropertyValue(name) !== value) return false;
            }
            return true;
        }

        function refreshThemeBackground(force) {
            if (bgUpdateRaf) return;
            bgUpdateRaf = requestAnimationFrame(() => {
                bgUpdateRaf = null;

                syncThemeCardVar();

                if (!fullscreenEnabled()) {
                    if (document.getElementById(ID.bgFullscreen) || document.documentElement.classList.contains(BG_CLASS)) {
                        applyFullscreenBackground();
                    }
                    return;
                }

                if (!force && isFullscreenBackgroundApplied()) return;
                cleanThemeBackground();
                applyFullscreenBackground();
                syncThemeCardVar();
            });
        }

        function scheduleThemeRefresh() {
            if (themeRefreshTimer) return;
            themeRefreshTimer = setTimeout(() => {
                themeRefreshTimer = null;
                applyCardOpacity();
                refreshThemeBackground(true);
            }, 80);
        }

        function startThemeBackgroundObserver() {
            if (bgObserver) return;

            bgObserver = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    for (const node of m.addedNodes) {
                        if (node.nodeType !== 1) continue;
                        if (
                            node.matches?.(THEME_SELECTOR) ||
                            node.querySelector?.(THEME_SELECTOR)
                        ) {
                            scheduleThemeRefresh();
                            return;
                        }
                    }
                    if (m.type === 'characterData' || m.type === 'childList') {
                        const t = m.target;
                        if (
                            t.id === 'luogu-theme' ||
                            t.parentElement?.id === 'luogu-theme'
                        ) {
                            scheduleThemeRefresh();
                            return;
                        }
                    }
                }
            });

            bgObserver.observe(document.documentElement, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }

        function applyAll() {
            applyRoundedCorners();
            applyCardBlur();
            applyCardOpacity();
            applyFullscreenBackground();
            applyCustomCSS();
            applyScrollbarStyle();
            applyIdePadding();
            if (fullscreenEnabled()) cleanThemeBackground();
        }

        for (const key of ['cardRadius', 'cardRadiusOn', 'imageRadius', 'imageRadiusOn']) {
            Config.on(key, applyRoundedCorners);
        }
        Config.on('cardBlur', applyCardBlur);
        Config.on('cardBlurOn', applyCardBlur);
        Config.on('cardOpacity', applyCardOpacity);
        Config.on('customCss', applyCustomCSS);
        for (const key of ['bgFullscreen', 'bgSource']) {
            Config.on(key, () => refreshThemeBackground(true));
        }

        Spa.onNavigate(debounce(applyAll, 250));
        startThemeBackgroundObserver();
        setInterval(() => {
            refreshThemeBackground(false);
            applyIdePadding();
        }, BG_POLL_MS);

        applyAll();

        let cardBaseRetries = 0;
        const cardBaseTimer = setInterval(() => {
            if (nativeCardBase || ++cardBaseRetries > 12) {
                clearInterval(cardBaseTimer);
                return;
            }
            applyCardOpacity();
        }, 250);
        window.addEventListener('load', () => applyCardOpacity(), { once: true });
    });

    LB.define('adblock', () => {
        const STYLE_ID = 'lgb-adblock-style';
        const AD_CSS = `.side div[data-v-ce0b4304] { display: none !important; }`;

        function applyAdBlock() {
            const existing = document.getElementById(STYLE_ID);

            if (!Config.get('adBlockOn')) {
                existing?.remove();
                return;
            }
            if (existing) return;

            styleSheet(STYLE_ID, AD_CSS);
        }

        Config.on('adBlockOn', applyAdBlock);
        Spa.onNavigate(applyAdBlock);
        observeAdded('.side', applyAdBlock);
        setInterval(applyAdBlock, 2000);

        applyAdBlock();
    });

    LB.define('background', () => {
        const MAX_MEDIA = 30;
        const IDS_KEY = 'bg:media-ids';
        const MEDIA_PREFIX = 'bg:media:';
        const STYLE_ID = `${LB.P}-bg-style`;
        const LAYER_ID = `${LB.P}-bg-layer`;
        const GLASS_ID = `${LB.P}-glass-overlay`;

        const liveUrls = new Set();

        function trackUrl(url) {
            if (url && url.startsWith('blob:')) liveUrls.add(url);
            return url;
        }

        function releaseUrls() {
            for (const url of liveUrls) {
                try {
                    URL.revokeObjectURL(url);
                } catch (_) {}
            }
            liveUrls.clear();
        }

        async function mediaIds() {
            const ids = await MediaDB.get(IDS_KEY);
            return Array.isArray(ids) ? ids : [];
        }

        async function allMedia() {
            const ids = await mediaIds();
            const items = await Promise.all(ids.map((id) => MediaDB.get(MEDIA_PREFIX + id)));
            return items.filter(Boolean);
        }

        async function getMedia(id) {
            return id == null ? null : MediaDB.get(MEDIA_PREFIX + id);
        }

        async function addMedia(item) {
            const ids = await mediaIds();
            if (ids.length >= MAX_MEDIA) throw new Error(`最多只能添加 ${MAX_MEDIA} 个媒体`);
            const id = ids.length ? Math.max(...ids) + 1 : 1;
            const record = { ...item, id, lastUsed: 0 };
            await MediaDB.put(MEDIA_PREFIX + id, record);
            await MediaDB.put(IDS_KEY, [...ids, id]);
            return record;
        }

        async function updateMedia(id, patch) {
            const record = await getMedia(id);
            if (!record) return null;
            const next = { ...record, ...patch };
            await MediaDB.put(MEDIA_PREFIX + id, next);
            if (patch.data && patch.data !== record.data) {
                luminanceCache.delete(id);
                dataUrlCache.delete(id);
            }
            return next;
        }

        async function deleteMedia(id) {
            const ids = await mediaIds();
            await MediaDB.del(MEDIA_PREFIX + id);
            await MediaDB.put(IDS_KEY, ids.filter((x) => String(x) !== String(id)));
            luminanceCache.delete(id);
            dataUrlCache.delete(id);
            if (String(Config.getIn('bg.currentId')) === String(id)) Config.set('bg.currentId', null);
        }

        async function clearMedia() {
            const ids = await mediaIds();
            await Promise.all(ids.map((id) => MediaDB.del(MEDIA_PREFIX + id)));
            await MediaDB.put(IDS_KEY, []);
            luminanceCache.clear();
            dataUrlCache.clear();
            Config.set('bg.currentId', null);
        }

        function mediaBlob(media) {
            if (!media) return null;
            const data = media.data;
            if (data instanceof Blob) return data;
            if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
                return new Blob([data], { type: media.mime || 'application/octet-stream' });
            }
            return null;
        }

        function mediaToUrl(media, { track = true } = {}) {
            if (!media) return '';
            if (typeof media.data === 'string') return media.data;
            const blob = mediaBlob(media);
            const url = blob ? URL.createObjectURL(blob) : '';
            return track && url ? trackUrl(url) : url;
        }

        function blobToDataUrl(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(reader.error || new Error('读取图片失败'));
                reader.readAsDataURL(blob);
            });
        }

        const dataUrlCache = new Map();
        const DATA_URL_CACHE_MAX = 4;

        async function mediaImageUrl(media, { cache = true } = {}) {
            if (!media) return '';
            if (typeof media.data === 'string') return media.data;
            if (cache && dataUrlCache.has(media.id)) return dataUrlCache.get(media.id);

            const blob = mediaBlob(media);
            if (!blob) return '';
            const url = await blobToDataUrl(blob);
            if (cache) {
                dataUrlCache.set(media.id, url);
                while (dataUrlCache.size > DATA_URL_CACHE_MAX) dataUrlCache.delete(dataUrlCache.keys().next().value);
            }
            return url;
        }

        const CROPPER_CSS = `
            .cropper-container{direction:ltr;font-size:0;line-height:0;position:relative;touch-action:none;user-select:none}
            .cropper-container img{display:block;height:100%;image-orientation:0deg;max-height:none!important;max-width:none!important;min-height:0!important;min-width:0!important;width:100%}
            .cropper-wrap-box,.cropper-canvas,.cropper-drag-box,.cropper-crop-box,.cropper-modal{bottom:0;left:0;position:absolute;right:0;top:0}
            .cropper-wrap-box,.cropper-canvas{overflow:hidden}
            .cropper-drag-box{background-color:#fff;opacity:0}
            .cropper-modal{background-color:#000;opacity:.5}
            .cropper-view-box{display:block;height:100%;outline:1px solid #39f;outline-color:rgba(51,153,255,.75);overflow:hidden;width:100%}
            .cropper-dashed{border:0 dashed #eee;display:block;opacity:.5;position:absolute}
            .cropper-dashed.dashed-h{border-bottom-width:1px;border-top-width:1px;height:33.33%;left:0;top:33.33%;width:100%}
            .cropper-dashed.dashed-v{border-left-width:1px;border-right-width:1px;height:100%;left:33.33%;top:0;width:33.33%}
            .cropper-center{display:block;height:0;left:50%;opacity:.75;position:absolute;top:50%;width:0}
            .cropper-center:before,.cropper-center:after{background-color:#eee;content:' ';display:block;position:absolute}
            .cropper-center:before{height:1px;left:-3px;top:0;width:7px}
            .cropper-center:after{height:7px;left:0;top:-3px;width:1px}
            .cropper-face,.cropper-line,.cropper-point{display:block;height:100%;opacity:.1;position:absolute;width:100%}
            .cropper-face{background-color:#fff;left:0;top:0}
            .cropper-line{background-color:#39f}
            .cropper-line.line-e{cursor:ew-resize;right:-3px;top:0;width:5px}
            .cropper-line.line-n{cursor:ns-resize;height:5px;left:0;top:-3px}
            .cropper-line.line-w{cursor:ew-resize;left:-3px;top:0;width:5px}
            .cropper-line.line-s{bottom:-3px;cursor:ns-resize;height:5px;left:0}
            .cropper-point{background-color:#39f;height:5px;opacity:.75;width:5px}
            .cropper-point.point-e{cursor:ew-resize;margin-top:-3px;right:-3px;top:50%}
            .cropper-point.point-n{cursor:ns-resize;left:50%;margin-left:-3px;top:-3px}
            .cropper-point.point-w{cursor:ew-resize;left:-3px;margin-top:-3px;top:50%}
            .cropper-point.point-s{bottom:-3px;cursor:s-resize;left:50%;margin-left:-3px}
            .cropper-point.point-ne{cursor:nesw-resize;right:-3px;top:-3px}
            .cropper-point.point-nw{cursor:nwse-resize;left:-3px;top:-3px}
            .cropper-point.point-sw{bottom:-3px;cursor:nesw-resize;left:-3px}
            .cropper-point.point-se{bottom:-3px;cursor:nwse-resize;height:20px;opacity:1;right:-3px;width:20px}
            .cropper-point.point-se:before{background-color:#39f;bottom:-50%;content:' ';display:block;height:200%;opacity:0;position:absolute;right:-50%;width:200%}
            .cropper-invisible{opacity:0}
            .cropper-hide{display:block;height:0;position:absolute;width:0}
            .cropper-hidden{display:none!important}
            .cropper-move{cursor:move}
            .cropper-crop{cursor:crosshair}
            .cropper-disabled .cropper-drag-box,.cropper-disabled .cropper-face,.cropper-disabled .cropper-line,.cropper-disabled .cropper-point{cursor:not-allowed}`;

        const PAGE_CSS = `
            html, body { background: transparent !important; }
            #app, .lfe-body { background: transparent !important; }

            #${LAYER_ID} {
                position: fixed; top: 0; left: 0;
                width: 100vw; height: 100vh;
                z-index: -2; pointer-events: none; overflow: hidden;
            }
            #${LAYER_ID} .${LB.P}-bg-inner {
                position: absolute; top: -30px; left: -30px;
                width: calc(100% + 60px); height: calc(100% + 60px);
                background-size: cover; background-position: center; background-repeat: no-repeat;
                transition: filter .4s ease;
            }
            #${LAYER_ID} video {
                position: absolute; top: -30px; left: -30px;
                width: calc(100% + 60px); height: calc(100% + 60px);
                object-fit: cover;
                transition: filter .4s ease;
            }
            #${GLASS_ID} {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: -1;
                background: rgba(255,255,255,.3);
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                display: none;
            }

            :root {
                --${LB.P}-nav-opacity: .82;
                --${LB.P}-nav-fg: #1f1f1f;
            }

            .top-bar,
            nav.sidebar.lside,
            .user-nav.rside,
            .sidebar.lside.bar {
                color: var(--${LB.P}-nav-fg) !important;
            }
            .top-bar {
                background-color: rgba(255,255,255,var(--${LB.P}-nav-opacity)) !important;
                backdrop-filter: blur(calc(var(--${LB.P}-nav-opacity) * 8px));
                -webkit-backdrop-filter: blur(calc(var(--${LB.P}-nav-opacity) * 8px));
            }
            nav.sidebar.lside,
            .user-nav.rside,
            .sidebar.lside.bar {
                background-color: rgba(255,255,255,var(--${LB.P}-nav-opacity)) !important;
                backdrop-filter: blur(calc(var(--${LB.P}-nav-opacity) * 8px));
                -webkit-backdrop-filter: blur(calc(var(--${LB.P}-nav-opacity) * 8px));
            }

            main, .main-container, .lside-nav, .main-container.lside-nav,
            .theme-page, .theme-page.no-header, #app-old {
                background-color: transparent !important;
                background-image: none !important;
            }
            .theme-page::before, .theme-page::after,
            .theme-page.no-header::before, .theme-page.no-header::after { background: none !important; }
            body::before, body::after { background: none !important; }
            .theme-page {
                --theme-body-image: none !important;
                --theme-body-back: transparent !important;
            }
            main.lfe-body.mobile-body, main.lcolor-bg-background { background-color: transparent !important; }
            .lg-index-contest .am-panel-bd { background-color: transparent !important; }
            .user-header-top {
                background-color: unset !important;
                backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
            }
            div[style*="background-color: rgb(255, 255, 255)"] { background-color: transparent !important; }
            .article-banner { background-color: transparent !important; }
            .top-progress { display: none !important; }
            .am-modal-dialog, .dropdown, .am-dropdown-content, .am-selected-content, [class*="dropdown"], .user-nav .dropdown {
                background-color: rgba(255,255,255,.98) !important;
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            }
            .search-wrap input { background-color: rgba(255,255,255,.95) !important; }`;

        function overlayCss() {
            const value = clamp(Number(Config.getIn('bg.overlay')) || 0, 0, 100) / 100;
            return value <= 0
                ? ''
                : `#${LAYER_ID}::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,${value});pointer-events:none}`;
        }

        function injectStyle() {
            styleSheet(STYLE_ID, CROPPER_CSS + PAGE_CSS + overlayCss());
            raiseStyle('lgb-custom-style');
        }

        function removeStyle() {
            document.getElementById(STYLE_ID)?.remove();
        }

        function layerHost() {
            return document.body || document.documentElement;
        }

        function ensureLayer() {
            const host = layerHost();
            let layer = document.getElementById(LAYER_ID);
            if (!layer || layer.parentElement !== host) {
                layer?.remove();
                layer = el('div', { id: LAYER_ID }, el('div', { class: `${LB.P}-bg-inner` }));
                host.insertBefore(layer, host.firstChild);
            }
            return layer;
        }

        function applyFilters(inner) {
            const parts = [];
            const blur = Number(Config.getIn('bg.blur')) || 0;
            const brightness = Number(Config.getIn('bg.brightness'));
            const saturate = Number(Config.getIn('bg.saturate'));
            if (blur > 0) parts.push(`blur(${blur}px)`);
            if (Number.isFinite(brightness) && brightness !== 100) parts.push(`brightness(${brightness / 100})`);
            if (Number.isFinite(saturate) && saturate !== 100) parts.push(`saturate(${saturate / 100})`);

            const filter = parts.join(' ') || 'none';
            const layer = inner?.closest(`#${LAYER_ID}`) || document.getElementById(LAYER_ID);
            if (inner) inner.style.filter = filter;
            layer?.querySelectorAll('video').forEach((video) => {
                video.style.filter = filter;
            });
        }

        function pctVar(value, fallback, min, max) {
            const n = Number(value);
            return clamp(Number.isFinite(n) ? n : fallback, min, max) / 100;
        }

        let bgLuminance = null;
        const luminanceCache = new Map();

        function measureSource(source) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 18;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(source, 0, 0, 32, 18);
                const { data } = ctx.getImageData(0, 0, 32, 18);
                let sum = 0;
                let n = 0;
                for (let i = 0; i < data.length; i += 4) {
                    sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
                    n++;
                }
                return n ? sum / n : null;
            } catch (err) {
                LB.warn('背景亮度采样失败，改用不透明度推断：', err?.message || err);
                return null;
            }
        }

        async function sampleLuminance(media) {
            if (luminanceCache.has(media.id)) return luminanceCache.get(media.id);

            try {
                let source = null;

                if (media.type === 'image') {
                    const blob = media.data instanceof Blob ? media.data : media.data instanceof ArrayBuffer ? new Blob([media.data], { type: media.mime }) : null;
                    if (blob) source = await createImageBitmap(blob);
                }

                if (!source && media.type === 'video') {
                    const video = document.querySelector(`#${LAYER_ID} video`);
                    if (video && video.readyState >= 2 && video.videoWidth) source = await createImageBitmap(video);
                }

                if (!source) return null;
                const lum = measureSource(source);
                try {
                    source.close?.();
                } catch {}
                if (lum !== null) luminanceCache.set(media.id, lum);
                return lum;
            } catch (err) {
                LB.warn('背景亮度采样失败，改用不透明度推断：', err?.message || err);
                return null;
            }
        }

        function applyNavFg() {
            const root = document.documentElement.style;
            const nav = pctVar(Config.getIn('bg.navOpacity'), 0, 0, 100);

            if (bgLuminance === null || bgLuminance === undefined) {
                root.setProperty(`--${LB.P}-nav-fg`, nav >= 0.5 ? '#1f1f1f' : '#ffffff');
                return;
            }

            const overlay = clamp(Number(Config.getIn('bg.overlay')) || 0, 0, 100) / 100;
            const behindBar = bgLuminance * (1 - overlay);
            const effective = nav + (1 - nav) * behindBar;
            root.setProperty(`--${LB.P}-nav-fg`, effective > 0.5 ? '#1f1f1f' : '#ffffff');
        }

        function applyVars() {
            const root = document.documentElement.style;
            const nav = pctVar(Config.getIn('bg.navOpacity'), 0, 0, 100);
            root.setProperty(`--${LB.P}-nav-opacity`, String(nav));
            applyNavFg();
        }

        function applyGlassOverlay() {
            const isArticle = location.pathname.startsWith('/article/') && !location.pathname.startsWith('/article/mine');
            const isEdit = location.pathname.endsWith('/edit');
            const shouldShow = Config.getIn('bg.globalGlass') || (Config.getIn('bg.articleTransparent') === false && isArticle && !isEdit);

            let overlay = document.getElementById(GLASS_ID);
            if (shouldShow) {
                const host = layerHost();
                if (!overlay || overlay.parentElement !== host) {
                    overlay?.remove();
                    overlay = el('div', { id: GLASS_ID });
                    host.insertBefore(overlay, host.firstChild);
                }
                overlay.style.display = 'block';
            } else if (overlay) {
                overlay.style.display = 'none';
            }
        }

        async function pickMedia(items) {
            const currentId = Config.getIn('bg.currentId');
            const random = Config.getIn('bg.random') !== false;

            if (!random && currentId != null && items.some((m) => String(m.id) === String(currentId))) {
                return items.find((m) => String(m.id) === String(currentId));
            }

            const now = Date.now();
            const weights = items.map((m) => Math.max(1, now - (m.lastUsed || 0)));
            const total = weights.reduce((a, b) => a + b, 0);
            let rand = Math.random() * total;
            let chosen = items[items.length - 1];
            for (let i = 0; i < weights.length; i++) {
                rand -= weights[i];
                if (rand <= 0) {
                    chosen = items[i];
                    break;
                }
            }
            Config.set('bg.currentId', chosen.id, { silent: true });
            return chosen;
        }

        async function renderMedia(layer, inner, media) {
            inner.innerHTML = '';
            inner.style.backgroundImage = '';
            layer.querySelectorAll('video').forEach((video) => video.remove());

            if (media.type === 'video') {
                const url = mediaToUrl(media);
                if (!url) return;
                const video = el('video', {
                    src: url,
                    autoplay: true,
                    muted: true,
                    playsInline: true,
                    loop: media.loop !== false,
                    style: { pointerEvents: 'none' },
                });
                layer.append(video);
            } else {
                const url = await mediaImageUrl(media);
                if (!url) return;
                inner.style.backgroundImage = `url("${url}")`;
            }
            applyFilters(inner);

            bgLuminance = luminanceCache.has(media.id) ? luminanceCache.get(media.id) : null;
            applyNavFg();
            void sampleLuminance(media).then((lum) => {
                if (lum === null || lum === undefined) return;
                bgLuminance = lum;
                applyNavFg();
            });
        }

        function applyAppearance() {
            if (!Config.get('bgFullscreen') || Config.get('bgSource') !== 'custom') return;
            const layer = document.getElementById(LAYER_ID);
            if (!layer) return;
            const inner = layer.querySelector(`.${LB.P}-bg-inner`);
            applyVars();
            applyGlassOverlay();
            if (inner) applyFilters(inner);
        }

        async function apply() {
            try {
                await applyNow();
            } catch (err) {
                LB.error('自定义背景应用失败，稍后重试：', err);
            }
        }

        async function applyNow() {
            const active = Config.get('bgFullscreen') && Config.get('bgSource') === 'custom';
            if (!active) {
                document.getElementById(LAYER_ID)?.remove();
                document.getElementById(GLASS_ID)?.remove();
                removeStyle();
                releaseUrls();
                const root = document.documentElement.style;
                for (const name of ['nav-opacity', 'nav-fg']) {
                    root.removeProperty(`--${LB.P}-${name}`);
                }
                bgLuminance = null;
                return;
            }

            injectStyle();
            const layer = ensureLayer();
            const inner = layer.querySelector(`.${LB.P}-bg-inner`);
            if (!inner) return;

            applyVars();
            applyGlassOverlay();

            const items = await allMedia();
            if (!items.length) {
                releaseUrls();
                inner.innerHTML = '';
                inner.style.backgroundImage = '';
                layer.querySelectorAll('video').forEach((video) => video.remove());
                inner.style.backgroundImage = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)';
                applyFilters(inner);
                bgLuminance = 0.08;
                applyNavFg();
                return;
            }

            const chosen = await pickMedia(items);
            releaseUrls();
            if (chosen) {
                await renderMedia(layer, inner, chosen);
                void updateMedia(chosen.id, { lastUsed: Date.now() });
            }
        }

        const scheduleApply = debounce(() => void apply(), 120);
        const scheduleAppearance = debounce(applyAppearance, 60);

        for (const key of ['bgFullscreen', 'bgSource', 'bg.currentId', 'bg.random']) {
            Config.on(key, scheduleApply);
        }
        for (const key of [
            'bg.blur', 'bg.brightness', 'bg.saturate',
            'bg.overlay', 'bg.navOpacity', 'bg.articleTransparent', 'bg.globalGlass',
        ]) {
            Config.on(key, scheduleAppearance);
        }

        LB.Background = {
            MAX_MEDIA,
            allMedia,
            getMedia,
            addMedia,
            updateMedia,
            deleteMedia,
            clearMedia,
            mediaToUrl,
            imageUrl: mediaImageUrl,
            apply: scheduleApply,
            refreshNow: () => void apply(),
        };

        try {
            keepAlive(LAYER_ID, () => {
                if (Config.get('bgFullscreen') && Config.get('bgSource') === 'custom') scheduleApply();
            }, 1500);
            Spa.onNavigate(scheduleApply);
            void apply();
        } catch (err) {
            LB.error('自定义背景启动失败：', err);
        }
    });

    LB.define('background-panel', () => {
        const PANEL_ID = `${LB.P}-bg-config`;
        const GRID_STYLE_ID = `${LB.P}-bg-panel-style`;

        let thumbUrls = [];
        let panelHandle = null;

        function releaseThumbs() {
            thumbUrls.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch (_) {}
            });
            thumbUrls = [];
        }

        function injectGridStyle() {
            styleSheet(
                GRID_STYLE_ID,
                `.${LB.P}-bg-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
                  .${LB.P}-bg-item {
                      position: relative; width: 58px; height: 58px; border-radius: 6px;
                      overflow: hidden; border: 1px solid #ddd; cursor: pointer; background: #f4f4f4;
                  }
                  .${LB.P}-bg-item.is-current { outline: 2px solid #5e6ad2; outline-offset: 1px; }
                  .${LB.P}-bg-item img, .${LB.P}-bg-item video { width: 100%; height: 100%; object-fit: cover; display: block; }
                  .${LB.P}-bg-item__video {
                      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 22px;
                  }
                  .${LB.P}-bg-item__del, .${LB.P}-bg-item__loop {
                      position: absolute; border: none; color: #fff; cursor: pointer; padding: 0;
                      display: flex; align-items: center; justify-content: center; line-height: 1;
                  }
                  .${LB.P}-bg-item__del { top: 0; right: 0; width: 18px; height: 18px; background: rgba(231,76,60,.85); font-size: 13px; border-bottom-left-radius: 6px; }
                  .${LB.P}-bg-item__loop { bottom: 0; left: 0; width: 18px; height: 18px; background: rgba(0,0,0,.55); font-size: 10px; border-top-right-radius: 6px; }
                  .${LB.P}-bg-toolbar { display: flex; gap: 6px; align-items: center; }
                  .${LB.P}-bg-toolbar .${LB.P}-btn { flex: 0 0 auto; white-space: nowrap; }
                  .${LB.P}-bg-toolbar .${LB.P}-input { min-width: 0; flex: 1 1 auto; }
                  .${LB.P}-bg-empty { font-size: 12px; color: #999; padding: 6px 0; }
                  .${LB.P}-bg-section {
                      display: flex; align-items: center; justify-content: space-between;
                      font-size: 13px; color: #555; margin: 16px 0 2px;
                      padding-top: 12px; border-top: 1px solid #eee;
                  }
                  .${LB.P}-bg-section:first-of-type { border-top: none; margin-top: 4px; padding-top: 0; }
                  .${LB.P}-bg-switch-row {
                      display: flex; align-items: center; justify-content: flex-start; gap: 10px;
                      margin: 6px 0 12px; font-size: 14px;
                  }
                  .${LB.P}-bg-switch-row .${LB.P}-check { margin: 0; padding: 0; }`
            );
        }

        function cropThenStore(blob) {
            const CropperCtor = typeof Cropper !== 'undefined' ? Cropper : window.Cropper;
            if (typeof CropperCtor !== 'function') {
                LB.warn('Cropper.js 未加载，已按原图保存');
                toast('裁剪器未加载，已按原图保存', 'info');
                return Promise.resolve(blob);
            }

            return toBlobUrl(blob).then(
                (dataUrl) =>
                    new Promise((resolve) => {
                        const image = el('img', { style: { maxWidth: '100%', display: 'block' } });
                        const loading = el('div', { class: `${LB.P}-bg-empty`, text: '正在载入图片…' });
                        const confirmBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--primary`, type: 'button', text: '确认裁剪' });
                        const cancelBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost`, type: 'button', text: '取消' });
                        const cropBody = el('div', { style: { maxWidth: '78vw', maxHeight: '58vh', overflow: 'hidden' } }, loading, image);

                        const handle = openWindow({
                            id: `${LB.P}-cropper`,
                            title: '裁剪背景图片',
                            width: 'min(860px, 92vw)',
                            body: el('div', null, cropBody, el('div', { class: `${LB.P}-window__foot`, style: { padding: '14px 0 0' } }, cancelBtn, confirmBtn)),
                            onClose: () => {
                                cropper?.destroy();
                                resolve(null);
                            },
                        });

                        let cropper = null;
                        let closeTimer = null;
                        const finish = (value) => {
                            clearTimeout(closeTimer);
                            cropper?.destroy();
                            cropper = null;
                            handle.close();
                            resolve(value);
                        };

                        cancelBtn.addEventListener('click', () => finish(null));
                        image.addEventListener('load', () => {
                            clearTimeout(closeTimer);
                            loading.remove();
                            const aspect = window.innerWidth / window.innerHeight;
                            try {
                                cropper = new CropperCtor(image, {
                                    aspectRatio: aspect,
                                    viewMode: 1,
                                    dragMode: 'move',
                                    autoCropArea: 0.8,
                                    cropBoxMovable: true,
                                    cropBoxResizable: true,
                                    background: false,
                                });
                            } catch (err) {
                                LB.warn('裁剪器初始化失败，改用原图：', err);
                                finish(blob);
                            }
                        });
                        image.addEventListener('error', () => {
                            toast('图片无法预览，已按原图保存', 'error');
                            finish(blob);
                        });
                        confirmBtn.addEventListener('click', () => {
                            if (!cropper) {
                                toast('图片还没载入完成', 'error');
                                return;
                            }
                            const aspect = window.innerWidth / window.innerHeight;
                            const maxW = Math.min(2560, window.innerWidth * 2);
                            const canvas = cropper.getCroppedCanvas({
                                maxWidth: maxW,
                                maxHeight: Math.round(maxW / aspect),
                                fillColor: '#fff',
                                imageSmoothingQuality: 'high',
                            });
                            if (!canvas) return finish(blob);
                            canvas.toBlob((out) => finish(out || blob), 'image/jpeg', 0.85);
                        });

                        closeTimer = setTimeout(() => {
                            LB.warn('图片载入超时，已按原图保存');
                            finish(blob);
                        }, 20000);
                        image.src = dataUrl;
                    })
            );
        }

        function backgroundApi() {
            const api = LB.Background;
            if (!api) {
                LB.error('背景模块未就绪，无法管理背景媒体');
                toast('背景模块未就绪，请刷新页面后重试', 'error');
            }
            return api || null;
        }

        function toBlobUrl(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = () => reject(new Error('读取文件失败'));
                reader.readAsDataURL(blob);
            });
        }

        async function cropImageBlob(blob) {
            const cropped = await cropThenStore(blob);
            if (!cropped) return false;
            await backgroundApi().addMedia({ type: 'image', mime: cropped.type || blob.type || 'image/jpeg', data: cropped });
            toast('图片已保存', 'ok');
            return true;
        }

        async function storeFiles(files, refresh) {
            const api = backgroundApi();
            if (!api) return;
            for (const file of Array.from(files)) {
                try {
                    if (file.type.startsWith('video/')) {
                        await api.addMedia({ type: 'video', mime: file.type, data: file, loop: true });
                        toast('视频已添加', 'ok');
                    } else {
                        await cropImageBlob(file);
                    }
                } catch (err) {
                    toast(err?.message || '添加失败', 'error');
                }
            }
            await refresh();
            api.refreshNow();
        }

        function gmFetchRemoteBlob(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    responseType: 'blob',
                    timeout: 30000,
                    onload: (res) => {
                        const blob = res.response;
                        if (!(blob instanceof Blob) || !blob.size) reject(new Error(`HTTP ${res.status || '空响应'}`));
                        else if (res.status >= 400) reject(new Error(`HTTP ${res.status}`));
                        else resolve(blob);
                    },
                    onerror: () => reject(new Error('网络请求失败')),
                    ontimeout: () => reject(new Error('网络请求超时')),
                });
            });
        }

        function directFetchRemoteBlob(url) {
            return fetch(url, { credentials: 'omit' }).then((res) => {
                if (!res.ok || res.type === 'opaque') throw new Error(`HTTP ${res.status || '跨域被拒'}`);
                return res.blob();
            });
        }

        function fetchRemoteBlob(url) {
            if (typeof GM_xmlhttpRequest !== 'function') return directFetchRemoteBlob(url);

            return gmFetchRemoteBlob(url).catch((err) => {
                LB.warn('GM 请求直链失败，改用 fetch 重试：', err?.message || err);
                return directFetchRemoteBlob(url).catch(() => {
                    throw err;
                });
            });
        }

        async function addFromUrl(url, refresh) {
            if (!url) return;
            const api = backgroundApi();
            if (!api) return;
            try {
                const blob = await fetchRemoteBlob(url);
                if (!blob.size) throw new Error('返回内容为空');
                if (blob.type.startsWith('video/') || /\.(mp4|webm|ogv|mov)(\?|#|$)/i.test(url)) {
                    await api.addMedia({ type: 'video', mime: blob.type || 'video/mp4', data: blob, loop: true });
                    toast('视频已添加', 'ok');
                } else {
                    await cropImageBlob(blob);
                }
            } catch (err) {
                LB.warn('无法加载该 URL：', err);
                toast(`无法加载该 URL（${err?.message || '未知错误'}）`, 'error');
            }
            await refresh();
            api.refreshNow();
        }

        function open() {
            const existing = document.getElementById(PANEL_ID);
            if (existing) {
                panelHandle?.close({ force: true });
                existing.remove();
                return;
            }
            injectBaseStyle();
            injectGridStyle();

            const body = el('div', { style: { minWidth: '320px' } });
            const mediaCount = el('span', { text: '' });
            const grid = el('div', { class: `${LB.P}-bg-grid` });

            body.append(el('div', { class: `${LB.P}-bg-section` }, el('span', { text: '媒体管理' }), mediaCount));

            const urlInput = el('input', {
                class: `${LB.P}-input`,
                type: 'text',
                inputmode: 'url',
                placeholder: '输入图片 / 视频直链',
                style: { flex: '1 1 auto', fontFamily: 'inherit', fontSize: '13px' },
            });
            const addUrlBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost ${LB.P}-btn--sm`, type: 'button', text: '添加' });
            const uploadBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost ${LB.P}-btn--sm`, type: 'button', text: '上传文件' });
            body.append(el('div', { class: `${LB.P}-bg-toolbar` }, urlInput, addUrlBtn, uploadBtn));
            body.append(grid);

            const fileInput = el('input', {
                type: 'file',
                accept: 'image/*,video/mp4',
                multiple: true,
                style: { position: 'fixed', left: '-9999px', top: '0', width: '1px', height: '1px', opacity: '0' },
            });
            body.append(fileInput);

            const openFilePicker = () => {
                const picker = body.querySelector('input[type="file"]');
                if (!picker) {
                    toast('文件选择器未就绪，请重新打开背景设置', 'error');
                    return;
                }
                let fellBack = false;
                const fallback = () => {
                    if (fellBack) return;
                    fellBack = true;
                    try {
                        picker.click();
                    } catch (err) {
                        LB.warn('打开文件选择器失败：', err);
                        toast('浏览器拒绝了文件选择，请改用直链', 'error');
                    }
                };
                try {
                    if (typeof picker.showPicker === 'function') {
                        picker.addEventListener('error', fallback, { once: true });
                        picker.showPicker();
                    } else {
                        fallback();
                    }
                } catch (err) {
                    LB.warn('showPicker 不可用，改用 click：', err);
                    fallback();
                }
            };

            addUrlBtn.addEventListener('click', () => {
                const url = urlInput.value.trim();
                if (!url) {
                    toast('请先填入图片或视频直链', 'error');
                    urlInput.focus();
                    return;
                }
                addUrlBtn.disabled = true;
                addFromUrl(url, renderGrid).finally(() => {
                    addUrlBtn.disabled = false;
                    urlInput.value = '';
                });
            });
            uploadBtn.addEventListener('click', openFilePicker);
            fileInput.addEventListener('change', () => {
                const files = Array.from(fileInput.files || []);
                fileInput.value = '';
                if (!files.length) return;
                uploadBtn.disabled = true;
                storeFiles(files, renderGrid).finally(() => {
                    uploadBtn.disabled = false;
                });
            });

            body.append(el('div', { class: `${LB.P}-bg-section` }, el('span', { text: '背景滤镜' })));
            body.append(
                sliderRow({
                    label: '模糊度', min: 0, max: 40, unit: 'px',
                    value: Math.round(Config.getIn('bg.blur')),
                    onInput: (v) => Config.set('bg.blur', v),
                }),
                sliderRow({
                    label: '亮度', min: 30, max: 200, step: 5, unit: '%',
                    value: Math.round(Config.getIn('bg.brightness')),
                    onInput: (v) => Config.set('bg.brightness', v),
                }),
                sliderRow({
                    label: '饱和度', min: 0, max: 200, step: 5, unit: '%',
                    value: Math.round(Config.getIn('bg.saturate')),
                    onInput: (v) => Config.set('bg.saturate', v),
                }),
                sliderRow({
                    label: '遮罩浓度', min: 0, max: 100, unit: '%',
                    value: Math.round(Config.getIn('bg.overlay')),
                    onInput: (v) => Config.set('bg.overlay', v),
                })
            );

            body.append(el('div', { class: `${LB.P}-bg-section` }, el('span', { text: '其它' })));
            const switchRow = (label, key, hint) =>
                el(
                    'div',
                    { class: `${LB.P}-bg-switch-row` },
                    el('span', { text: label, title: hint || '' }),
                    checkbox('', Config.getIn(key), (checked) => {
                        Config.set(key, checked);
                        backgroundApi()?.refreshNow();
                    })
                );

            body.append(
                switchRow('专栏全透', 'bg.articleTransparent'),
                switchRow('毛玻璃效果', 'bg.globalGlass'),
                switchRow('随机背景', 'bg.random')
            );

            const resetBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost`, type: 'button', text: '恢复默认' });
            const clearBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost`, type: 'button', text: '清空全部' });
            resetBtn.addEventListener('click', () => {
                Config.data.bg = structuredClone(DEFAULT_SETTINGS.bg);
                Config.saveNow();
                Config.notify([
                    'bg.currentId', 'bg.random', 'bg.blur', 'bg.brightness', 'bg.saturate', 'bg.overlay',
                    'bg.navOpacity', 'bg.articleTransparent', 'bg.globalGlass',
                ]);
                backgroundApi()?.refreshNow();
                handle.close({ force: true });
                open();
                toast('背景设置已恢复默认', 'ok');
            });
            clearBtn.addEventListener('click', async () => {
                if (!window.confirm('确定要删除全部背景媒体吗？此操作不可撤销。')) return;
                const api = backgroundApi();
                if (!api) return;
                await api.clearMedia();
                api.refreshNow();
                renderGrid();
                toast('已清空全部媒体', 'ok');
            });

            const handle = openWindow({
                id: PANEL_ID,
                title: '背景设置',
                body,
                actions: [],
                onClose: () => {
                    panelHandle = null;
                    releaseThumbs();
                },
            });
            panelHandle = handle;

            body.append(el('div', { class: `${LB.P}-window__foot`, style: { padding: '18px 0 0' } }, resetBtn, clearBtn));

            async function renderGrid() {
                releaseThumbs();
                const api = backgroundApi();
                if (!api) return;
                const items = await api.allMedia();
                mediaCount.textContent = `${items.length} / ${api.MAX_MEDIA}`;
                grid.innerHTML = '';

                if (!items.length) {
                    grid.append(el('div', { class: `${LB.P}-bg-empty`, text: '还没有素材，上传一张图片试试。' }));
                    return;
                }

                const currentId = Config.getIn('bg.currentId');
                for (const media of items) {
                    const isCurrent = String(media.id) === String(currentId);
                    const item = el('div', {
                        class: `${LB.P}-bg-item${isCurrent ? ' is-current' : ''}`,
                        title: media.type === 'video' ? '视频背景' : '图片背景',
                    });

                    if (media.type === 'video') {
                        item.append(el('div', { class: `${LB.P}-bg-item__video`, text: '🎥' }));
                    } else {
                        const url = await api.imageUrl(media, { cache: false });
                        if (url.startsWith('blob:')) thumbUrls.push(url);
                        item.append(el('img', { src: url, alt: '' }));
                    }

                    const del = el('button', { class: `${LB.P}-bg-item__del`, type: 'button', text: '×', title: '删除' });
                    del.addEventListener('click', async (event) => {
                        event.stopPropagation();
                        await api.deleteMedia(media.id);
                        api.refreshNow();
                        renderGrid();
                    });
                    item.append(del);

                    if (media.type === 'video') {
                        const loop = el('button', {
                            class: `${LB.P}-bg-item__loop`,
                            type: 'button',
                            text: media.loop === false ? '▶' : '🔁',
                            title: '循环播放',
                        });
                        loop.addEventListener('click', async (event) => {
                            event.stopPropagation();
                            await api.updateMedia(media.id, { loop: media.loop === false });
                            if (String(Config.getIn('bg.currentId')) === String(media.id)) api.refreshNow();
                            renderGrid();
                        });
                        item.append(loop);
                    }

                    item.addEventListener('click', () => {
                        Config.set('bg.currentId', media.id);
                        Config.set('bg.random', false);
                        api.refreshNow();
                        renderGrid();
                        toast('已切换为该背景', 'ok');
                    });

                    grid.append(item);
                }
            }

            void renderGrid();
        }

        LB.openBackgroundPanel = open;
    });

    LB.define('benben', () => {
        const REPLY_TEXT_MATCH = /回复|reply/i;

        function extractReplacements(container) {
            const list = [];
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
                acceptNode(node) {
                    if (node.classList && node.classList.contains('katex')) return NodeFilter.FILTER_ACCEPT;
                    if (node.tagName === 'SCRIPT' && node.type && /^math\/tex/.test(node.type)) return NodeFilter.FILTER_ACCEPT;
                    if (['STRONG', 'B', 'EM', 'I', 'DEL', 'S', 'CODE', 'A', 'IMG'].includes(node.tagName)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                },
            });

            while (walker.nextNode()) {
                const node = walker.currentNode;
                const tag = node.tagName.toLowerCase();
                try {
                    if (tag === 'img') {
                        const alt = (node.getAttribute('alt') || '').trim();
                        const src = node.getAttribute('src') || '';
                        if (src) {
                            const replacement = `![${alt}](${src})`;
                            list.push(alt ? { text: alt, replacement } : { text: '', replacement, type: 'img' });
                        }
                        continue;
                    }
                    if (tag === 'a') {
                        const text = node.textContent.trim();
                        const href = node.getAttribute('href') || '';
                        if (text && href) list.push({ text, replacement: `[${text}](${href})` });
                        continue;
                    }
                    if (node.classList && node.classList.contains('katex')) {
                        const ann = node.querySelector('annotation[encoding="application/x-tex"]');
                        const raw = ann ? ann.textContent.trim() : null;
                        const rendered = node.textContent.trim();
                        if (raw && rendered) list.push({ text: rendered, replacement: `$${raw}$` });
                        continue;
                    }
                    if (tag === 'script' && /^math\/tex/.test(node.type)) {
                        const raw = node.textContent.trim();
                        if (raw) {
                            const replacement = node.type.includes('display') ? `$$\n${raw}\n$$` : `$${raw}$`;
                            list.push({ text: raw, replacement });
                        }
                        continue;
                    }
                    const rendered = node.textContent.trim();
                    if (!rendered) continue;
                    const cmap = {
                        strong: `**${rendered}**`,
                        b: `**${rendered}**`,
                        em: `*${rendered}*`,
                        i: `*${rendered}*`,
                        del: `~~${rendered}~~`,
                        s: `~~${rendered}~~`,
                        code: `\`${rendered}\``,
                    };
                    if (cmap[tag]) list.push({ text: rendered, replacement: cmap[tag] });
                } catch (_) {}
            }
            return list;
        }

        function applyReplacements(text, list) {
            const normal = list.filter((item) => item.text && item.type !== 'img');
            const imageless = list.filter((item) => item.type === 'img' || !item.text);
            const sorted = normal.sort((a, b) => b.text.length - a.text.length);
            let result = text;
            for (const { text: search, replacement } of sorted) {
                const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                result = result.replace(new RegExp(escaped, 'g'), replacement);
            }
            for (const item of imageless) {
                if (item.replacement && !result.includes(item.replacement)) result += '\n' + item.replacement;
            }
            return result;
        }

        function findContent(commentItem) {
            for (const sel of ['.am-comment-bd', '.markdown-body', '.feed-content', '.comment-content', '[class*="content"]']) {
                const node = commentItem.querySelector(sel);
                if (node) return node;
            }
            return commentItem;
        }

        function fillSource(replacements) {
            const textarea = document.querySelector('.am-form-group.am-form textarea, textarea');
            if (!textarea) {
                setTimeout(() => fillSource(replacements), 100);
                return;
            }
            const oldVal = textarea.value;
            const newVal = applyReplacements(oldVal, replacements);
            if (newVal !== oldVal) {
                textarea.value = newVal;
                textarea.focus();
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        document.addEventListener('click', (event) => {
            if (!Config.get('benbenOn')) return;
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (!REPLY_TEXT_MATCH.test((target.innerText || '').trim())) return;

            const commentItem = target.closest(
                '.feed-item, .am-comment, li[class*="comment"], .comment-item, [class*="feed-item"]'
            );
            if (!commentItem) return;

            const replacements = extractReplacements(findContent(commentItem));
            if (replacements.length === 0) return;

            setTimeout(() => fillSource(replacements), 200);
        });
    });

    LB.define('imagehosting', () => {
        const isImagePage = () => /^\/image(\/|$)/.test(location.pathname);

        function findDropZone() {
            return (
                document.querySelector('.upload-layout .drop') ||
                document.querySelector('.upload-card .drop') ||
                document.querySelector('.drop') ||
                document.querySelector('.upload-trigger')
            );
        }

        function findFileInput() {
            const inputs = document.querySelectorAll('input[type="file"]');
            for (const input of inputs) {
                const accept = input.getAttribute('accept') || '';
                if (!accept || /image/i.test(accept)) return input;
            }
            return inputs.length ? inputs[0] : null;
        }

        function sendToDropZone(file, zone) {
            if (typeof DataTransfer !== 'function' || typeof DragEvent !== 'function') return false;
            try {
                const dt = new DataTransfer();
                dt.items.add(file);
                zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
                return true;
            } catch (err) {
                console.debug('[Luogu Better!][图床] drop 方式失败：', err);
                return false;
            }
        }

        function sendToFileInput(file, input) {
            if (typeof DataTransfer !== 'function') return false;
            try {
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            } catch (err) {
                console.debug('[Luogu Better!][图床] file input 方式失败：', err);
                return false;
            }
        }

        function uploadFile(file) {
            const zone = findDropZone();
            if (zone && sendToDropZone(file, zone)) return true;
            const input = findFileInput();
            if (input && sendToFileInput(file, input)) return true;
            return false;
        }

        const isImageLike = (type) => !type || type.indexOf('image/') === 0;

        function pickImageFromClipboard(dt) {
            if (!dt) return null;
            const items = dt.items;
            if (items && items.length) {
                for (const item of items) {
                    if (item.kind === 'file' && isImageLike(item.type)) {
                        const file = item.getAsFile();
                        if (file) return file;
                    }
                }
            }
            const files = dt.files;
            if (files && files.length) {
                for (const file of files) {
                    if (isImageLike(file.type)) return file;
                }
            }
            return null;
        }

        function describeClipboard(dt) {
            const out = [];
            try {
                if (dt.items) {
                    for (const item of dt.items) out.push(`${item.kind}:${item.type || '(空类型)'}`);
                }
            } catch (_) {}
            return out.length ? out.join(', ') : '(剪贴板里没有可识别内容)';
        }

        function onPaste(event) {
            if (!Config.get('imageHostingOn')) return;
            if (!isImagePage()) return;

            const dt = event.clipboardData || window.clipboardData;
            if (!dt) return;

            const file = pickImageFromClipboard(dt);
            if (!file) {
                console.debug(`[Luogu Better!][图床] 剪贴板里没找到图片，已放行。内容：${describeClipboard(dt)}`);
                return;
            }

            const target = event.target;
            const inField =
                target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
            if (inField) {
                let hasText = false;
                try {
                    hasText = !!(dt.getData && dt.getData('text/plain'));
                } catch (_) {}
                if (hasText) return;
            }

            event.preventDefault();
            event.stopPropagation();

            const name = file.name || `clipboard-${Date.now()}.png`;
            const kb = Math.max(1, Math.round(file.size / 1024));
            if (uploadFile(file)) {
                console.log(`[Luogu Better!][图床] 已把图片移交上传流程：${name}（${kb} KB, ${file.type || '无类型'}）`);
                toast(`已捕获剪贴板图片（${name}，${kb} KB），正在上传…`, 'ok');
            } else {
                console.warn('[Luogu Better!][图床] 没找到上传区域', diagnose());
                toast('没找到图床的上传区域，请确认已登录且停留在图床页面', 'error');
            }
        }

        function diagnose() {
            const zone = findDropZone();
            const input = findFileInput();
            return {
                url: location.href,
                在图片页: isImagePage(),
                上传区域: zone ? `${zone.tagName}.${zone.className || ''}` : null,
                文件输入框: input ? `${input.tagName}${input.accept ? `[accept=${input.accept}]` : ''}` : null,
            };
        }

        document.addEventListener('paste', onPaste, true);

        try {
            const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            win.__luoguBetterPaste = { uploadFile, findDropZone, findFileInput, pickImageFromClipboard, check: diagnose };
        } catch (_) {}

        if (isImagePage()) {
            let tries = 0;
            (function poll() {
                if (findDropZone()) {
                    console.log('[Luogu Better!][图床] 已就绪，找到上传区域', diagnose());
                    return;
                }
                if (tries++ > 20) {
                    console.log('[Luogu Better!][图床] 已就绪，但没找到上传区域', diagnose());
                    return;
                }
                setTimeout(poll, 300);
            })();
        }
    });

    LB.define('contest', () => {
        const CACHE_KEY = 'luogu-better.contest-cache';
        const REQUEST_INTERVAL_MS = 1000;
        const GOLD_CLASS = `${LB.P}-elo-badge`;
        const TOUCHED_CLASS = `${LB.P}-elo-touched`;

        let lastRequestStartedAt = 0;
        let running = false;
        let rerunRequested = false;

        const originals = new WeakMap();

        styleSheet(
            `${LB.P}-contest-style`,
            `.${GOLD_CLASS} {
                  background-color: #d1af60 !important;
                  color: #fff !important;
              }`
        );

        const readCache = () => {
            const value = Store.get(CACHE_KEY, {});
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        };
        const writeCache = (cache) => Store.set(CACHE_KEY, cache);

        function findRatedContests() {
            const entries = new Map();
            for (const panel of document.querySelectorAll('section.lg-index-contest')) {
                const title = panel.querySelector('.am-panel-title');
                const link = title?.querySelector('a[href^="/contest/"]');
                const badge = [...(title?.querySelectorAll('span') ?? [])].find(
                    (element) => element.textContent.trim() === 'Rated'
                );
                if (!link || !badge) continue;

                const match = new URL(link.href, location.origin).pathname.match(/^\/contest\/(\d+)\/?$/);
                if (!match) continue;

                const id = match[1];
                const known = entries.get(id);
                if (known) known.badges.push(badge);
                else entries.set(id, { id, url: new URL(`/contest/${id}`, location.origin).href, badges: [badge] });
            }
            return [...entries.values()];
        }

        async function fetchEloThreshold(url) {
            const response = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'text/html' } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const page = new DOMParser().parseFromString(await response.text(), 'text/html');
            const contextElement = page.querySelector('script#lentille-context[type="application/json"]');
            if (!contextElement) throw new Error('未找到 lentille-context');

            const context = JSON.parse(contextElement.textContent);
            const contest = context.data?.contest ?? context.contest;
            const eloThreshold = Number(contest?.eloThreshold);
            if (!Number.isFinite(eloThreshold)) throw new Error('eloThreshold 不是有效数字');
            return eloThreshold;
        }

        function renderBadge(badge, eloThreshold) {
            rememberBadge(badge);
            badge.classList.add(TOUCHED_CLASS);

            if (eloThreshold > 0) {
                badge.textContent = eloThreshold === 9999 ? 'Elo' : `${eloThreshold}`;
                badge.classList.remove('lg-bg-green');
                badge.classList.add(GOLD_CLASS);
                return;
            }
            badge.textContent = '咕值';
            badge.classList.remove(GOLD_CLASS);
            badge.classList.add('lg-bg-green');
        }

        function rememberBadge(badge) {
            if (originals.has(badge)) return;
            originals.set(badge, { text: badge.textContent, className: badge.className });
        }

        function restoreBadges() {
            for (const badge of $$(`.${TOUCHED_CLASS}`)) {
                const original = originals.get(badge);
                if (original) {
                    badge.textContent = original.text;
                    badge.className = original.className;
                } else {
                    badge.classList.remove(TOUCHED_CLASS);
                }
            }
        }

        async function waitForRequestSlot() {
            const waitTime = Math.max(0, REQUEST_INTERVAL_MS - (Date.now() - lastRequestStartedAt));
            if (waitTime > 0) await sleep(waitTime);
            lastRequestStartedAt = Date.now();
        }

        async function run() {
            if (!Config.get('contestOn')) return;
            if (location.pathname !== '/') return;
            if (running) {
                rerunRequested = true;
                return;
            }

            const entries = findRatedContests();
            if (entries.length === 0) return;

            running = true;
            try {
                const cache = readCache();
                const pending = [];
                for (const entry of entries) {
                    if (Object.prototype.hasOwnProperty.call(cache, entry.id)) {
                        entry.badges.forEach((badge) => renderBadge(badge, cache[entry.id]));
                    } else {
                        pending.push(entry);
                    }
                }

                for (const entry of pending) {
                    if (!Config.get('contestOn')) break;
                    try {
                        await waitForRequestSlot();
                        const eloThreshold = await fetchEloThreshold(entry.url);
                        if (!Config.get('contestOn')) break;
                        cache[entry.id] = eloThreshold;
                        writeCache(cache);
                        entry.badges.forEach((badge) => renderBadge(badge, eloThreshold));
                    } catch (err) {
                        LB.warn(`无法读取比赛 ${entry.id}：`, err);
                    }
                }
            } finally {
                running = false;
                if (rerunRequested) {
                    rerunRequested = false;
                    if (Config.get('contestOn')) void run();
                }
            }
        }

        Config.on('contestOn', (on) => {
            if (on) void run();
            else restoreBadges();
        });

        observeAdded('section.lg-index-contest', debounce(() => void run(), 400));
        Spa.onNavigate(() => setTimeout(() => void run(), 500));
        setTimeout(() => void run(), 800);
    });

    LB.define('updater', () => {
        const API = `https://api.github.com/repos/${LB.REPO_OWNER}/${LB.REPO_NAME}`;

        async function fetchRelease(channel) {
            const res = await request(`${API}/releases?per_page=20`, {
                headers: { Accept: 'application/vnd.github+json' },
            });
            if (!res.ok) throw new Error(`GitHub 返回 HTTP ${res.status}`);

            const list = JSON.parse(res.text);
            if (!Array.isArray(list) || list.length === 0) throw new Error('仓库还没有发布任何版本');

            const usable = list.filter((item) => !item.draft);
            const release =
                channel === 'stable' ? usable.find((item) => !item.prerelease) : usable[0];

            if (!release) {
                throw new Error("暂时没有可用版本");
            }
            return release;
        }

        function pickAsset(release) {
            const assets = release.assets || [];
            const hit =
                assets.find((a) => /LuoguBetter\.user\.js$/i.test(a.name)) ||
                assets.find((a) => /\.user\.js$/i.test(a.name));
            return hit?.browser_download_url || release.html_url;
        }

        const lastCheckKey = 'luogu-better.last-update-check';

        /**
          * @param {{manual?: boolean, autoInstall?: boolean}} opts
          */
        async function checkUpdate({ manual = false, autoInstall = false } = {}) {
            const channel = Config.get('updateChannel');
            const label = channel === 'stable' ? '稳定版' : '最新版';

            try {
                const release = await fetchRelease(channel);
                const remote = String(release.tag_name || release.name || '').trim();
                if (!remote) throw new Error('无法解析版本号');

                Store.set(lastCheckKey, { at: Date.now(), channel, remote });

                if (compareVersion(remote, LB.VERSION) > 0) {
                    const url = pickAsset(release);
                    if (autoInstall) {
                        toast(`发现新版本 ${remote}，正在打开安装页面…`, 'ok');
                        window.open(url, '_blank', 'noopener');
                        return { ok: true, updated: true, remote, url };
                    }
                    const confirmed = window.confirm(
                        `发现新版本！\n\n当前版本：v${LB.VERSION}\n${label}：${remote}\n\n是否前往安装？`
                    );
                    if (confirmed) window.open(url, '_blank', 'noopener');
                    return { ok: true, updated: true, remote, url };
                }

                if (manual) toast(`已是最新版本（v${LB.VERSION}，${label}）`, 'ok');
                return { ok: true, updated: false, remote };
            } catch (err) {
                const message = err?.message || String(err);
                LB.warn('检查更新失败：', err);
                if (manual) {
                    toast(`检查更新失败：${message}`, 'error', 4200);
                }
                return { ok: false, error: message };
            }
        }

        LB.checkUpdate = checkUpdate;

        const last = Store.get(lastCheckKey, null);
        if (!last || Date.now() - (last.at || 0) > 24 * 3600 * 1000) {
            setTimeout(() => void checkUpdate({ manual: false }), 3000);
        }
    });

    (async function bootstrap() {
        await domReady();

        if (!document.body) await waitFor(() => document.body, { timeout: 5000 });

        Config.load();

        injectBaseStyle();

        Spa.install();
        Panel.mountEntry();

        for (const [name, factory] of LB.modules) {
            try {
                factory();
                LB.started.push(name);
            } catch (err) {
                LB.error(`模块 ${name} 启动失败：`, err);
            }
        }

        LB.log(`已启动（v${LB.VERSION}）`, LB.started.join(', '));

        try {
            const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            win.LuoguBetter = {
                version: LB.VERSION,
                config: Config,
                panel: Panel,
                store: Store,
                media: MediaDB,
                background: LB.Background,
                modules: LB.started,
                openPanel: () => Panel.open(),
                openBackgroundPanel: () => LB.openBackgroundPanel?.(),
                checkUpdate: (opts) => LB.checkUpdate?.(opts),
            };
        } catch (err) {
            LB.warn('暴露调试接口失败：', err);
        }
    })();
})();
