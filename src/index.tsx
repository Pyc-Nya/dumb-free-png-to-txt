import ReactDOM from 'react-dom/client';
import App from './ts/App';
import './css/style.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <App />
);

