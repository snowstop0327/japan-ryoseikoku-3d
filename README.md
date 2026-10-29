# 日本令制國・一之宮與百名城 3D 探索島

以 Three.js 製作的日本古地圖 3D 探索網頁：68 令制國＋蝦夷地＋琉球、一之宮與名社、日本百名城、四季、即時天氣、代參犬任務、御朱印帳。

## 第一次使用

需要先安裝 [Node.js](https://nodejs.org/)（20 版以上）。在這個資料夾打開終端機：

```bash
npm install
```

## 開發時預覽

```bash
npm run dev
```

終端機會顯示網址（通常是 http://localhost:5173 ），用瀏覽器打開即可；修改檔案存檔後頁面會自動更新。

> 這個版本不能直接雙擊 index.html 打開，一定要用上面的指令。

## 建置正式版

```bash
npm run build
```

結果會放在 `dist/` 資料夾，可以用 `npm run preview` 先看一次正式版。

## 部署到 GitHub Pages（自動）

1. 在 GitHub 建立一個新的倉庫（Public）。
2. 把整個資料夾推上去（`node_modules/`、`dist/` 已設定不上傳）。
3. 倉庫 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
4. 之後每次推到 `main` 分支，`.github/workflows/deploy.yml` 會自動建置並更新網站，網址是 `https://帳號.github.io/倉庫名/`。

## 檔案結構

```
index.html              頁面結構（工具列、卡片、彈窗）
src/main.js             Vite 進入點：載入樣式與 Three.js
src/style.css           自訂樣式（Tailwind 建置）
public/js/              主程式，依檔名順序載入、共用全域範圍
  01-data-provinces.js    令制國、五畿七道與琉球資料
  02-data-sites.js        各國神社、城郭與名社資料
  02b-site-readings.js    神社與城的日文讀音（朗讀用）
  03-state.js             狀態與御朱印儲存
  04-scene.js             場景、海與島嶼
  05-seasons.js           四季配色、河川湖泊
  06-mountains.js         山岳、城鎮小物
  07-forests.js           森林
  08-architecture.js      神社與城郭建模
  09-provinces-routes.js  各國地台、名牌、驛道
  10-sky-sea.js           雲、海鷗、船
  11-wardrobe.js          旅人與換裝
  12-walkers.js           路上的小人物
  13-weather.js           即時天氣（Open-Meteo）
  14-dog-quest.js         代參犬任務
  14b-dog-encounters.js   代參犬的途中遭遇（選擇＋3D 小劇場）
  15-interaction.js       點擊、鏡頭、動畫迴圈
  16-ui.js                索引、介紹卡、維基百科照片
  17-traveler-card.js     旅人介紹卡
  18-toggles.js           工具列開關、視角控制
  19-search-stamps.js     搜尋、御朱印帳、彈窗
  20-boot.js              啟動
  21-tour.js              第一次開啟時的操作教學
```

新增檔案時，記得在 `index.html` 底部照順序加上 `<script defer src="js/檔名.js">`。

## 資料來源

- 天氣：[Open-Meteo](https://open-meteo.com/)
- 照片：日文維基百科／[Wikimedia Commons](https://commons.wikimedia.org/)（各照片依其授權標示出處）
