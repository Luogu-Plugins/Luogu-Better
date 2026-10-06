Language: [English](https://github.com/Luogu-Plugins/Luogu-Better#readme) | 简体中文 | [繁體中文](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/README/Chinese-Traditional.md)

<h1 align="center">Luogu Better!</h1>
<p align="center">洛谷增强脚本</p>

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

## 项目简介

Luogu Better! 是一款面向 [洛谷](https://www.luogu.com.cn) 的增强用户脚本。它把五个各自独立的洛谷插件合并进同一个脚本、同一套设置面板：外观、背景、犇犇、图床与比赛的全部功能都能在一个居中弹窗里单独开关，改动实时生效、无需刷新页面。

## 上游插件

| 插件名称 | 面板开关 | 作用 |
| --- | --- | --- |
| [Luogu Display Better](https://github.com/Luogu-Plugins/Luogu-Display-Better) | 卡片模糊 / 卡片圆角 / 图片圆角 / 关闭广告 | 卡片毛玻璃、卡片不透明度、圆角、图片圆角、广告隐藏、自定义 CSS、主题全屏背景、滚动条与 IDE 布局 |
| [Custom-Luogu-Background](https://github.com/Luogu-Plugins/Custom-Luogu-Background) | 背景全屏 → 自定义背景 | 全屏背景图 / 视频、滤镜、页面透明化 |
| [benben-better](https://github.com/Luogu-Plugins/benben-better) | 犇犇优化 | 回复犇犇时不再丢失 LaTeX 与 Markdown |
| [Luogu-ImageHosting-Optimization](https://github.com/Luogu-Plugins/Luogu-ImageHosting-Optimization) | 图床优化 | 图床页面 <kbd>Ctrl</kbd> + <kbd>V</kbd> 直接上传剪贴板图片 |
| [lg-contest-better](https://github.com/Luogu-Plugins/lg-contest-better) | 比赛优化 | 首页近期比赛显示等级分门槛 / 咕值 |

## 功能亮点

- **统一设置面板**：五个插件的全部开关集中在同一个居中弹窗里，勾选即生效。
- **卡片模糊**：为页面卡片、浮层、弹窗和评论区添加玻璃模糊效果，模糊度可调。
- **卡片透明度**：调节卡片背景透明度，打造更轻盈、更通透或更简洁的视觉风格。
- **卡片圆角 / 图片圆角**：自定义卡片、文章区域、面板的圆角半径，并统一为图片应用圆角样式。
- **背景全屏**：将主题背景图扩展至整个页面，也可以直接换成自己的背景。
- **自定义背景**：上传或裁剪背景图 / 视频，拖动滤镜滑块调节观感，并让页面元素透明化以露出背景。顶栏与两侧栏默认**完全透明**，想要磨砂白条就在总设置面板里把「顶栏 / 侧栏不透明度」拉起来；卡片不透明度与卡片模糊在加载后立即生效，不必先切一次主题配置。
- **广告屏蔽**：隐藏洛谷部分页面的广告卡片，减少视觉干扰。
- **犇犇优化**：回复犇犇时不再丢失 LaTeX 与 Markdown。
- **图床优化**：图床页面直接按 <kbd>Ctrl</kbd> + <kbd>V</kbd> 上传剪贴板里的图片。
- **比赛优化**：在首页近期比赛列表中显示等级分门槛与咕值，开关即时生效、无需刷新页面。
- **自定义 CSS**：直接输入自定义样式，实时注入页面，快速打造个性化界面。
- **更新通道**：在「稳定版」（默认）与「最新版」之间切换，一键检查更新。
- **媒体存 IndexedDB**：背景图 / 视频以 Blob 存进 IndexedDB，不占用户脚本 5~10MB 的存储配额。

## 设置面板

面板居中显示、四周压暗，右上角有红色圆形按钮关闭（<kbd>Esc</kbd> 也可以）。面板里包含五个滑块（卡片模糊度、卡片不透明度、卡片圆角曲度、图片圆角曲度、顶栏 / 侧栏不透明度）、八个复选框、自定义 CSS 文本域、更新通道下拉框，以及「检查更新」与「还原设置」两个按钮。

八个复选框的排列顺序是：卡片模糊、卡片圆角、图片圆角、背景全屏、关闭广告、犇犇优化、图床优化、比赛优化。

「背景全屏」这一行的控件是逐个往右追加的：

- 勾选 **背景全屏** 后才出现下拉框（`使用主题配置` / `自定义背景`）。
- 下拉框选中 **自定义背景** 后，右边再出现 **配置** 按钮，点击它会弹出独立的背景设置窗口（上传 / 裁剪图片或视频、拖滤镜滑块）。
- 下拉框选中 **使用主题配置** 时，下方提示需要先去 [主题](https://www.luogu.com.cn/theme) 里启用中景图片设置。
- **卡片模糊 / 卡片圆角 / 图片圆角** 取消勾选时，对应的滑块会变灰禁用，并且不再注入该部分的样式。

## 安装指南

1. 安装支持用户脚本的浏览器扩展，例如 Tampermonkey、Violentmonkey 或 Greasemonkey。
2. 将 [`LuoguBetter.user.js`](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/LuoguBetter.user.js) 导入用户脚本管理器，或从 [最新 Release](https://github.com/Luogu-Plugins/Luogu-Better/releases/latest/download/LuoguBetter.user.js) 下载安装。
3. 打开或刷新 [洛谷](https://www.luogu.com.cn)，脚本会自动运行并生效。

## 使用说明

- 首次运行时，脚本会自动初始化默认配置。
- 页面加载后，右上角导航栏里会出现 **Luogu Better!** 按钮（位于右上角导航项左边），点击即可打开设置面板。
- 也可以从油猴菜单点击 `打开设置面板`，按 <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>L</kbd>，或在控制台执行 `LuoguBetter.openPanel()`。
- 在设置面板中移动滑块或切换开关，可实时预览效果，设置立即生效。
- 在面板中输入自定义 CSS，样式会实时注入页面。
- 按 <kbd>Esc</kbd> 或点击右上角红色按钮，可快速关闭设置面板。

## 更新通道

面板里的「更新通道」决定检查哪个版本（默认 `稳定版`）：

| 通道 | 取哪个 release | 对应 tag |
| --- | --- | --- |
| `稳定版` | 最新的**非预发布**版本 | `vX.Y.0` |
| `最新版` | 最新一个，**包含**预发布 | `vX.Y.Z`（patch ≠ 0） |

## 开发

源码按模块拆分在 `src/`，构建脚本 `tools/build.mjs` 拼接。

```bash
npm run build     # 构建一次 -> LuoguBetter.user.js（仓库根目录）
npm run watch     # 监听 src/ 自动重建
npm run check     # 构建 + 语法检查（CI 就是跑这个）
```

```
src/
├─ meta.txt                 # 油猴元数据头
├─ core/
│  ├─ namespace.js          # LB 命名空间与常量
│  ├─ utils.js              # $ / el / debounce / waitFor / toast ...
│  ├─ storage.js            # GM 存储封装 + IndexedDB 媒体仓库
│  ├─ config.js             # 默认值、读写、订阅
│  ├─ spa.js                # 路由监听、元素保活、节点出现观察
│  ├─ ui.js                 # 遮罩窗口与滑块/开关/下拉等控件
│  └─ panel.js              # 总设置面板
├─ modules/                 # appearance / adblock / background / background-panel
│                           # benben / imagehosting / contest / updater
└─ main.js                  # 启动流程
tools/build.mjs             # 构建脚本（拼接 src/ -> LuoguBetter.user.js）
tools/strip-comments.mjs    # 构建期剥注释的扫描器
```

## 贡献与反馈

- 欢迎提交 Issue 和 Pull Request，反馈兼容性问题、功能建议或新的插件合并思路。
- 合并进来的五个上游插件均为 MIT 协议，本项目同样以 MIT 发布，原作者版权见各自仓库。

## 致谢

<p align="center">
  <a href="https://github.com/a-small-OIer"><img src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/284595479%3Fs%3D60%26v%3D4&mask=circle&w=60&h=60" alt="avatar" width="60" height="60" /></a>
  <a href="https://github.com/zsTree0830"><img src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/308963692%3Fs%3D60%26v%3D4&mask=circle&w=60&h=60" alt="avatar" width="60" height="60" /></a>
  <a href="https://github.com/px-poxiao"><img src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/159022544%3Fs%3D60%26v%3D4&mask=circle&w=60&h=60" alt="avatar" width="60" height="60" /></a>
  <a href="https://github.com/UTF-8s"><img src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/109419692%3Fs%3D60%26v%3D4&mask=circle&w=60&h=60" alt="avatar" width="60" height="60" /></a>
</p>

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/LICENSE) 文件。
