import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = "https://pos-sales-yo.onrender.com";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Usar la ruta que SÍ existe
      const res = await axios.post(
        `${API_BASE_URL}/api/login`,
        { username, password },
        { timeout: 10000 }
      );

      const { token, user, message } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("rol", user.rol);

      alert(message || "Login exitoso");

      if (user.rol === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error("Error:", err);
      
      if (err.response?.status === 404) {
        setError("❌ El endpoint /api/login no existe en el servidor");
      } else if (err.response?.status === 401) {
        setError("🔐 Usuario o contraseña incorrectos");
      } else {
        setError("🌐 Error de conexión: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Probar la ruta principal (que SÍ funciona)
  const testServer = async () => {
    try {
      setError("🔍 Probando servidor...");
      const response = await axios.get(API_BASE_URL);
      setError(`✅ Servidor funcionando: ${response.data.message}`);
    } catch (err) {
      setError("❌ Servidor no disponible");
    }
  };

  // Probar directamente el login
  const testLoginDirect = async () => {
    try {
      setError("🔐 Probando login con credenciales de prueba...");
      
      const response = await axios.post(
        `${API_BASE_URL}/api/login`,
        { username: "admin", password: "123456" }
      );
      
      setError(`✅ Login funciona: ${response.data.message}`);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("❌ La ruta /api/login NO existe en el servidor");
      } else {
        setError("❌ Error en login: " + err.message);
      }
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f5f5f5" }}>
      <form onSubmit={handleLogin} style={{ background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "350px" }}>
        
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Iniciar Sesión</h2>

        {/* Información de debug */}
        <div style={{ background: "#e3f2fd", padding: "10px", borderRadius: "5px", marginBottom: "15px", fontSize: "12px" }}>
          <strong>URL del API:</strong><br/>
          <code>{API_BASE_URL}</code>
        </div>

        {/* Botones de prueba */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button type="button" onClick={testServer} style={{ flex: 1, padding: "8px", background: "#2196f3", color: "white", border: "none", borderRadius: "5px" }}>
            🔍 Probar Servidor
          </button>
          <button type="button" onClick={testLoginDirect} style={{ flex: 1, padding: "8px", background: "#4caf50", color: "white", border: "none", borderRadius: "5px" }}>
            🔐 Probar Login
          </button>
        </div>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "5px" }}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "5px" }}
          required
        />

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: "100%", padding: "10px", background: "#ff5722", color: "white", border: "none", borderRadius: "5px" }}
        >
          {loading ? "Conectando..." : "Iniciar Sesión"}
        </button>

        {error && (
          <div style={{ 
            marginTop: "15px", 
            padding: "10px", 
            background: error.includes("✅") ? "#e8f5e8" : "#ffebee", 
            color: error.includes("✅") ? "#2e7d32" : "#c62828",
            borderRadius: "5px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        {/* Credenciales de prueba */}
        <div style={{ marginTop: "15px", fontSize: "12px", color: "#666", textAlign: "center" }}>
          <p><strong>Credenciales de prueba:</strong></p>
          <p>Usuario: <code>admin</code></p>
          <p>Contraseña: <code>123456</code></p>
        </div>

      </form>
    </div>
  );
}