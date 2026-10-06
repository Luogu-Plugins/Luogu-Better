const LB = {
    ID: 'luogu-better',
    NAME: 'Luogu Better!',
    VERSION: '__LB_VERSION__',
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
