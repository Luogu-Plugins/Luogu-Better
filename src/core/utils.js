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
