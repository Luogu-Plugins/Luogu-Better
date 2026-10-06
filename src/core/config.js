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
