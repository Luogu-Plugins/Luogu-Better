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
