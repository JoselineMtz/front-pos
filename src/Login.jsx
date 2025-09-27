import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("Verificando...");
  const navigate = useNavigate();

  const API_BASE_URL = "https://pos-sales-yo.onrender.com";

  // Verificar estado del servidor al cargar
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      setServerStatus(response.data.database || "Desconocido");
    } catch (err) {
      setServerStatus("Error de conexión");
    }
  };

  const checkConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/config`);
      setError(`🔧 Configuración: ${JSON.stringify(response.data, null, 2)}`);
    } catch (err) {
      setError("❌ No se puede obtener la configuración");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/login`,
        { username, password },
        { timeout: 10000 }
      );

      const { token, user, message } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("rol", user.rol);

      alert(message);

      if (user.rol === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      if (err.response?.status === 401) {
        setError("🔐 Usuario o contraseña incorrectos");
      } else {
        setError("❌ Error: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f5f5f5" }}>
      <form onSubmit={handleLogin} style={{ background: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "380px" }}>
        
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>🔐 Iniciar Sesión</h2>

        {/* Estado del sistema */}
        <div style={{ 
          background: serverStatus.includes('Conectado') ? "#e8f5e8" : "#fff3cd", 
          padding: "10px", 
          borderRadius: "5px", 
          marginBottom: "15px",
          border: serverStatus.includes('Conectado') ? "1px solid #a5d6a7" : "1px solid #ffeaa7"
        }}>
          <div style={{ fontSize: "12px", textAlign: "center" }}>
            <strong>Base de datos:</strong> {serverStatus}
          </div>
        </div>

        {/* Botones de diagnóstico */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
          <button type="button" onClick={checkServerStatus} style={{ flex: 1, padding: "8px", background: "#2196f3", color: "white", border: "none", borderRadius: "5px", fontSize: "12px" }}>
            🔄 Actualizar Estado
          </button>
          <button type="button" onClick={checkConfig} style={{ flex: 1, padding: "8px", background: "#9c27b0", color: "white", border: "none", borderRadius: "5px", fontSize: "12px" }}>
            ⚙️ Ver Config
          </button>
        </div>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "5px" }}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "5px" }}
          required
        />

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: "100%", padding: "12px", background: loading ? "#ccc" : "#ff5722", color: "white", border: "none", borderRadius: "5px" }}
        >
          {loading ? "🔄 Conectando..." : "🚀 Iniciar Sesión"}
        </button>

        {error && (
          <div style={{ marginTop: "15px", padding: "10px", background: "#ffebee", color: "#c62828", borderRadius: "5px", fontSize: "14px", whiteSpace: 'pre-wrap' }}>
            {error}
          </div>
        )}

        {/* Información */}
        <div style={{ marginTop: "15px", fontSize: "11px", color: "#666", textAlign: "center" }}>
          <p>Si la BD muestra "No configurado", configura las variables en Render</p>
        </div>

      </form>
    </div>
  );
}