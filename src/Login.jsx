import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // URL de tu backend en Render
  const API_BASE_URL = "https://pos-sales-yo.onrender.com/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/login`,
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
        // Rol por defecto para otros roles
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error en login:", err);
      
      if (axios.isAxiosError(err) && err.response) {
        // Error del servidor (401, 500, etc.)
        if (err.response.status === 401) {
          setError("Usuario o contraseña incorrectos");
        } else if (err.response.status === 400) {
          setError("Datos incompletos: usuario y contraseña son requeridos");
        } else if (err.response.status === 500) {
          setError("Error del servidor. Intenta nuevamente.");
        } else {
          setError(err.response.data.message || `Error ${err.response.status}`);
        }
      } else if (err.code === 'ECONNABORTED') {
        setError("Tiempo de espera agotado. Verifica tu conexión.");
      } else {
        setError("Error de conexión. Verifica que el servidor esté funcionando.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Probar conexión con el servidor
  const testConnection = async () => {
    try {
      setError("🔍 Probando conexión con el servidor...");
      const response = await axios.get(API_BASE_URL.replace('/api', '/health'));
      setError(`✅ Servidor conectado: ${response.data.message}`);
    } catch (err) {
      setError("❌ No se puede conectar al servidor");
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
          width: 400,
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
            letterSpacing: "-0.5px",
          }}
        >
          Iniciar Sesión - POS
        </h2>

        {/* Botón de prueba de conexión */}
        <button
          type="button"
          onClick={testConnection}
          style={{
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#e5e7eb";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#f3f4f6";
          }}
        >
          🔍 Probar Conexión con Servidor
        </button>

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
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#4f46e5";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 6px 16px rgba(79, 70, 229, 0.4)";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#6366f1";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
            }
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
            }}
          >
            <p
              style={{
                color: error.includes("✅") ? "#065f46" : "#dc2626",
                margin: 0,
                fontSize: "14px",
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Información del sistema */}
        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px 0", textAlign: "center" }}>
            <strong>Sistema POS - Base de Datos Real</strong>
          </p>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: 0, textAlign: "center" }}>
            Conectado a: {API_BASE_URL}
          </p>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: "8px 0 0 0", textAlign: "center" }}>
            Usa las credenciales de tu base de datos PostgreSQL
          </p>
        </div>
      </form>
    </div>
  );
}