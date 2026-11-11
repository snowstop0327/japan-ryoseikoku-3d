// Vite 進入點：載入樣式，並把 Three.js（含 OrbitControls）掛到全域 THREE，
// 讓 public/js/ 裡依序載入的主程式沿用原本的寫法。
import './style.css';
import * as THREE_MODULE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import QRCode from 'qrcode';

window.THREE = Object.assign({}, THREE_MODULE, { OrbitControls });
// 備份與移轉的 QR code（見 public/js/19d-backup.js）
window.QRCode = QRCode;
