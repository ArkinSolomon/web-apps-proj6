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
import Faculty from './pages/Faculty';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to='/login' replace={true} />} />
        <Route path='/create' element={<Create />} />
        <Route path='/login' element={<Login />} />
        <Route path='/planner' element={<Planner />} />
        <Route path='/faculty' element={<Faculty />} />
      </Routes>
    </Router>
  );
}

export default App;
