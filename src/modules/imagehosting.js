LB.define('imagehosting', () => {
    const isImagePage = () => /^\/image(\/|$)/.test(location.pathname);

    function findDropZone() {
        return (
            document.querySelector('.upload-layout .drop') ||
            document.querySelector('.upload-card .drop') ||
            document.querySelector('.drop') ||
            document.querySelector('.upload-trigger')
        );
    }

    function findFileInput() {
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const input of inputs) {
            const accept = input.getAttribute('accept') || '';
            if (!accept || /image/i.test(accept)) return input;
        }
        return inputs.length ? inputs[0] : null;
    }

    function sendToDropZone(file, zone) {
        if (typeof DataTransfer !== 'function' || typeof DragEvent !== 'function') return false;
        try {
            const dt = new DataTransfer();
            dt.items.add(file);
            zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
            return true;
        } catch (err) {
            console.debug('[Luogu Better!][图床] drop 方式失败：', err);
            return false;
        }
    }

    function sendToFileInput(file, input) {
        if (typeof DataTransfer !== 'function') return false;
        try {
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        } catch (err) {
            console.debug('[Luogu Better!][图床] file input 方式失败：', err);
            return false;
        }
    }

    function uploadFile(file) {
        const zone = findDropZone();
        if (zone && sendToDropZone(file, zone)) return true;
        const input = findFileInput();
        if (input && sendToFileInput(file, input)) return true;
        return false;
    }

    const isImageLike = (type) => !type || type.indexOf('image/') === 0;

    function pickImageFromClipboard(dt) {
        if (!dt) return null;
        const items = dt.items;
        if (items && items.length) {
            for (const item of items) {
                if (item.kind === 'file' && isImageLike(item.type)) {
                    const file = item.getAsFile();
                    if (file) return file;
                }
            }
        }
        const files = dt.files;
        if (files && files.length) {
            for (const file of files) {
                if (isImageLike(file.type)) return file;
            }
        }
        return null;
    }

    function describeClipboard(dt) {
        const out = [];
        try {
            if (dt.items) {
                for (const item of dt.items) out.push(`${item.kind}:${item.type || '(空类型)'}`);
            }
        } catch (_) {}
        return out.length ? out.join(', ') : '(剪贴板里没有可识别内容)';
    }

    function onPaste(event) {
        if (!Config.get('imageHostingOn')) return;
        if (!isImagePage()) return;

        const dt = event.clipboardData || window.clipboardData;
        if (!dt) return;

        const file = pickImageFromClipboard(dt);
        if (!file) {
            console.debug(`[Luogu Better!][图床] 剪贴板里没找到图片，已放行。内容：${describeClipboard(dt)}`);
            return;
        }

        const target = event.target;
        const inField =
            target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (inField) {
            let hasText = false;
            try {
                hasText = !!(dt.getData && dt.getData('text/plain'));
            } catch (_) {}
            if (hasText) return;
        }

        event.preventDefault();
        event.stopPropagation();

        const name = file.name || `clipboard-${Date.now()}.png`;
        const kb = Math.max(1, Math.round(file.size / 1024));
        if (uploadFile(file)) {
            console.log(`[Luogu Better!][图床] 已把图片移交上传流程：${name}（${kb} KB, ${file.type || '无类型'}）`);
            toast(`已捕获剪贴板图片（${name}，${kb} KB），正在上传…`, 'ok');
        } else {
            console.warn('[Luogu Better!][图床] 没找到上传区域', diagnose());
            toast('没找到图床的上传区域，请确认已登录且停留在图床页面', 'error');
        }
    }

    function diagnose() {
        const zone = findDropZone();
        const input = findFileInput();
        return {
            url: location.href,
            在图片页: isImagePage(),
            上传区域: zone ? `${zone.tagName}.${zone.className || ''}` : null,
            文件输入框: input ? `${input.tagName}${input.accept ? `[accept=${input.accept}]` : ''}` : null,
        };
    }

    document.addEventListener('paste', onPaste, true);

    try {
        const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        win.__luoguBetterPaste = { uploadFile, findDropZone, findFileInput, pickImageFromClipboard, check: diagnose };
    } catch (_) {}

    if (isImagePage()) {
        let tries = 0;
        (function poll() {
            if (findDropZone()) {
                console.log('[Luogu Better!][图床] 已就绪，找到上传区域', diagnose());
                return;
            }
            if (tries++ > 20) {
                console.log('[Luogu Better!][图床] 已就绪，但没找到上传区域', diagnose());
                return;
            }
            setTimeout(poll, 300);
        })();
    }
});
