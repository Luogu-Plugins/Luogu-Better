Language: English | [简体中文](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/README/Chinese.md) | [繁體中文](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/README/Chinese-Traditional.md)

<h1 align="center">Luogu Better!</h1>
<p align="center">Enhancement user script for Luogu</p>

<p align="center">
  <a href="https://github.com/Luogu-Plugins/Luogu-Better/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Luogu-Plugins/Luogu-Better" alt="GitHub license" />
  </a>
  <a href="https://github.com/Luogu-Plugins/Luogu-Better">
    <img src="https://img.shields.io/github/languages/code-size/Luogu-Plugins/Luogu-Better" alt="GitHub code size" />
  </a>
  <a href="https://github.com/Luogu-Plugins/Luogu-Better/issues">
    <img src="https://img.shields.io/github/issues/Luogu-Plugins/Luogu-Better" alt="GitHub issues" />
  </a>
  <a href="https://github.com/Luogu-Plugins/Luogu-Better/pulls">
    <img src="https://img.shields.io/github/issues-pr/Luogu-Plugins/Luogu-Better" alt="GitHub pull requests" />
  </a>
  <a href="https://github.com/Luogu-Plugins/Luogu-Better/releases/latest">
    <img src="https://img.shields.io/github/v/release/Luogu-Plugins/Luogu-Better" alt="GitHub release" />
  </a>
  <a href="https://github.com/Luogu-Plugins/Luogu-Better/stargazers">
    <img src="https://img.shields.io/github/stars/Luogu-Plugins/Luogu-Better" alt="GitHub stars" />
  </a>
  <a href="https://github.com/Luogu-Plugins/Luogu-Better/forks">
    <img src="https://img.shields.io/github/forks/Luogu-Plugins/Luogu-Better" alt="GitHub forks" />
  </a>
</p>

---

## Project Overview

