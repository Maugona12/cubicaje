import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Inventory from './modules/Inventory';
import Fleet from './modules/Fleet';
import Orders from './modules/Orders';
import ConfirmedOrders from './modules/ConfirmedOrders';
import './App.css';



function NavTabs() {
  const location = useLocation();
  const tabs = [
    { path: '/inventario', label: 'Inventario' },
    { path: '/flota', label: 'Flota' },
    { path: '/pedidos', label: 'Pedidos' },
    { path: '/confirmados', label: 'Pedidos Confirmados' },
  ];
  return (
    <nav style={{ display: 'flex', gap: '1rem', marginBottom: 20 }}>
      {tabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            textDecoration: 'none',
            color: location.pathname === tab.path ? '#fff' : '#3949ab',
            background: location.pathname === tab.path ? '#3949ab' : 'transparent',
            fontWeight: location.pathname === tab.path ? 'bold' : 'normal',
            transition: 'background 0.2s',
          }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <NavTabs />
      <Routes>
        <Route path="/" element={<Navigate to="/inventario" replace />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/flota" element={<Fleet />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/confirmados" element={<ConfirmedOrders />} />
      </Routes>
    </Router>
  );
}

export default App
