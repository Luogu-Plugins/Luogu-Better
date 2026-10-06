LB.define('benben', () => {
    const REPLY_TEXT_MATCH = /回复|reply/i;

    function extractReplacements(container) {
        const list = [];
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
            acceptNode(node) {
                if (node.classList && node.classList.contains('katex')) return NodeFilter.FILTER_ACCEPT;
                if (node.tagName === 'SCRIPT' && node.type && /^math\/tex/.test(node.type)) return NodeFilter.FILTER_ACCEPT;
                if (['STRONG', 'B', 'EM', 'I', 'DEL', 'S', 'CODE', 'A', 'IMG'].includes(node.tagName)) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            },
        });

        while (walker.nextNode()) {
            const node = walker.currentNode;
            const tag = node.tagName.toLowerCase();
            try {
                if (tag === 'img') {
                    const alt = (node.getAttribute('alt') || '').trim();
                    const src = node.getAttribute('src') || '';
                    if (src) {
                        const replacement = `![${alt}](${src})`;
                        list.push(alt ? { text: alt, replacement } : { text: '', replacement, type: 'img' });
                    }
                    continue;
                }
                if (tag === 'a') {
                    const text = node.textContent.trim();
                    const href = node.getAttribute('href') || '';
                    if (text && href) list.push({ text, replacement: `[${text}](${href})` });
                    continue;
                }
                if (node.classList && node.classList.contains('katex')) {
                    const ann = node.querySelector('annotation[encoding="application/x-tex"]');
                    const raw = ann ? ann.textContent.trim() : null;
                    const rendered = node.textContent.trim();
                    if (raw && rendered) list.push({ text: rendered, replacement: `$${raw}$` });
                    continue;
                }
                if (tag === 'script' && /^math\/tex/.test(node.type)) {
                    const raw = node.textContent.trim();
                    if (raw) {
                        const replacement = node.type.includes('display') ? `$$\n${raw}\n$$` : `$${raw}$`;
                        list.push({ text: raw, replacement });
                    }
                    continue;
                }
                const rendered = node.textContent.trim();
                if (!rendered) continue;
                const cmap = {
                    strong: `**${rendered}**`,
                    b: `**${rendered}**`,
                    em: `*${rendered}*`,
                    i: `*${rendered}*`,
                    del: `~~${rendered}~~`,
                    s: `~~${rendered}~~`,
                    code: `\`${rendered}\``,
                };
                if (cmap[tag]) list.push({ text: rendered, replacement: cmap[tag] });
            } catch (_) {}
        }
        return list;
    }

    function applyReplacements(text, list) {
        const normal = list.filter((item) => item.text && item.type !== 'img');
        const imageless = list.filter((item) => item.type === 'img' || !item.text);
        const sorted = normal.sort((a, b) => b.text.length - a.text.length);
        let result = text;
        for (const { text: search, replacement } of sorted) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(escaped, 'g'), replacement);
        }
        for (const item of imageless) {
            if (item.replacement && !result.includes(item.replacement)) result += '\n' + item.replacement;
        }
        return result;
    }

    function findContent(commentItem) {
        for (const sel of ['.am-comment-bd', '.markdown-body', '.feed-content', '.comment-content', '[class*="content"]']) {
            const node = commentItem.querySelector(sel);
            if (node) return node;
        }
        return commentItem;
    }

    function fillSource(replacements) {
        const textarea = document.querySelector('.am-form-group.am-form textarea, textarea');
        if (!textarea) {
            setTimeout(() => fillSource(replacements), 100);
            return;
        }
        const oldVal = textarea.value;
        const newVal = applyReplacements(oldVal, replacements);
        if (newVal !== oldVal) {
            textarea.value = newVal;
            textarea.focus();
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    document.addEventListener('click', (event) => {
        if (!Config.get('benbenOn')) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (!REPLY_TEXT_MATCH.test((target.innerText || '').trim())) return;

        const commentItem = target.closest(
            '.feed-item, .am-comment, li[class*="comment"], .comment-item, [class*="feed-item"]'
        );
        if (!commentItem) return;

        const replacements = extractReplacements(findContent(commentItem));
        if (replacements.length === 0) return;

        setTimeout(() => fillSource(replacements), 200);
    });
});
