function panelSurface() {
    return {
        background: 'rgba(255, 255, 255, 0.98)',
        backdrop: 'blur(0px)',
    };
}

function injectBaseStyle() {
    return styleSheet(
        `${LB.P}-base-style`,
        `.${LB.P}-overlay {
              position: fixed;
              inset: 0;
              z-index: 2147483000;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: rgba(0, 0, 0, .38);
              animation: ${LB.P}-fade .16s ease-out;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
                  "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
              font-size: 14px;
              line-height: 1.4;
              color: #1e1e2f;
              text-align: left;
              box-sizing: border-box;
          }
          .${LB.P}-overlay, .${LB.P}-overlay * { box-sizing: border-box; }
          @keyframes ${LB.P}-fade { from { opacity: 0 } to { opacity: 1 } }
          
          .${LB.P}-window {
              position: relative;
              padding: 28px 24px 24px;
              background: rgba(255, 255, 255, .98);
              backdrop-filter: blur(0px);
              -webkit-backdrop-filter: blur(0px);
              border-radius: 24px;
              box-shadow: 0 12px 40px rgba(0, 0, 0, .15);
              color: #1e1e2f;
              display: flex;
              flex-direction: column;
              width: min(520px, 94vw);
              max-width: calc(100vw - 70px);
              max-height: calc(100vh - 40px);
              animation: ${LB.P}-pop .18s cubic-bezier(.2, .8, .3, 1);
          }
          @keyframes ${LB.P}-pop { from { transform: scale(.96); opacity: .6 } to { transform: none; opacity: 1 } }
          @keyframes ${LB.P}-fade-out { from { opacity: 1 } to { opacity: 0 } }
          @keyframes ${LB.P}-pop-out { from { transform: none; opacity: 1 } to { transform: scale(.96); opacity: 0 } }
          .${LB.P}-overlay.${LB.P}-closing {
              animation: ${LB.P}-fade-out .16s ease-in both;
              pointer-events: none;
          }
          .${LB.P}-overlay.${LB.P}-closing .${LB.P}-window { animation: ${LB.P}-pop-out .16s ease-in both; }
          
          .${LB.P}-window__head { flex: 0 0 auto; }
          .${LB.P}-window__title {
              margin: 0 0 16px 0;
              font-size: 22px;
              font-weight: 600;
              color: #2c3e50;
              line-height: 1.3;
          }
          .${LB.P}-window__body {
              flex: 1 1 auto;
              min-height: 0;
              overflow-y: auto;
          }
          .${LB.P}-window__foot {
              flex: 0 0 auto;
              display: flex;
              align-items: center;
              gap: 10px;
              margin: 6px 0 12px;
          }
          
          .${LB.P}-close {
              position: absolute;
              top: 12px;
              right: 12px;
              width: 32px;
              height: 32px;
              padding: 0;
              margin: 0;
              border: none;
              border-radius: 50%;
              background: #ff4d4f;
              box-shadow: 0 2px 8px rgba(0, 0, 0, .12);
              color: #fff;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 22px;
              font-weight: 400;
              line-height: 1;
              text-align: center;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              cursor: pointer;
              transition: background .2s, transform .2s;
          }
          .${LB.P}-close:hover { background: #e04345; transform: scale(1.06); }
          .${LB.P}-close:active { transform: scale(.92); }
          
          .${LB.P}-row {
              display: flex;
              align-items: center;
              gap: 10px;
              margin: 6px 0 12px;
              font-size: 14px;
              line-height: 1.4;
          }
          .${LB.P}-row__label {
              flex: 0 0 auto;
              min-width: 5.5em;
              font-size: 15px;
              font-weight: 500;
              color: #34495e;
              line-height: 1.3;
              white-space: nowrap;
          }
          .${LB.P}-panel-body .${LB.P}-row__label { width: 6.5em; }
          .${LB.P}-panel-body .${LB.P}-row--wide-label .${LB.P}-row__label { width: 9em; }
          .${LB.P}-slider {
              flex: 1;
              -webkit-appearance: none;
              appearance: none;
              accent-color: #000;
              height: 4px;
              border-radius: 2px;
              background: #dce3e8;
              cursor: pointer;
              margin: 0;
              padding: 0;
          }
          .${LB.P}-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #000;
              box-shadow: 0 1px 4px rgba(0, 0, 0, .2);
              cursor: pointer;
          }
          .${LB.P}-slider::-moz-range-track { height: 4px; border-radius: 2px; background: #dce3e8; }
          .${LB.P}-slider::-moz-range-thumb {
              width: 16px; height: 16px; border: none; border-radius: 50%;
              background: #000; box-shadow: 0 1px 4px rgba(0, 0, 0, .2); cursor: pointer;
          }
          .${LB.P}-slider:disabled { opacity: .4; cursor: not-allowed; }
          .${LB.P}-row__value {
              flex: 0 0 auto;
              display: inline-block;
              width: 45px;
              text-align: center;
              font-weight: 500;
              line-height: 1;
          }
          
          .${LB.P}-checks { display: block; }
          .${LB.P}-check {
              display: flex;
              align-items: center;
              gap: 10px;
              margin: 6px 0 12px;
              font-size: 14px;
              line-height: 1.4;
              cursor: pointer;
              user-select: none;
          }
          .${LB.P}-check input[type="checkbox"] {
              flex: 0 0 auto;
              width: 18px;
              height: 18px;
              margin: 0;
              padding: 0;
              accent-color: #000;
              cursor: pointer;
              vertical-align: middle;
          }
          .${LB.P}-check__text { display: inline-block; cursor: pointer; }
          .${LB.P}-check__text a { color: #0d3d41; text-decoration: none; }
          .${LB.P}-check__text a:hover { text-decoration: underline; }
          .${LB.P}-check > .${LB.P}-select,
          .${LB.P}-check > .${LB.P}-btn { flex: 0 0 auto; }
          
          .${LB.P}-select {
              height: 32px;
              padding: 0 10px;
              font-size: 14px;
              font-family: inherit;
              color: #1e1e2f;
              background: rgba(255, 255, 255, .9);
              border: 1px solid #ccc;
              border-radius: 8px;
              cursor: pointer;
              outline: none;
              transition: border-color .2s, box-shadow .2s;
              max-width: 100%;
          }
          .${LB.P}-select:hover { border-color: #999; }
          .${LB.P}-select:focus { border-color: #000; box-shadow: 0 0 0 2px rgba(0, 0, 0, .08); }
          .${LB.P}-select:disabled { opacity: .45; cursor: not-allowed; }
          .${LB.P}-select--block { width: 100%; }
          
          .${LB.P}-btn {
              display: inline-block;
              margin: 0;
              padding: 8px 24px;
              border: none;
              border-radius: 30px;
              font-size: 14px;
              font-family: inherit;
              font-weight: 500;
              line-height: 1.4;
              cursor: pointer;
              transition: background .2s, transform .1s;
          }
          .${LB.P}-btn:active { transform: scale(.96); }
          .${LB.P}-btn:disabled { opacity: .55; cursor: not-allowed; }
          .${LB.P}-btn--primary {
              background: #000;
              color: #fff;
              box-shadow: 0 1px 4px rgba(0, 0, 0, .15);
          }
          .${LB.P}-btn--primary:hover:not(:disabled) { background: #333; }
          .${LB.P}-btn--ghost {
              background: #ecf0f1;
              color: #2c3e50;
              box-shadow: 0 1px 4px rgba(0, 0, 0, .05);
          }
          .${LB.P}-btn--ghost:hover:not(:disabled) { background: #d5dbe0; }
          .${LB.P}-btn--sm { padding: 6px 14px; font-size: 13px; }
          
          .${LB.P}-panel-foot {
              display: flex;
              align-items: center;
              gap: 10px;
              margin: 22px 0 4px;
          }
          
          .${LB.P}-textarea, .${LB.P}-input {
              display: block;
              width: 100%;
              margin: 0;
              padding: 8px 10px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background: transparent;
              color: #1e1e2f;
              font-family: var(--lfe-code-font, Monospace);
              font-size: 13px;
              line-height: 1.5;
              outline: none;
              transition: border-color .2s, box-shadow .2s;
          }
          .${LB.P}-textarea {
              height: clamp(100px, calc(100vh - 700px), 160px);
              resize: none;
              overflow: auto;
              tab-size: 2;
              -moz-tab-size: 2;
              white-space: pre;
              -webkit-appearance: none;
          }
          .${LB.P}-textarea::placeholder { color: #9aa4ad; }
          .${LB.P}-textarea:focus, .${LB.P}-input:focus {
              border-color: #000;
              box-shadow: 0 0 0 2px rgba(0, 0, 0, .08);
          }
          
          .${LB.P}-group-title {
              margin: 18px 0 6px;
              font-size: 15px;
              font-weight: 500;
              color: #34495e;
              line-height: 1.3;
          }
          .${LB.P}-hint {
              display: block;
              margin: 4px 0 12px;
              font-size: 12px;
              line-height: 1.4;
              color: #8a8a8a;
          }`
    );
}

