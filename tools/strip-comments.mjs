const REGEX_AFTER_PUNCT = new Set([
    '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', ';', '+', '-', '*', '%', '<', '>', '^', '~',
]);

const REGEX_AFTER_WORD = new Set([
    'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
    'case', 'do', 'else', 'yield', 'await', 'throw',
]);

const PARAM_DOC = /^\/\*\*[\s\S]*?@param[\s\S]*?\*\/$/;

const isWordChar = (ch) => ch !== undefined && /[A-Za-z0-9_$]/.test(ch);

/**
 * @param {string} source
 * @param {{ onComment?: (text: string, kind: 'line' | 'block') => void }} [options]
 * @returns {string}
 */
export function stripComments(source, options = {}) {
    const { onComment } = options;
    const n = source.length;
    let out = '';
    let i = 0;

    const stack = [{ type: 'code', depth: 0, substitution: false }];

    let prevKind = 'none';
    let prevChar = '';
    let prevWord = '';
    let word = '';

    const put = (text) => {
        out += text;
    };
    const lineIsBlank = () => /(^|\n)[ \t]*$/.test(out);
    const dropLineIndent = () => {
        out = out.replace(/[ \t]*$/, '');
    };
    const markPunct = (ch) => {
        prevKind = 'punct';
        prevChar = ch;
        prevWord = '';
    };
    const markLiteral = () => {
        prevKind = 'literal';
        prevChar = '';
        prevWord = '';
    };

    const regexAllowed = () => {
        if (prevKind === 'none') return true;
        if (prevKind === 'punct') return REGEX_AFTER_PUNCT.has(prevChar);
        if (prevKind === 'word') return REGEX_AFTER_WORD.has(prevWord);
        return false;
    };

    while (i < n) {
        const ctx = stack[stack.length - 1];
        const c = source[i];

        if (ctx.type === 'template') {
            if (c === '\\') {
                put(source.slice(i, i + 2));
                i += 2;
                continue;
            }
            if (c === '`') {
                stack.pop();
                put(c);
                i += 1;
                markLiteral();
                continue;
            }
            if (c === '$' && source[i + 1] === '{') {
                put('${');
                i += 2;
                stack.push({ type: 'code', depth: 0, substitution: true });
                prevKind = 'none';
                prevChar = '';
                prevWord = '';
                word = '';
                continue;
            }
            put(c);
            i += 1;
            continue;
        }

        if (c === '/' && source[i + 1] === '/') {
            const start = i;
            while (i < n && source[i] !== '\n') i += 1;
            onComment?.(source.slice(start, i), 'line');
            if (lineIsBlank()) {
                dropLineIndent();
                if (source[i] === '\n') i += 1;
            }
            continue;
        }

        if (c === '/' && source[i + 1] === '*') {
            const wholeLine = lineIsBlank();
            const start = i;
            i += 2;
            while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
            i = Math.min(n, i + 2);
            const removed = source.slice(start, i);

            if (PARAM_DOC.test(removed)) {
                put(removed);
                continue;
            }

            onComment?.(removed, 'block');

            if (wholeLine) {
                let j = i;
                while (j < n && (source[j] === ' ' || source[j] === '\t')) j += 1;
                if (j >= n || source[j] === '\n') {
                    dropLineIndent();
                    i = j < n ? j + 1 : j;
                    continue;
                }
            }

            const newlines = (removed.match(/\n/g) || []).length;
            put(` ${'\n'.repeat(newlines)}`);
            continue;
        }

        if (c === '"' || c === "'") {
            const quote = c;
            put(c);
            i += 1;
            while (i < n) {
                if (source[i] === '\\') {
                    put(source.slice(i, i + 2));
                    i += 2;
                    continue;
                }
                put(source[i]);
                if (source[i] === quote) {
                    i += 1;
                    break;
                }
                i += 1;
            }
            markLiteral();
            continue;
        }

        if (c === '`') {
            stack.push({ type: 'template' });
            put(c);
            i += 1;
            continue;
        }

        if (c === '/') {
            if (regexAllowed()) {
                put(c);
                i += 1;
                let inClass = false;
                while (i < n) {
                    const ch = source[i];
                    if (ch === '\\') {
                        put(source.slice(i, i + 2));
                        i += 2;
                        continue;
                    }
                    if (ch === '[') inClass = true;
                    else if (ch === ']') inClass = false;
                    else if (ch === '/' && !inClass) {
                        put(ch);
                        i += 1;
                        break;
                    } else if (ch === '\n') {
                        break;
                    }
                    put(ch);
                    i += 1;
                }
                while (i < n && /[a-z]/i.test(source[i])) {
                    put(source[i]);
                    i += 1;
                }
                markLiteral();
                continue;
            }
            put(c);
            i += 1;
            markPunct('/');
            continue;
        }

        if (c === '{') {
            ctx.depth += 1;
            put(c);
            i += 1;
            markPunct('{');
            continue;
        }

        if (c === '}') {
            if (ctx.substitution && ctx.depth === 0) {
                stack.pop();
                put(c);
                i += 1;
                markPunct('}');
                continue;
            }
            ctx.depth -= 1;
            put(c);
            i += 1;
            markPunct('}');
            continue;
        }

        if (isWordChar(c)) {
            word += c;
            put(c);
            i += 1;
            if (!isWordChar(source[i])) {
                prevKind = 'word';
                prevWord = word;
                prevChar = '';
                word = '';
            }
            continue;
        }

        if (/\s/.test(c)) {
            put(c);
            i += 1;
            continue;
        }

        put(c);
        i += 1;
        markPunct(c);
    }

    return out;
}
