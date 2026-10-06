LB.define('updater', () => {
    const API = `https://api.github.com/repos/${LB.REPO_OWNER}/${LB.REPO_NAME}`;

    async function fetchRelease(channel) {
        const res = await request(`${API}/releases?per_page=20`, {
            headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) throw new Error(`GitHub 返回 HTTP ${res.status}`);

        const list = JSON.parse(res.text);
        if (!Array.isArray(list) || list.length === 0) throw new Error('仓库还没有发布任何版本');

        const usable = list.filter((item) => !item.draft);
        const release =
            channel === 'stable' ? usable.find((item) => !item.prerelease) : usable[0];

        if (!release) {
            throw new Error("暂时没有可用版本");
        }
        return release;
    }

    function pickAsset(release) {
        const assets = release.assets || [];
        const hit =
            assets.find((a) => /LuoguBetter\.user\.js$/i.test(a.name)) ||
            assets.find((a) => /\.user\.js$/i.test(a.name));
        return hit?.browser_download_url || release.html_url;
    }

    const lastCheckKey = 'luogu-better.last-update-check';

    /**
      * @param {{manual?: boolean, autoInstall?: boolean}} opts
      */
    async function checkUpdate({ manual = false, autoInstall = false } = {}) {
        const channel = Config.get('updateChannel');
        const label = channel === 'stable' ? '稳定版' : '最新版';

        try {
            const release = await fetchRelease(channel);
            const remote = String(release.tag_name || release.name || '').trim();
            if (!remote) throw new Error('无法解析版本号');

            Store.set(lastCheckKey, { at: Date.now(), channel, remote });

            if (compareVersion(remote, LB.VERSION) > 0) {
                const url = pickAsset(release);
                if (autoInstall) {
                    toast(`发现新版本 ${remote}，正在打开安装页面…`, 'ok');
                    window.open(url, '_blank', 'noopener');
                    return { ok: true, updated: true, remote, url };
                }
                const confirmed = window.confirm(
                    `发现新版本！\n\n当前版本：v${LB.VERSION}\n${label}：${remote}\n\n是否前往安装？`
                );
                if (confirmed) window.open(url, '_blank', 'noopener');
                return { ok: true, updated: true, remote, url };
            }

            if (manual) toast(`已是最新版本（v${LB.VERSION}，${label}）`, 'ok');
            return { ok: true, updated: false, remote };
        } catch (err) {
            const message = err?.message || String(err);
            LB.warn('检查更新失败：', err);
            if (manual) {
                toast(`检查更新失败：${message}`, 'error', 4200);
            }
            return { ok: false, error: message };
        }
    }

    LB.checkUpdate = checkUpdate;

    const last = Store.get(lastCheckKey, null);
    if (!last || Date.now() - (last.at || 0) > 24 * 3600 * 1000) {
        setTimeout(() => void checkUpdate({ manual: false }), 3000);
    }
});
