Language: [English](https://github.com/Luogu-Plugins/Luogu-Better#readme) | [简体中文](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/README/Chinese.md) | 繁體中文

<h1 align="center">Luogu Better!</h1>
<p align="center">洛谷增強腳本</p>

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

## 專案簡介

Luogu Better! 是一款面向 [洛谷](https://www.luogu.com.cn) 的增強使用者腳本。它把五個各自獨立的外掛合併進同一個腳本、同一套設定面板：外觀、背景、犇犇、圖床與比賽的全部功能都能在一個置中彈窗裡單獨開關，改動即時生效、無需重新整理頁面。

## 上游外掛

| 外掛名稱 | 面板開關 | 作用 |
| --- | --- | --- |
| [Luogu Display Better](https://github.com/Luogu-Plugins/Luogu-Display-Better) | 卡片模糊 / 卡片圓角 / 圖片圓角 / 關閉廣告 | 卡片毛玻璃、卡片不透明度、圓角、圖片圓角、廣告遮蔽、自訂 CSS、佈景主題全螢幕背景、捲軸與 IDE 版面 |
| [Custom-Luogu-Background](https://github.com/Luogu-Plugins/Custom-Luogu-Background) | 背景全螢幕 → 自訂背景 | 全螢幕背景圖 / 影片、濾鏡、頁面透明化 |
| [benben-better](https://github.com/Luogu-Plugins/benben-better) | 犇犇最佳化 | 回覆犇犇時不再遺失 LaTeX 與 Markdown |
| [Luogu-ImageHosting-Optimization](https://github.com/Luogu-Plugins/Luogu-ImageHosting-Optimization) | 圖床最佳化 | 圖床頁面按 <kbd>Ctrl</kbd> + <kbd>V</kbd> 直接上傳剪貼簿圖片 |
| [lg-contest-better](https://github.com/Luogu-Plugins/lg-contest-better) | 比賽最佳化 | 首頁近期比賽顯示等級分門檻 / 咕值 |

## 功能亮點

- **統一設定面板**：五個外掛的全部開關集中在同一個置中彈窗裡，勾選即生效。
- **卡片模糊**：為頁面卡片、浮層、彈窗和留言區加入玻璃模糊效果，模糊程度可調。
- **卡片透明度**：調整卡片背景透明度，打造更輕盈、更通透或更簡潔的視覺風格。
- **卡片圓角 / 圖片圓角**：自訂卡片、文章區域、面板的圓角半徑，並統一為圖片套用圓角樣式。
- **背景全螢幕**：將佈景主題背景圖延伸至整個頁面，也可以直接換成自己的背景。
- **自訂背景**：上傳或裁切背景圖 / 影片，拖動濾鏡滑桿調整觀感，並讓頁面元素透明化以露出背景。頂欄與兩側欄預設**完全透明**，想要磨砂白條就在總設定面板裡把「頂欄 / 側欄不透明度」拉起來；卡片不透明度與卡片模糊在載入後立即生效，不必先切一次佈景主題設定。
- **廣告遮蔽**：隱藏洛谷部分頁面的廣告卡片，減少視覺干擾。
- **犇犇最佳化**：回覆犇犇時不再遺失 LaTeX 與 Markdown。
- **圖床最佳化**：圖床頁面直接按 <kbd>Ctrl</kbd> + <kbd>V</kbd> 上傳剪貼簿裡的圖片。
- **比賽最佳化**：在首頁近期比賽列表中顯示等級分門檻與咕值，開關即時生效、無需重新整理頁面。
- **自訂 CSS**：直接輸入自訂樣式，即時注入頁面，快速打造個人化介面。
- **更新通道**：在「穩定版」（預設）與「最新版」之間切換，一鍵檢查更新。
- **媒體存 IndexedDB**：背景圖 / 影片以 Blob 存進 IndexedDB，不佔使用者腳本 5~10MB 的儲存配額。

## 設定面板

面板置中顯示、四周壓暗，右上角有紅色圓形按鈕關閉（<kbd>Esc</kbd> 也可以）。面板裡包含五個滑桿（卡片模糊度、卡片不透明度、卡片圓角曲度、圖片圓角曲度、頂欄 / 側欄不透明度）、八個核取方塊、自訂 CSS 文字區、更新通道下拉選單，以及「檢查更新」與「還原設定」兩個按鈕。

八個核取方塊的排列順序是：卡片模糊、卡片圓角、圖片圓角、背景全螢幕、關閉廣告、犇犇最佳化、圖床最佳化、比賽最佳化。

「背景全螢幕」這一列的控件是逐個往右追加的：

- 勾選 **背景全螢幕** 後才出現下拉選單（`使用主題配置` / `自訂背景`）。
- 下拉選單選中 **自訂背景** 後，右邊再出現 **設定** 按鈕，點擊它會彈出獨立的背景設定視窗（上傳 / 裁切圖片或影片、拖濾鏡滑桿）。
- 下拉選單選中 **使用主題配置** 時，下方提示需要先去 [佈景主題](https://www.luogu.com.cn/theme) 裡啟用中景圖片設定。
- **卡片模糊 / 卡片圓角 / 圖片圓角** 取消勾選時，對應的滑桿會變灰停用，並且不再注入該部分的樣式。

## 安裝指南

1. 安裝支援使用者腳本的瀏覽器擴充功能，例如 Tampermonkey、Violentmonkey 或 Greasemonkey。
2. 將 [`LuoguBetter.user.js`](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/LuoguBetter.user.js) 匯入使用者腳本管理員，或從 [最新 Release](https://github.com/Luogu-Plugins/Luogu-Better/releases/latest/download/LuoguBetter.user.js) 下載安裝。
3. 開啟或重新整理 [洛谷](https://www.luogu.com.cn)，腳本會自動執行並生效。

## 使用說明

- 首次執行時，腳本會自動初始化預設設定。
- 頁面載入後，右上角導覽列會出現 **Luogu Better!** 按鈕（位於右上角導覽項左邊），點擊即可開啟設定面板。
- 也可以從使用者腳本選單點擊 `打开设置面板`、按 <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>L</kbd>，或在主控台執行 `LuoguBetter.openPanel()`。
- 在設定面板中移動滑桿或切換開關，可即時預覽效果，設定立即生效。
- 在面板中輸入自訂 CSS，樣式會即時注入頁面。
- 按下 <kbd>Esc</kbd> 或點擊右上角紅色按鈕，可快速關閉設定面板。

## 更新通道

面板裡的「更新通道」決定檢查哪個版本（預設 `穩定版`）：

| 通道 | 取哪個 release | 對應 tag |
| --- | --- | --- |
| `穩定版` | 最新的**非預發布**版本 | `vX.Y.0` |
| `最新版` | 最新一個，**包含**預發布 | `vX.Y.Z`（patch ≠ 0） |

## 開發

原始碼按模組拆分在 `src/`，建置腳本 `tools/build.mjs` 拼接。

```bash
npm run build     # 建置一次 -> LuoguBetter.user.js（倉庫根目錄）
npm run watch     # 監聽 src/ 自動重建
npm run check     # 建置 + 語法檢查（CI 就是跑這個）
```

```
src/
├─ meta.txt                 # 使用者腳本中介資料標頭
├─ core/
│  ├─ namespace.js          # LB 命名空間與常數
│  ├─ utils.js              # $ / el / debounce / waitFor / toast ...
│  ├─ storage.js            # GM 儲存封裝 + IndexedDB 媒體倉庫
│  ├─ config.js             # 預設值、讀寫、訂閱
│  ├─ spa.js                # 路由監聽、元素保活、節點出現觀察
│  ├─ ui.js                 # 遮罩視窗與滑桿/開關/下拉等控件
│  └─ panel.js              # 總設定面板
├─ modules/                 # appearance / adblock / background / background-panel
│                           # benben / imagehosting / contest / updater
└─ main.js                  # 啟動流程
tools/build.mjs             # 建置腳本（拼接 src/ -> LuoguBetter.user.js）
tools/strip-comments.mjs    # 建置期剝註解的掃描器
```

## 貢獻與回饋

- 歡迎提交 Issue 和 Pull Request，回報相容性問題、功能建議或新的外掛合併思路。
- 合併進來的五個上游外掛均為 MIT 授權，本專案同樣以 MIT 發布，原作者版權見各自倉庫。

## 致謝

<p align="center">
  <a href="https://github.com/a-small-OIer"><img src="https://avatars.githubusercontent.com/u/284595479?s=60&v=4" alt="avatar" style="border-radius: 50%;" /></a>
  <a href="https://github.com/zsTree0830"><img src="https://avatars.githubusercontent.com/u/308963692?s=60&v=4" alt="avatar" style="border-radius: 50%;" /></a>
  <a href="https://github.com/px-poxiao"><img src="https://avatars.githubusercontent.com/u/159022544?s=60&v=4" alt="avatar" style="border-radius: 50%;" /></a>
  <a href="https://github.com/UTF-8s"><img src="https://avatars.githubusercontent.com/u/109419692?s=60&v=4" alt="avatar" style="border-radius: 50%;" /></a>
</p>

## 授權條款

本專案採用 MIT 授權條款，詳見 [LICENSE](https://github.com/Luogu-Plugins/Luogu-Better/blob/main/LICENSE) 檔案。
