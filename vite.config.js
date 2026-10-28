import { defineConfig } from 'vite';

// base: './' 讓建置後的網頁放在 GitHub Pages 的子路徑（帳號.github.io/倉庫名/）也能正確載入
export default defineConfig({
    base: './',
    build: { chunkSizeWarningLimit: 1200 }
});