Luogu Better! is an enhancement user script for [Luogu](https://www.luogu.com.cn). It merges five independent Luogu plugins into the same script and the same settings panel: everything from appearance, background, benben, image hosting and contests can be toggled separately in one centered dialog, and changes apply immediately — no page reload needed.

## Upstream Plugins

| Plugin | Panel switches | What it does |
| --- | --- | --- |
| [Luogu Display Better](https://github.com/Luogu-Plugins/Luogu-Display-Better) | Card blur / Card radius / Image radius / Ad blocker | Card frosted glass, card opacity, rounded corners, image radius, ad hiding, custom CSS, theme fullscreen background, scrollbar and IDE layout |
| [Custom-Luogu-Background](https://github.com/Luogu-Plugins/Custom-Luogu-Background) | Fullscreen background → Custom background | Fullscreen background image / video, filters, page transparency |
| [benben-better](https://github.com/Luogu-Plugins/benben-better) | Benben optimization | Replying to 犇犇 no longer loses LaTeX and Markdown |
| [Luogu-ImageHosting-Optimization](https://github.com/Luogu-Plugins/Luogu-ImageHosting-Optimization) | Image hosting optimization | <kbd>Ctrl</kbd> + <kbd>V</kbd> on the image hosting page uploads clipboard images directly |
| [lg-contest-better](https://github.com/Luogu-Plugins/lg-contest-better) | Contest optimization | Shows rating thresholds / 咕值 in the recent contest list on the home page |

## Highlights

- **Unified settings panel**: all switches of the five plugins live in one centered dialog; toggling is all it takes.
- **Card blur**: frosted-glass blur for cards, overlays, pop-ups and comments, with adjustable strength.
- **Card opacity**: adjust card background transparency for a lighter, more transparent or cleaner look.
- **Card radius / Image radius**: customize the corner radius of cards, article areas and panels, and apply rounded corner styles to images.
- **Fullscreen background**: extend the theme background image to the whole page, or replace it with your own background.
- **Custom background**: upload or crop background images / videos, drag the filter sliders, and make page elements transparent so the background shows through. The top bar and both sidebars are **fully transparent** by default; raise the “Top bar / Sidebar opacity” slider in the main settings panel for a frosted strip. Card opacity and card blur take effect as soon as the page loads — no need to switch theme settings back and forth.
- **Ad blocker**: hide ad cards on some Luogu pages to reduce visual noise.
- **Benben optimization**: replying to 犇犇 no longer loses LaTeX and Markdown.
- **Image hosting optimization**: press <kbd>Ctrl</kbd> + <kbd>V</kbd> on the image hosting page to upload clipboard images.
- **Contest optimization**: shows rating thresholds and 咕值 in the home page contest list; the switch takes effect immediately, no page reload needed.
- **Custom CSS**: type your own styles and inject them into the page in real time to quickly build a personalized interface.
- **Update channel**: switch between “Stable” (default) and “Latest”, then check for updates with one click.
- **Media in IndexedDB**: background images / videos are stored as Blobs in IndexedDB, so they don't take up the 5~10MB userscript storage quota.

## Settings Panel

The panel is centered and dimmed, with a red round button at the top-right corner to close it (<kbd>Esc</kbd> works too). It contains five sliders (card blur, card opacity, card radius, image radius, top bar / sidebar opacity), eight checkboxes, a custom CSS textarea, an update channel dropdown, and the “Check for updates” and “Reset settings” buttons.

The eight checkboxes are ordered as: Card blur, Card radius, Image radius, Fullscreen background, Ad blocker, Benben optimization, Image hosting optimization, Contest optimization.

Controls on the “Fullscreen background” row appear one by one as you go:

- Tick **Fullscreen background** and a dropdown appears (`Use theme settings` / `Custom background`).
- Choose **Custom background** and a **Configure** button appears on the right; it opens a separate background settings window (upload / crop images or videos, drag the filter sliders).
- Choose **Use theme settings** and a hint below tells you to enable the mid-layer image in [Theme](https://www.luogu.com.cn/theme) first.
- Unchecking **Card blur / Card radius / Image radius** disables the matching slider and stops injecting that part of the styles.

## Installation

1. Install a browser extension that supports user scripts, such as Tampermonkey, Violentmonkey or Greasemonkey.
2. Import [`LuoguBetter.user.js`](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/LuoguBetter.user.js) into the userscript manager, or install it from the [latest release](https://github.com/Luogu-Plugins/Luogu-Better/releases/latest/download/LuoguBetter.user.js).
3. Open or refresh [Luogu](https://www.luogu.com.cn); the script runs automatically.

## Usage

- On first run, the script initializes default settings automatically.
- After the page loads, a **Luogu Better!** button appears in the top-right navigation bar (just left of the top-right nav items). Click it to open the settings panel.
- You can also click `打开设置面板` in the userscript menu, press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>L</kbd>, or run `LuoguBetter.openPanel()` in the console.
- Move sliders and toggle switches in the panel to preview changes in real time; settings apply immediately.
- Custom CSS entered in the panel is injected into the page in real time.
- Press <kbd>Esc</kbd> or click the red button in the top-right corner to close the settings panel.

## Update Channels

The “Update channel” dropdown in the panel decides which version is checked (default: `Stable`):

| Channel | Which release is picked | Matching tag |
| --- | --- | --- |
| `Stable` | latest **non-prerelease** version | `vX.Y.0` |
| `Latest` | newest one, **prereleases included** | `vX.Y.Z` (patch ≠ 0) |

## Development

The source is split by module under `src/`, and the build script `tools/build.mjs` concatenates it.

```bash
npm run build     # build once -> LuoguBetter.user.js (repository root)
npm run watch     # rebuild automatically while watching src/
npm run check     # build + syntax check (this is what CI runs)
```

```
src/
├─ meta.txt                 # userscript metadata header
├─ core/
│  ├─ namespace.js          # LB namespace and constants
│  ├─ utils.js              # $ / el / debounce / waitFor / toast ...
│  ├─ storage.js            # GM storage wrapper + IndexedDB media store
│  ├─ config.js             # defaults, read/write, subscriptions
│  ├─ spa.js                # route watching, element keep-alive, node observers
│  ├─ ui.js                 # overlay window and slider/checkbox/select widgets
│  └─ panel.js              # main settings panel
├─ modules/                 # appearance / adblock / background / background-panel
│                           # benben / imagehosting / contest / updater
└─ main.js                  # bootstrap
tools/build.mjs             # build script (concatenates src/ -> LuoguBetter.user.js)
tools/strip-comments.mjs    # comment stripper used at build time
```

## Contributing & Feedback

- Issues and pull requests are welcome — feel free to report compatibility problems, feature suggestions or new ideas for merging plugins.
- The five merged upstream plugins are all MIT licensed, and this project is released under MIT as well; copyright of the original authors belongs to their own repositories.

## Credits

<p align="center">
  <a href="https://github.com/a-small-OIer"><img src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/284595479%3Fs%3D60%26v%3D4&mask=circle&w=60&h=60" alt="avatar" width="60" height="60" /></a>
  <a href="https://github.com/zsTree0830"><img src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/308963692%3Fs%3D60%26v%3D4&mask=circle&w=60&h=60" alt="avatar" width="60" height="60" /></a>
  <a href="https://github.com/px-poxiao"><img src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/159022544%3Fs%3D60%26v%3D4&mask=circle&w=60&h=60" alt="avatar" width="60" height="60" /></a>
  <a href="https://github.com/UTF-8s"><img src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/109419692%3Fs%3D60%26v%3D4&mask=circle&w=60&h=60" alt="avatar" width="60" height="60" /></a>
</p>

## License

This project is licensed under the MIT License. See [LICENSE](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/LICENSE) for details.
