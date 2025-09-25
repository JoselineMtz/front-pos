import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Admin from "./Admin";
import Vendedor from "./Vendedor";
import ErrorBoundary from "../ErrorBoundary";

// Componente para proteger las rutas
const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("rol"); // ✅ Cambiado: leer directamente "rol"
  
  console.log("Debug - Token:", token);
  console.log("Debug - User role from localStorage:", userRole);
  console.log("Debug - Required role:", role);

  // Si no hay token, redirigir al login
  if (!token) {
    console.log("Debug - No token, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Si se requiere un rol específico y el usuario no lo tiene, redirigir
  if (role && userRole !== role) {
    console.log("Debug - Role mismatch. Redirecting to unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("Debug - Access granted");
  // Si está autenticado y tiene el rol correcto, mostrar el componente
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <Admin />
            </PrivateRoute>
          }
        />
        <Route
          path="/vendedor"
          element={
            <PrivateRoute role="vendedor">
              <Vendedor />
            </PrivateRoute>
          }
        />

        {/* Ruta para acceso no autorizado */}
        <Route path="/unauthorized" element={<h1>403 - Acceso no autorizado</h1>} />

        {/* Ruta para páginas no encontradas */}
        <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;