import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// 字型與圖示打包在專案內，沒有網路也能正常顯示
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import 'material-symbols/outlined.css';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
