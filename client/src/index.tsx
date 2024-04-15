import ReactDOM from 'react-dom/client';
import './css/index.css';
import App from './App';
import plannerApi from './api/plannerApi';

plannerApi.data().then(console.log);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <App />
);