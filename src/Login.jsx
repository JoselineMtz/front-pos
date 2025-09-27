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
      setServerStatus(response.data.database?.status || response.data.database || "Desconocido");
    } catch (err) {
      setServerStatus("Error de conexión");
    }
  };

  // Función para ver configuración detallada
  const testConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/config`);
      const config = response.data;
      
      setError(`
🔧 CONFIGURACIÓN DETALLADA:
    
Supabase URL: ${config.supabase.url}
Supabase Key: ${config.supabase.key}
Estado: ${config.supabase.status}
Detalles: ${config.supabase.details}

JWT: ${config.jwt}
Timestamp: ${config.timestamp}

💡 SUGERENCIAS:
${config.supabase.status.includes('❌') ? 
  '• Verifica que la tabla "usuarios" exista en Supabase\n• Revisa las políticas RLS\n• Inserta datos de prueba' : 
  '• La conexión parece correcta, prueba con usuarios reales'}
      `);
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
      } else if (err.response?.data?.message) {
        setError(`❌ Error: ${err.response.data.message}`);
      } else {
        setError("❌ Error de conexión. Verifica la consola para más detalles.");
      }
      console.error("Error completo:", err);
    } finally {
      setLoading(false);
    }
  };

  // Probar con credenciales de simulación
  const testSimulation = async () => {
    setUsername("admin");
    setPassword("123456");
    setError("✅ Credenciales de simulación cargadas. Haz clic en Iniciar Sesión.");
  };

  // Probar conexión directa
  const testConnection = async () => {
    try {
      setError("🔍 Probando conexión con el servidor...");
      const response = await axios.get(`${API_BASE_URL}/`);
      setError(`✅ Servidor funcionando: ${response.data.message}`);
    } catch (err) {
      setError("❌ No se puede conectar al servidor");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f5f5f5" }}>
      <form onSubmit={handleLogin} style={{ background: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "400px" }}>
        
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>🔐 Iniciar Sesión</h2>

        {/* Estado del sistema */}
        <div style={{ 
          background: serverStatus.includes('✅') ? "#e8f5e8" : 
                     serverStatus.includes('❌') ? "#ffebee" : "#fff3cd", 
          padding: "10px", 
          borderRadius: "5px", 
          marginBottom: "15px",
          border: serverStatus.includes('✅') ? "1px solid #a5d6a7" : 
                 serverStatus.includes('❌') ? "1px solid #ef9a9a" : "1px solid #ffeaa7"
        }}>
          <div style={{ fontSize: "12px", textAlign: "center" }}>
            <strong>Base de datos:</strong> {serverStatus}
          </div>
        </div>

        {/* Botones de diagnóstico */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
          <button type="button" onClick={checkServerStatus} style={{ padding: "8px", background: "#2196f3", color: "white", border: "none", borderRadius: "5px", fontSize: "12px", flex: 1 }}>
            🔄 Estado
          </button>
          <button type="button" onClick={testConfig} style={{ padding: "8px", background: "#9c27b0", color: "white", border: "none", borderRadius: "5px", fontSize: "12px", flex: 1 }}>
            ⚙️ Config
          </button>
          <button type="button" onClick={testConnection} style={{ padding: "8px", background: "#4caf50", color: "white", border: "none", borderRadius: "5px", fontSize: "12px", flex: 1 }}>
            🌐 Conexión
          </button>
          <button type="button" onClick={testSimulation} style={{ padding: "8px", background: "#ff9800", color: "white", border: "none", borderRadius: "5px", fontSize: "12px", flex: 1 }}>
            🧪 Simulación
          </button>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#555" }}>Usuario:</label>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px" }}
            required
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#555" }}>Contraseña:</label>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px" }}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "12px", 
            background: loading ? "#ccc" : "#ff5722", 
            color: "white", 
            border: "none", 
            borderRadius: "5px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "🔄 Conectando..." : "🚀 Iniciar Sesión"}
        </button>

        {error && (
          <div style={{ 
            marginTop: "15px", 
            padding: "10px", 
            background: error.includes("✅") ? "#e8f5e8" : "#ffebee", 
            color: error.includes("✅") ? "#2e7d32" : "#c62828",
            borderRadius: "5px", 
            fontSize: "14px", 
            whiteSpace: 'pre-wrap',
            border: error.includes("✅") ? "1px solid #a5d6a7" : "1px solid #ef9a9a"
          }}>
            {error}
          </div>
        )}

        {/* Información de ayuda */}
        <div style={{ marginTop: "15px", fontSize: "11px", color: "#666", textAlign: "center" }}>
          <p><strong>Modo de uso:</strong></p>
          <p>• Si la BD está en simulación: usa <code>admin/123456</code></p>
          <p>• Si la BD está conectada: usa tus usuarios reales</p>
          <p>• Haz clic en 🧪 Simulación para cargar credenciales de prueba</p>
        </div>

      </form>
    </div>
  );
}