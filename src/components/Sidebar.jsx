import React from 'react';
import { FaBox, FaShoppingCart, FaUsers, FaCashRegister, FaChartLine, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = ({ onSelectSection, currentSection }) => {
  const menuItems = [
    { id: 'stock', label: 'Control de Stock', icon: <FaBox /> },
    { id: 'superStock', label: 'Registro de Compras', icon: <FaShoppingCart /> },
    { id: 'employees', label: 'Gestión de Empleados', icon: <FaUsers /> },
    { id: 'pos', label: 'Punto de Venta', icon: <FaCashRegister /> },
    { id: 'ventas', label: 'Mis Ventas', icon: <FaChartLine /> },
    { id: 'logout', label: 'Cerrar Sesión', icon: <FaSignOutAlt /> }
  ];

  return (
    <>
      <style jsx>{`
        .sidebar-container {
          background-color: #1f2937; /* bg-gray-800 */
          color: #ffffff;
          padding: 1.5rem;
          width: 16rem; /* w-64 */
          min-height: 100vh;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                      0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-lg */
          display: flex;
          flex-direction: column;
          font-family: 'Helvetica', sans-serif;
        }
        .sidebar-title {
          font-size: 1.5rem; /* text-2xl */
          font-weight: 700; /* font-bold */
          margin-bottom: 2rem;
          letter-spacing: 1px;
        }
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sidebar-nav-item {
          cursor: pointer;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          transition: all 0.2s ease-in-out;
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }
        .sidebar-nav-item:hover {
          background-color: #374151;
          transform: scale(1.03);
        }
        .sidebar-nav-item.active {
          background-color: #4f46e5; /* Indigo moderno */
          color: #fff;
          font-weight: 600;
          transform: scale(1.05);
        }
        .sidebar-nav-item span.sidebar-icon {
          margin-right: 0.75rem;
          font-size: 1.3rem;
          transition: color 0.2s;
        }
        .sidebar-nav-item:hover span.sidebar-icon {
          color: #818cf8; /* Azul claro moderno */
        }
        .sidebar-nav-item.active span.sidebar-icon {
          color: #fff;
        }
      `}</style>

      <div className="sidebar-container">
        <h2 className="sidebar-title">Menú Principal</h2>
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`sidebar-nav-item ${currentSection === item.id ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