const ICON_CLOSE = '×';

/**
  * @param {object} opts
  * @param {string} opts.id
  * @param {string} opts.title
  * @param {Node|string} opts.body
  * @param {Array} [opts.actions]
  * @param {string} [opts.width]
  * @param {boolean} [opts.dim]
  * @param {() => void} [opts.onClose]
  */
function openWindow(opts) {
    injectBaseStyle();
    const { id, title, body, actions = [], width, dim = true, onClose } = opts;
    const windowId = id || `${LB.P}-window-${Date.now()}`;
    document.getElementById(windowId)?.remove();

    const content = typeof body === 'string' ? el('div', { html: body }) : body;

    const surface = panelSurface();
    const windowEl = el(
        'div',
        {
            class: `${LB.P}-window`,
            style: {
                width,
                background: surface.background,
                backdropFilter: surface.backdrop,
                WebkitBackdropFilter: surface.backdrop,
            },
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': title,
        },
        el('button', {
            class: `${LB.P}-close`,
            type: 'button',
            title: '关闭 (Esc)',
            text: ICON_CLOSE,
            onclick: () => close(),
        }),
        el('div', { class: `${LB.P}-window__head` }, el('div', { class: `${LB.P}-window__title`, text: title })),
        el('div', { class: `${LB.P}-window__body` }, content),
        actions.length
            ? el(
                    'div',
                    { class: `${LB.P}-window__foot` },
                    actions.map((a) =>
                        el('button', {
                            class: `${LB.P}-btn ${a.variant === 'ghost' ? `${LB.P}-btn--ghost` : `${LB.P}-btn--primary`}`,
                            type: 'button',
                            text: a.label,
                            onclick: (event) => a.onClick?.(event, close),
                        })
                    )
                )
            : null
    );

    const overlay = el(
        'div',
        {
            id: windowId,
            class: `${LB.P}-overlay`,
            style: dim ? null : { background: 'transparent' },
        },
        windowEl
    );

    let closed = false;
    function close({ force = false } = {}) {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKey, true);
        const done = () => {
            overlay.remove();
            onClose?.();
        };
        if (force || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            done();
            return;
        }
        overlay.classList.add(`${LB.P}-closing`);
        let finished = false;
        const once = () => {
            if (finished) return;
            finished = true;
            done();
        };
        overlay.addEventListener('animationend', once, { once: true });
        setTimeout(once, 260);
    }
    function onKey(event) {
        if (event.key === 'Escape') {
            event.stopPropagation();
            close();
        }
    }

    overlay.addEventListener('mousedown', (event) => {
        if (event.target === overlay) close();
    });
    document.addEventListener('keydown', onKey, true);
    document.body.append(overlay);

    return { overlay, window: windowEl, close };
}

