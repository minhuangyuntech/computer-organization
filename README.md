# 計算機組織線上講義

這個資料夾是一個多頁式純靜態網站，可直接部署到 GitHub Pages。

## 網站結構

- `index.html`：課程首頁與 18 週索引
- `weeks/week-01.html` 到 `weeks/week-18.html`：每週獨立講義頁面
- `styles.css`：全站樣式與列印樣式
- `site.js`：明暗模式、列印與搜尋週次
- `app.js`：目前的課程內容資料來源
- `content/supplements.js`：18 週專屬自學導讀、圖表、推導例題與自我檢核
- `tools/build-pages.js`：從內容資料產生首頁與各週 HTML
- `tools/validate-content.js`：檢查圖表欄位、例題計算、頁面結構與內部連結

## 本機預覽

直接開啟 `index.html`，或在此資料夾執行：

```bash
python3 -m http.server 8000
```

再瀏覽 `http://localhost:8000`。

## 更新教材內容

1. 編輯 `app.js` 中的 `lectures` 陣列或 `content/supplements.js`。
2. 執行：

```bash
node tools/build-pages.js
node tools/validate-content.js
```

3. 檢查 `index.html` 與 `weeks/` 內頁是否更新。

## GitHub Pages 部署

Repository 根目錄就是這個 `lectures/` 資料夾。GitHub Pages 目前從 `main` branch 的 `/ (root)` 發佈。

公開網址：<https://minhuangyuntech.github.io/computer-organization/>

## 參考範圍

內容參考 Linda Null《The Essentials of Computer Organization and Architecture》第六版公開目錄中的主題架構。網站的中文敘述、例題、推導與圖表均為獨立編寫。
