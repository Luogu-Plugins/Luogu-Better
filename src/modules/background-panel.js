LB.define('background-panel', () => {
    const PANEL_ID = `${LB.P}-bg-config`;
    const GRID_STYLE_ID = `${LB.P}-bg-panel-style`;

    let thumbUrls = [];
    let panelHandle = null;

    function releaseThumbs() {
        thumbUrls.forEach((url) => {
            try {
                URL.revokeObjectURL(url);
            } catch (_) {}
        });
        thumbUrls = [];
    }

    function injectGridStyle() {
        styleSheet(
            GRID_STYLE_ID,
            `.${LB.P}-bg-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
              .${LB.P}-bg-item {
                  position: relative; width: 58px; height: 58px; border-radius: 6px;
                  overflow: hidden; border: 1px solid #ddd; cursor: pointer; background: #f4f4f4;
              }
              .${LB.P}-bg-item.is-current { outline: 2px solid #5e6ad2; outline-offset: 1px; }
              .${LB.P}-bg-item img, .${LB.P}-bg-item video { width: 100%; height: 100%; object-fit: cover; display: block; }
              .${LB.P}-bg-item__video {
                  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 22px;
              }
              .${LB.P}-bg-item__del, .${LB.P}-bg-item__loop {
                  position: absolute; border: none; color: #fff; cursor: pointer; padding: 0;
                  display: flex; align-items: center; justify-content: center; line-height: 1;
              }
              .${LB.P}-bg-item__del { top: 0; right: 0; width: 18px; height: 18px; background: rgba(231,76,60,.85); font-size: 13px; border-bottom-left-radius: 6px; }
              .${LB.P}-bg-item__loop { bottom: 0; left: 0; width: 18px; height: 18px; background: rgba(0,0,0,.55); font-size: 10px; border-top-right-radius: 6px; }
              .${LB.P}-bg-toolbar { display: flex; gap: 6px; align-items: center; }
              .${LB.P}-bg-toolbar .${LB.P}-btn { flex: 0 0 auto; white-space: nowrap; }
              .${LB.P}-bg-toolbar .${LB.P}-input { min-width: 0; flex: 1 1 auto; }
              .${LB.P}-bg-empty { font-size: 12px; color: #999; padding: 6px 0; }
              .${LB.P}-bg-section {
                  display: flex; align-items: center; justify-content: space-between;
                  font-size: 13px; color: #555; margin: 16px 0 2px;
                  padding-top: 12px; border-top: 1px solid #eee;
              }
              .${LB.P}-bg-section:first-of-type { border-top: none; margin-top: 4px; padding-top: 0; }
              .${LB.P}-bg-switch-row {
                  display: flex; align-items: center; justify-content: flex-start; gap: 10px;
                  margin: 6px 0 12px; font-size: 14px;
              }
              .${LB.P}-bg-switch-row .${LB.P}-check { margin: 0; padding: 0; }`
        );
    }

    function cropThenStore(blob) {
        const CropperCtor = typeof Cropper !== 'undefined' ? Cropper : window.Cropper;
        if (typeof CropperCtor !== 'function') {
            LB.warn('Cropper.js 未加载，已按原图保存');
            toast('裁剪器未加载，已按原图保存', 'info');
            return Promise.resolve(blob);
        }

        return toBlobUrl(blob).then(
            (dataUrl) =>
                new Promise((resolve) => {
                    const image = el('img', { style: { maxWidth: '100%', display: 'block' } });
                    const loading = el('div', { class: `${LB.P}-bg-empty`, text: '正在载入图片…' });
                    const confirmBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--primary`, type: 'button', text: '确认裁剪' });
                    const cancelBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost`, type: 'button', text: '取消' });
                    const cropBody = el('div', { style: { maxWidth: '78vw', maxHeight: '58vh', overflow: 'hidden' } }, loading, image);

                    const handle = openWindow({
                        id: `${LB.P}-cropper`,
                        title: '裁剪背景图片',
                        width: 'min(860px, 92vw)',
                        body: el('div', null, cropBody, el('div', { class: `${LB.P}-window__foot`, style: { padding: '14px 0 0' } }, cancelBtn, confirmBtn)),
                        onClose: () => {
                            cropper?.destroy();
                            resolve(null);
                        },
                    });

                    let cropper = null;
                    let closeTimer = null;
                    const finish = (value) => {
                        clearTimeout(closeTimer);
                        cropper?.destroy();
                        cropper = null;
                        handle.close();
                        resolve(value);
                    };

                    cancelBtn.addEventListener('click', () => finish(null));
                    image.addEventListener('load', () => {
                        clearTimeout(closeTimer);
                        loading.remove();
                        const aspect = window.innerWidth / window.innerHeight;
                        try {
                            cropper = new CropperCtor(image, {
                                aspectRatio: aspect,
                                viewMode: 1,
                                dragMode: 'move',
                                autoCropArea: 0.8,
                                cropBoxMovable: true,
                                cropBoxResizable: true,
                                background: false,
                            });
                        } catch (err) {
                            LB.warn('裁剪器初始化失败，改用原图：', err);
                            finish(blob);
                        }
                    });
                    image.addEventListener('error', () => {
                        toast('图片无法预览，已按原图保存', 'error');
                        finish(blob);
                    });
                    confirmBtn.addEventListener('click', () => {
                        if (!cropper) {
                            toast('图片还没载入完成', 'error');
                            return;
                        }
                        const aspect = window.innerWidth / window.innerHeight;
                        const maxW = Math.min(2560, window.innerWidth * 2);
                        const canvas = cropper.getCroppedCanvas({
                            maxWidth: maxW,
                            maxHeight: Math.round(maxW / aspect),
                            fillColor: '#fff',
                            imageSmoothingQuality: 'high',
                        });
                        if (!canvas) return finish(blob);
                        canvas.toBlob((out) => finish(out || blob), 'image/jpeg', 0.85);
                    });

                    closeTimer = setTimeout(() => {
                        LB.warn('图片载入超时，已按原图保存');
                        finish(blob);
                    }, 20000);
                    image.src = dataUrl;
                })
        );
    }

    function backgroundApi() {
        const api = LB.Background;
        if (!api) {
            LB.error('背景模块未就绪，无法管理背景媒体');
            toast('背景模块未就绪，请刷新页面后重试', 'error');
        }
        return api || null;
    }

    function toBlobUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsDataURL(blob);
        });
    }

    async function cropImageBlob(blob) {
        const cropped = await cropThenStore(blob);
        if (!cropped) return false;
        await backgroundApi().addMedia({ type: 'image', mime: cropped.type || blob.type || 'image/jpeg', data: cropped });
        toast('图片已保存', 'ok');
        return true;
    }

    async function storeFiles(files, refresh) {
        const api = backgroundApi();
        if (!api) return;
        for (const file of Array.from(files)) {
            try {
                if (file.type.startsWith('video/')) {
                    await api.addMedia({ type: 'video', mime: file.type, data: file, loop: true });
                    toast('视频已添加', 'ok');
                } else {
                    await cropImageBlob(file);
                }
            } catch (err) {
                toast(err?.message || '添加失败', 'error');
            }
        }
        await refresh();
        api.refreshNow();
    }

    function gmFetchRemoteBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'blob',
                timeout: 30000,
                onload: (res) => {
                    const blob = res.response;
                    if (!(blob instanceof Blob) || !blob.size) reject(new Error(`HTTP ${res.status || '空响应'}`));
                    else if (res.status >= 400) reject(new Error(`HTTP ${res.status}`));
                    else resolve(blob);
                },
                onerror: () => reject(new Error('网络请求失败')),
                ontimeout: () => reject(new Error('网络请求超时')),
            });
        });
    }

    function directFetchRemoteBlob(url) {
        return fetch(url, { credentials: 'omit' }).then((res) => {
            if (!res.ok || res.type === 'opaque') throw new Error(`HTTP ${res.status || '跨域被拒'}`);
            return res.blob();
        });
    }

    function fetchRemoteBlob(url) {
        if (typeof GM_xmlhttpRequest !== 'function') return directFetchRemoteBlob(url);

        return gmFetchRemoteBlob(url).catch((err) => {
            LB.warn('GM 请求直链失败，改用 fetch 重试：', err?.message || err);
            return directFetchRemoteBlob(url).catch(() => {
                throw err;
            });
        });
    }

    async function addFromUrl(url, refresh) {
        if (!url) return;
        const api = backgroundApi();
        if (!api) return;
        try {
            const blob = await fetchRemoteBlob(url);
            if (!blob.size) throw new Error('返回内容为空');
            if (blob.type.startsWith('video/') || /\.(mp4|webm|ogv|mov)(\?|#|$)/i.test(url)) {
                await api.addMedia({ type: 'video', mime: blob.type || 'video/mp4', data: blob, loop: true });
                toast('视频已添加', 'ok');
            } else {
                await cropImageBlob(blob);
            }
        } catch (err) {
            LB.warn('无法加载该 URL：', err);
            toast(`无法加载该 URL（${err?.message || '未知错误'}）`, 'error');
        }
        await refresh();
        api.refreshNow();
    }

    function open() {
        const existing = document.getElementById(PANEL_ID);
        if (existing) {
            panelHandle?.close({ force: true });
            existing.remove();
            return;
        }
        injectBaseStyle();
        injectGridStyle();

        const body = el('div', { style: { minWidth: '320px' } });
        const mediaCount = el('span', { text: '' });
        const grid = el('div', { class: `${LB.P}-bg-grid` });

        body.append(el('div', { class: `${LB.P}-bg-section` }, el('span', { text: '媒体管理' }), mediaCount));

        const urlInput = el('input', {
            class: `${LB.P}-input`,
            type: 'text',
            inputmode: 'url',
            placeholder: '输入图片 / 视频直链',
            style: { flex: '1 1 auto', fontFamily: 'inherit', fontSize: '13px' },
        });
        const addUrlBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost ${LB.P}-btn--sm`, type: 'button', text: '添加' });
        const uploadBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost ${LB.P}-btn--sm`, type: 'button', text: '上传文件' });
        body.append(el('div', { class: `${LB.P}-bg-toolbar` }, urlInput, addUrlBtn, uploadBtn));
        body.append(grid);

        const fileInput = el('input', {
            type: 'file',
            accept: 'image/*,video/mp4',
            multiple: true,
            style: { position: 'fixed', left: '-9999px', top: '0', width: '1px', height: '1px', opacity: '0' },
        });
        body.append(fileInput);

        const openFilePicker = () => {
            const picker = body.querySelector('input[type="file"]');
            if (!picker) {
                toast('文件选择器未就绪，请重新打开背景设置', 'error');
                return;
            }
            let fellBack = false;
            const fallback = () => {
                if (fellBack) return;
                fellBack = true;
                try {
                    picker.click();
                } catch (err) {
                    LB.warn('打开文件选择器失败：', err);
                    toast('浏览器拒绝了文件选择，请改用直链', 'error');
                }
            };
            try {
                if (typeof picker.showPicker === 'function') {
                    picker.addEventListener('error', fallback, { once: true });
                    picker.showPicker();
                } else {
                    fallback();
                }
            } catch (err) {
                LB.warn('showPicker 不可用，改用 click：', err);
                fallback();
            }
        };

        addUrlBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (!url) {
                toast('请先填入图片或视频直链', 'error');
                urlInput.focus();
                return;
            }
            addUrlBtn.disabled = true;
            addFromUrl(url, renderGrid).finally(() => {
                addUrlBtn.disabled = false;
                urlInput.value = '';
            });
        });
        uploadBtn.addEventListener('click', openFilePicker);
        fileInput.addEventListener('change', () => {
            const files = Array.from(fileInput.files || []);
            fileInput.value = '';
            if (!files.length) return;
            uploadBtn.disabled = true;
            storeFiles(files, renderGrid).finally(() => {
                uploadBtn.disabled = false;
            });
        });

        body.append(el('div', { class: `${LB.P}-bg-section` }, el('span', { text: '背景滤镜' })));
        body.append(
            sliderRow({
                label: '模糊度', min: 0, max: 40, unit: 'px',
                value: Math.round(Config.getIn('bg.blur')),
                onInput: (v) => Config.set('bg.blur', v),
            }),
            sliderRow({
                label: '亮度', min: 30, max: 200, step: 5, unit: '%',
                value: Math.round(Config.getIn('bg.brightness')),
                onInput: (v) => Config.set('bg.brightness', v),
            }),
            sliderRow({
                label: '饱和度', min: 0, max: 200, step: 5, unit: '%',
                value: Math.round(Config.getIn('bg.saturate')),
                onInput: (v) => Config.set('bg.saturate', v),
            }),
            sliderRow({
                label: '遮罩浓度', min: 0, max: 100, unit: '%',
                value: Math.round(Config.getIn('bg.overlay')),
                onInput: (v) => Config.set('bg.overlay', v),
            })
        );

        body.append(el('div', { class: `${LB.P}-bg-section` }, el('span', { text: '其它' })));
        const switchRow = (label, key, hint) =>
            el(
                'div',
                { class: `${LB.P}-bg-switch-row` },
                el('span', { text: label, title: hint || '' }),
                checkbox('', Config.getIn(key), (checked) => {
                    Config.set(key, checked);
                    backgroundApi()?.refreshNow();
                })
            );

        body.append(
            switchRow('专栏全透', 'bg.articleTransparent'),
            switchRow('毛玻璃效果', 'bg.globalGlass'),
            switchRow('随机背景', 'bg.random')
        );

        const resetBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost`, type: 'button', text: '恢复默认' });
        const clearBtn = el('button', { class: `${LB.P}-btn ${LB.P}-btn--ghost`, type: 'button', text: '清空全部' });
        resetBtn.addEventListener('click', () => {
            Config.data.bg = structuredClone(DEFAULT_SETTINGS.bg);
            Config.saveNow();
            Config.notify([
                'bg.currentId', 'bg.random', 'bg.blur', 'bg.brightness', 'bg.saturate', 'bg.overlay',
                'bg.navOpacity', 'bg.articleTransparent', 'bg.globalGlass',
            ]);
            backgroundApi()?.refreshNow();
            handle.close({ force: true });
            open();
            toast('背景设置已恢复默认', 'ok');
        });
        clearBtn.addEventListener('click', async () => {
            if (!window.confirm('确定要删除全部背景媒体吗？此操作不可撤销。')) return;
            const api = backgroundApi();
            if (!api) return;
            await api.clearMedia();
            api.refreshNow();
            renderGrid();
            toast('已清空全部媒体', 'ok');
        });

        const handle = openWindow({
            id: PANEL_ID,
            title: '背景设置',
            body,
            actions: [],
            onClose: () => {
                panelHandle = null;
                releaseThumbs();
            },
        });
        panelHandle = handle;

        body.append(el('div', { class: `${LB.P}-window__foot`, style: { padding: '18px 0 0' } }, resetBtn, clearBtn));

        async function renderGrid() {
            releaseThumbs();
            const api = backgroundApi();
            if (!api) return;
            const items = await api.allMedia();
            mediaCount.textContent = `${items.length} / ${api.MAX_MEDIA}`;
            grid.innerHTML = '';

            if (!items.length) {
                grid.append(el('div', { class: `${LB.P}-bg-empty`, text: '还没有素材，上传一张图片试试。' }));
                return;
            }

            const currentId = Config.getIn('bg.currentId');
            for (const media of items) {
                const isCurrent = String(media.id) === String(currentId);
                const item = el('div', {
                    class: `${LB.P}-bg-item${isCurrent ? ' is-current' : ''}`,
                    title: media.type === 'video' ? '视频背景' : '图片背景',
                });

                if (media.type === 'video') {
                    item.append(el('div', { class: `${LB.P}-bg-item__video`, text: '🎥' }));
                } else {
                    const url = await api.imageUrl(media, { cache: false });
                    if (url.startsWith('blob:')) thumbUrls.push(url);
                    item.append(el('img', { src: url, alt: '' }));
                }

                const del = el('button', { class: `${LB.P}-bg-item__del`, type: 'button', text: '×', title: '删除' });
                del.addEventListener('click', async (event) => {
                    event.stopPropagation();
                    await api.deleteMedia(media.id);
                    api.refreshNow();
                    renderGrid();
                });
                item.append(del);

                if (media.type === 'video') {
                    const loop = el('button', {
                        class: `${LB.P}-bg-item__loop`,
                        type: 'button',
                        text: media.loop === false ? '▶' : '🔁',
                        title: '循环播放',
                    });
                    loop.addEventListener('click', async (event) => {
                        event.stopPropagation();
                        await api.updateMedia(media.id, { loop: media.loop === false });
                        if (String(Config.getIn('bg.currentId')) === String(media.id)) api.refreshNow();
                        renderGrid();
                    });
                    item.append(loop);
                }

                item.addEventListener('click', () => {
                    Config.set('bg.currentId', media.id);
                    Config.set('bg.random', false);
                    api.refreshNow();
                    renderGrid();
                    toast('已切换为该背景', 'ok');
                });

                grid.append(item);
            }
        }

        void renderGrid();
    }

    LB.openBackgroundPanel = open;
});
