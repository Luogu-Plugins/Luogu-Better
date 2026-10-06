LB.define('contest', () => {
    const CACHE_KEY = 'luogu-better.contest-cache';
    const REQUEST_INTERVAL_MS = 1000;
    const GOLD_CLASS = `${LB.P}-elo-badge`;
    const TOUCHED_CLASS = `${LB.P}-elo-touched`;

    let lastRequestStartedAt = 0;
    let running = false;
    let rerunRequested = false;

    const originals = new WeakMap();

    styleSheet(
        `${LB.P}-contest-style`,
        `.${GOLD_CLASS} {
              background-color: #d1af60 !important;
              color: #fff !important;
          }`
    );

    const readCache = () => {
        const value = Store.get(CACHE_KEY, {});
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    };
    const writeCache = (cache) => Store.set(CACHE_KEY, cache);

    function findRatedContests() {
        const entries = new Map();
        for (const panel of document.querySelectorAll('section.lg-index-contest')) {
            const title = panel.querySelector('.am-panel-title');
            const link = title?.querySelector('a[href^="/contest/"]');
            const badge = [...(title?.querySelectorAll('span') ?? [])].find(
                (element) => element.textContent.trim() === 'Rated'
            );
            if (!link || !badge) continue;

            const match = new URL(link.href, location.origin).pathname.match(/^\/contest\/(\d+)\/?$/);
            if (!match) continue;

            const id = match[1];
            const known = entries.get(id);
            if (known) known.badges.push(badge);
            else entries.set(id, { id, url: new URL(`/contest/${id}`, location.origin).href, badges: [badge] });
        }
        return [...entries.values()];
    }

    async function fetchEloThreshold(url) {
        const response = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'text/html' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const page = new DOMParser().parseFromString(await response.text(), 'text/html');
        const contextElement = page.querySelector('script#lentille-context[type="application/json"]');
        if (!contextElement) throw new Error('未找到 lentille-context');

        const context = JSON.parse(contextElement.textContent);
        const contest = context.data?.contest ?? context.contest;
        const eloThreshold = Number(contest?.eloThreshold);
        if (!Number.isFinite(eloThreshold)) throw new Error('eloThreshold 不是有效数字');
        return eloThreshold;
    }

    function renderBadge(badge, eloThreshold) {
        rememberBadge(badge);
        badge.classList.add(TOUCHED_CLASS);

        if (eloThreshold > 0) {
            badge.textContent = eloThreshold === 9999 ? 'Elo' : `${eloThreshold}`;
            badge.classList.remove('lg-bg-green');
            badge.classList.add(GOLD_CLASS);
            return;
        }
        badge.textContent = '咕值';
        badge.classList.remove(GOLD_CLASS);
        badge.classList.add('lg-bg-green');
    }

    function rememberBadge(badge) {
        if (originals.has(badge)) return;
        originals.set(badge, { text: badge.textContent, className: badge.className });
    }

    function restoreBadges() {
        for (const badge of $$(`.${TOUCHED_CLASS}`)) {
            const original = originals.get(badge);
            if (original) {
                badge.textContent = original.text;
                badge.className = original.className;
            } else {
                badge.classList.remove(TOUCHED_CLASS);
            }
        }
    }

    async function waitForRequestSlot() {
        const waitTime = Math.max(0, REQUEST_INTERVAL_MS - (Date.now() - lastRequestStartedAt));
        if (waitTime > 0) await sleep(waitTime);
        lastRequestStartedAt = Date.now();
    }

    async function run() {
        if (!Config.get('contestOn')) return;
        if (location.pathname !== '/') return;
        if (running) {
            rerunRequested = true;
            return;
        }

        const entries = findRatedContests();
        if (entries.length === 0) return;

        running = true;
        try {
            const cache = readCache();
            const pending = [];
            for (const entry of entries) {
                if (Object.prototype.hasOwnProperty.call(cache, entry.id)) {
                    entry.badges.forEach((badge) => renderBadge(badge, cache[entry.id]));
                } else {
                    pending.push(entry);
                }
            }

            for (const entry of pending) {
                if (!Config.get('contestOn')) break;
                try {
                    await waitForRequestSlot();
                    const eloThreshold = await fetchEloThreshold(entry.url);
                    if (!Config.get('contestOn')) break;
                    cache[entry.id] = eloThreshold;
                    writeCache(cache);
                    entry.badges.forEach((badge) => renderBadge(badge, eloThreshold));
                } catch (err) {
                    LB.warn(`无法读取比赛 ${entry.id}：`, err);
                }
            }
        } finally {
            running = false;
            if (rerunRequested) {
                rerunRequested = false;
                if (Config.get('contestOn')) void run();
            }
        }
    }

    Config.on('contestOn', (on) => {
        if (on) void run();
        else restoreBadges();
    });

    observeAdded('section.lg-index-contest', debounce(() => void run(), 400));
    Spa.onNavigate(() => setTimeout(() => void run(), 500));
    setTimeout(() => void run(), 800);
});
