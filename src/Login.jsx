import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ URL CORREGIDA: Usar Render en lugar de Vercel
  const API_BASE_URL = "https://pos-sales-yo.onrender.com/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("🔐 Intentando login en:", `${API_BASE_URL}/login`);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/login`,  // ✅ URL correcta
        {
          username,
          password,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log("✅ Respuesta del servidor:", res.data);

      const { token, user, message } = res.data;

      if (!token || !user?.rol) {
        throw new Error("Respuesta inválida del servidor: Token o rol faltante.");
      }

      // Guardar datos de autenticación
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("rol", user.rol);
      localStorage.setItem("username", user.username);
      localStorage.setItem("user_id", user.id);

      alert(message || "Inicio de sesión exitoso");

      // Redirección basada en el rol
      if (user.rol === "admin") {
        navigate("/admin");
      } else if (user.rol === "vendedor") {
        navigate("/vendedor");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("❌ Error completo en login:", err);
      
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // Error del servidor (404, 401, 500, etc.)
          if (err.response.status === 404) {
            setError("❌ Ruta no encontrada (404). Verifica la URL del API.");
          } else if (err.response.status === 401) {
            setError("🔐 Usuario o contraseña incorrectos");
          } else if (err.response.status === 500) {
            setError("⚙️ Error del servidor. Intenta nuevamente.");
          } else {
            setError(err.response.data.message || `Error ${err.response.status}`);
          }
        } else if (err.request) {
          // No hubo respuesta del servidor
          setError("🌐 No hay respuesta del servidor. Verifica:");
          setError(prev => prev + "\n• Que el servidor esté funcionando");
          setError(prev => prev + "\n• Que la URL sea correcta");
          setError(prev => prev + "\n• Tu conexión a internet");
        } else {
          setError("📱 Error en la configuración: " + err.message);
        }
      } else {
        setError("❌ Error inesperado: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Probar conexión con el servidor
  const testConnection = async () => {
    try {
      setError("🔍 Probando conexión con el servidor...");
      
      // Probar la ruta principal primero
      const healthResponse = await axios.get(API_BASE_URL.replace('/api', ''));
      console.log("Health check:", healthResponse.data);
      
      setError(`✅ Servidor conectado: ${healthResponse.data.message}`);
    } catch (err) {
      console.error("Error en test de conexión:", err);
      
      if (axios.isAxiosError(err) && err.response) {
        setError(`❌ Error ${err.response.status}: ${err.response.statusText}`);
      } else {
        setError("❌ No se puede conectar al servidor. Verifica la URL.");
      }
    }
  };

  // Probar ruta de login específica
  const testLoginEndpoint = async () => {
    try {
      setError("🔍 Probando endpoint de login...");
      
      const response = await axios.get(`${API_BASE_URL}/health`);
      setError(`✅ Endpoint funcionando: ${response.data.message}`);
    } catch (err) {
      setError("❌ Endpoint no disponible. Verifica las rutas del API.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          width: 420,
          padding: 30,
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 25,
            color: "#1f2937",
            fontSize: "28px",
            fontWeight: "600",
          }}
        >
          Iniciar Sesión - POS
        </h2>

        {/* Información de conexión */}
        <div style={{ 
          marginBottom: "15px", 
          padding: "10px", 
          backgroundColor: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "8px",
          fontSize: "12px"
        }}>
          <strong>🔗 Conectando a:</strong><br/>
          <code style={{ fontSize: "11px", wordBreak: "break-all" }}>
            {API_BASE_URL}
          </code>
        </div>

        {/* Botones de prueba */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            type="button"
            onClick={testConnection}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              fontSize: "12px",
              cursor: "pointer",
              flex: 1
            }}
          >
            🔍 Probar Servidor
          </button>
          <button
            type="button"
            onClick={testLoginEndpoint}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              fontSize: "12px",
              cursor: "pointer",
              flex: 1
            }}
          >
            🔐 Probar Login
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#374151", fontWeight: "500" }}>
            Usuario:
          </label>
          <input
            type="text"
            placeholder="Ingresa tu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "2px solid #e2e8f0",
              fontSize: "16px",
              backgroundColor: "#f8fafc",
              transition: "all 0.2s ease",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#6366f1";
              e.target.style.backgroundColor = "#ffffff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = "#f8fafc";
            }}
            required
          />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#374151", fontWeight: "500" }}>
            Contraseña:
          </label>
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "2px solid #e2e8f0",
              fontSize: "16px",
              backgroundColor: "#f8fafc",
              transition: "all 0.2s ease",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#6366f1";
              e.target.style.backgroundColor = "#ffffff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = "#f8fafc";
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: loading ? "#a0aec0" : "#6366f1",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            marginBottom: "15px",
          }}
        >
          {loading ? "⏳ Conectando..." : "🚀 Iniciar Sesión"}
        </button>

        {error && (
          <div
            style={{
              marginTop: "10px",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: error.includes("✅") ? "#d1fae5" : "#fee2e2",
              border: `1px solid ${error.includes("✅") ? "#a7f3d0" : "#fecaca"}`,
              whiteSpace: 'pre-line'
            }}
          >
            <p
              style={{
                color: error.includes("✅") ? "#065f46" : "#dc2626",
                margin: 0,
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Información de debug */}
        <div style={{ 
          marginTop: "15px", 
          padding: "12px", 
          backgroundColor: "#f8fafc", 
          borderRadius: "8px",
          fontSize: "11px",
          color: "#6b7280"
        }}>
          <strong>⚠️ Si persiste el error 404:</strong><br/>
          1. Verifica que el servidor en Render esté funcionando<br/>
          2. Confirma que la ruta /api/login exista<br/>
          3. Revisa la consola del navegador (F12) para más detalles
        </div>
      </form>
    </div>
  );
}