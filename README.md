# 清大旗隊網站

網站入口為根目錄 index.html，可直接部署到 GitHub Pages。

- index.html：頁面內容
- style.css：配色與版面
- script.js：手機選單
- assets/：隊徽及場地照片
- mark.svg：網站小圖示
- scripts/serve.cjs：本機預覽工具

本機預覽：在專案資料夾執行 `node scripts/serve.cjs`，開啟 http://127.0.0.1:4173/ 。

GitHub Pages：Settings → Pages → Deploy from a branch，選擇實際推送的分支與 /(root)。提交並推送所有變更後，從 https://nthucg.github.io/ 進入。