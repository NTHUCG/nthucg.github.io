# 清華旗隊網站

入口為根目錄 `index.html`，可直接部署至 GitHub Pages。

- `index.html`：首頁
- `coaches.html`：教練介紹（資料待補）
- `team.html`：幹部介紹（資料待補）
- `performances.html`：歷年演出，點擊縮圖才載入 YouTube
- `style.css`：全站樣式、手機版與動畫
- `script.js`：延遲載入影片與動畫恢復
- `assets/`：圖片及游標；頁面使用 WebP，原始照片留作備份

## 本機預覽

執行 `node scripts/serve.cjs`，開啟 http://127.0.0.1:4173/ 。

## 更新網站

修改後執行 `node scripts/update-asset-versions.cjs`，自動更新各頁的 CSS／JS 版本號，避免舊快取。
提交並推送所有相關變更。GitHub Pages 使用實際推送分支及 `/(root)`。

## 發布前檢查

執行 `node --check script.js` 及 `node scripts/check-site.cjs`，確認語法、連結、圖片、影片代碼與快取版本。

落葉效果使用單一 Canvas：桌面 8 片、觸控裝置 3 片；減少動態效果開啟時停用，切到背景或載入影片時暫停。圖片使用 WebP 與響應式尺寸，原始圖檔保留作為素材備份。