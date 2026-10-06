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
