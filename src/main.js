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
