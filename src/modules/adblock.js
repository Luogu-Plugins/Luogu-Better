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
