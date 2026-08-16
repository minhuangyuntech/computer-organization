# 計算機組織線上講義

這個資料夾是一個多頁式純靜態網站，可直接部署到 GitHub Pages。

## 網站結構

- `index.html`：課程首頁與 18 週索引
- `weeks/week-01.html` 到 `weeks/week-18.html`：每週獨立講義頁面
- `styles.css`：全站樣式與列印樣式
- `site.js`：明暗模式、列印與搜尋週次
- `app.js`：目前的課程內容資料來源
- `tools/build-pages.js`：從 `app.js` 產生首頁與各週 HTML

## 本機預覽

直接開啟 `index.html`，或在此資料夾執行：

```bash
python3 -m http.server 8000
```

再瀏覽 `http://localhost:8000`。

## 更新教材內容

1. 編輯 `app.js` 中的 `lectures` 陣列。
2. 執行：

```bash
node tools/build-pages.js
```

3. 檢查 `index.html` 與 `weeks/` 內頁是否更新。

## GitHub Pages 部署

1. 將 `lectures/` 放在 GitHub repository 中。
2. 到 repository 的 Settings → Pages。
3. Source 選擇要部署的 branch。
4. 若 Pages 來源不能直接指定 `lectures/`，可把 `lectures/` 內容移到 repository root 或 `/docs`。

網站入口為 `lectures/index.html`。