function checkbox(labelText, checked, onChange) {
    const input = el('input', { type: 'checkbox', checked: !!checked });
    input.addEventListener('change', () => onChange?.(input.checked));
    const text = el('span', { class: `${LB.P}-check__text` });
    append(text, [labelText]);
    return el('label', { class: `${LB.P}-check` }, input, text);
}

function select(options, value, onChange, { block = false } = {}) {
    const node = el(
        'select',
        { class: `${LB.P}-select${block ? ` ${LB.P}-select--block` : ''}` },
        options.map((o) => el('option', { value: o.value, text: o.label, selected: o.value === value }))
    );
    node.value = value;
    node.addEventListener('change', () => onChange?.(node.value));
    return node;
}

function sliderRow({ label, min, max, step = 1, value, unit = '', onInput }) {
    const readout = el('span', { class: `${LB.P}-row__value`, text: `${value}${unit}` });
    const input = el('input', {
        class: `${LB.P}-slider`,
        type: 'range',
        min: String(min),
        max: String(max),
        step: String(step),
        value: String(value),
    });
    input.addEventListener('input', () => {
        readout.textContent = `${input.value}${unit}`;
        onInput?.(Number(input.value));
    });
    const row = el(
        'div',
        { class: `${LB.P}-row` },
        el('span', { class: `${LB.P}-row__label`, text: label }),
        input,
        readout
    );
    row.input = input;
    row.setValue = (v) => {
        input.value = String(v);
        readout.textContent = `${v}${unit}`;
    };
    return row;
}
