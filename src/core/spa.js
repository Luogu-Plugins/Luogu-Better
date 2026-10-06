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
