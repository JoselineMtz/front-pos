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
      console.log("🔐 Enviando credenciales a la base de datos real...");
      
      const res = await axios.post(
        `${API_BASE_URL}/api/login`,
        { username, password },
        { timeout: 10000 }
      );

      console.log("✅ Respuesta del servidor:", res.data);

      const { token, user, message } = res.data;

      if (!token || !user?.rol) {
        throw new Error("Respuesta inválida del servidor");
      }

      // Guardar datos de autenticación
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("rol", user.rol);
      localStorage.setItem("username", user.username);
      localStorage.setItem("user_id", user.id);

      alert(message || "✅ Login exitoso con base de datos real");

      // Redirección basada en el rol
      if (user.rol === "admin") {
        navigate("/admin");
      } else if (user.rol === "vendedor") {
        navigate("/vendedor");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error("❌ Error completo:", err);
      
      if (err.response?.status === 401) {
        setError("🔐 Usuario o contraseña incorrectos en la base de datos");
      } else if (err.response?.status === 500) {
        setError("⚙️ Error del servidor. La base de datos puede no estar configurada.");
      } else if (err.code === 'ECONNABORTED') {
        setError("⏰ Timeout. El servidor puede estar procesando la conexión a la BD.");
      } else {
        setError("🌐 Error de conexión: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Probar estado del servidor y base de datos
  const testServerStatus = async () => {
    try {
      setError("🔍 Verificando estado del servidor y base de datos...");
      
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      setError(`✅ ${response.data.message} - Base de datos: ${response.data.database}`);
    } catch (err) {
      setError("❌ No se puede conectar al servidor");
    }
  };

  // Probar con usuario de la base de datos
  const testWithRealCredentials = async () => {
    if (!username || !password) {
      setError("⚠️ Ingresa usuario y contraseña primero");
      return;
    }
    
    try {
      setError(`🔐 Probando con usuario real: ${username}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/login`,
        { username, password }
      );
      
      setError(`✅ Credenciales VÁLIDAS: ${response.data.message}`);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("❌ Credenciales INVÁLIDAS en la base de datos");
      } else {
        setError("❌ Error probando credenciales: " + err.message);
      }
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <form onSubmit={handleLogin} style={{ background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", width: "400px" }}>
        
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>🔐 Iniciar Sesión</h2>

        {/* Estado del sistema */}
        <div style={{ background: "#e8f4fd", padding: "12px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #b3d9ff" }}>
          <div style={{ fontSize: "12px", color: "#0066cc" }}>
            <strong>🔄 Estado del Sistema:</strong><br/>
            <span id="status-info">Servidor funcionando - Base de datos: Pendiente de configuración</span>
          </div>
        </div>

        {/* Botones de diagnóstico */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
          <button type="button" onClick={testServerStatus} style={{ flex: 1, padding: "8px", background: "#2196f3", color: "white", border: "none", borderRadius: "6px", fontSize: "12px" }}>
            🔍 Estado BD
          </button>
          <button type="button" onClick={testWithRealCredentials} style={{ flex: 1, padding: "8px", background: "#4caf50", color: "white", border: "none", borderRadius: "6px", fontSize: "12px" }}>
            🔐 Probar Credenciales
          </button>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>Usuario de la BD:</label>
          <input
            type="text"
            placeholder="Usuario de tu base de datos"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: "12px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px" }}
            required
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>Contraseña de la BD:</label>
          <input
            type="password"
            placeholder="Contraseña de tu base de datos"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px" }}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "12px", 
            background: loading ? "#ccc" : "#ff6b35", 
            color: "white", 
            border: "none", 
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "🔄 Conectando con BD..." : "🚀 Iniciar Sesión con BD Real"}
        </button>

        {error && (
          <div style={{ 
            marginTop: "15px", 
            padding: "12px", 
            background: error.includes("✅") ? "#e8f5e8" : "#ffebee", 
            color: error.includes("✅") ? "#2e7d32" : "#c62828",
            borderRadius: "8px",
            fontSize: "14px",
            border: `1px solid ${error.includes("✅") ? "#a5d6a7" : "#ef9a9a"}`
          }}>
            {error}
          </div>
        )}

        {/* Información importante */}
        <div style={{ marginTop: "20px", padding: "12px", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffeaa7" }}>
          <p style={{ fontSize: "12px", color: "#856404", margin: 0 }}>
            <strong>⚠️ Para usar tu base de datos real:</strong><br/>
            1. Configura SUPABASE_URL y SUPABASE_ANON_KEY en Render<br/>
            2. Usa credenciales existentes en tu tabla 'usuarios'<br/>
            3. El servidor se conectará a tu PostgreSQL via Supabase
          </p>
        </div>

      </form>
    </div>
  );
}