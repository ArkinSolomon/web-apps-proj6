import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
import './css/App.css';
import Create from './pages/Create';
import Login from './pages/Login';
import Planner from './pages/Planner';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to='/login' replace={true} />} />
        <Route path='/create' element={<Create />} />
        <Route path='/login' element={<Login />} />
        <Route path='/planner/:userId?' element={<Planner />} />
      </Routes>
    </Router>
  );
}

export default App;
