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
