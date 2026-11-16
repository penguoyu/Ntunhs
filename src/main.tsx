import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// 字型與圖示打包在專案內，沒有網路也能正常顯示
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import 'material-symbols/outlined.css';
import './index.css';

// 配色比較用：網址加 ?palette=b（青綠）或 ?palette=original（原本深藍），預設為北護綠
const palette = new URLSearchParams(window.location.search).get('palette');
if (palette) document.documentElement.dataset.palette = palette;

createRoot(document.getElementById('root')!).render(<App />);
