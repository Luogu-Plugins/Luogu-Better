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
