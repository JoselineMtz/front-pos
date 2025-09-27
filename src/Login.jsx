import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // URL base del backend en Render
  const API_BASE_URL = "https://pos-sales-yo.onrender.com/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/login`,  // ✅ URL CORREGIDA
        {
          username,
          password,
        }
      );

      const { token, user, message } = res.data;

      if (!token || !user?.rol) {
        throw new Error("Respuesta inválida del servidor: Token o rol faltante.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); // Guardar usuario completo
      localStorage.setItem("rol", user.rol);

      alert(message || "Inicio de sesión exitoso");

      // Redirección basada en el rol
      if (user.rol === "admin") {
        navigate("/admin");
      } else if (user.rol === "vendedor") {
        navigate("/vendedor");
      } else {
        // Rol por defecto si no se reconoce
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error en login:", err);
      
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "Error en login");
      } else if (err.message.includes("Network Error") || err.message.includes("Failed to fetch")) {
        setError("Error de conexión. Verifica que el servidor esté funcionando.");
      } else {
        setError("Error inesperado. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Credenciales de prueba para desarrollo
  const fillTestCredentials = (role = "admin") => {
    if (role === "admin") {
      setUsername("admin");
      setPassword("123456");
    } else {
      setUsername("vendedor");
      setPassword("123456");
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
          width: 380,
          padding: 35,
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 28,
            color: "#1f2937",
            fontSize: "28px",
            fontWeight: "600",
            letterSpacing: "-0.5px",
          }}
        >
          Iniciar Sesión
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Usuario"
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
          <input
            type="password"
            placeholder="Contraseña"
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
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        {/* Botones de prueba para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              type="button"
              onClick={() => fillTestCredentials("admin")}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #10b981",
                backgroundColor: "#ecfdf5",
                color: "#047857",
                fontSize: "12px",
                cursor: "pointer",
                flex: 1
              }}
            >
              Admin Test
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials("vendedor")}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #3b82f6",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                fontSize: "12px",
                cursor: "pointer",
                flex: 1
              }}
            >
              Vendedor Test
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "10px",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
            }}
          >
            <p
              style={{
                color: "#dc2626",
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

        {/* Información de conexión */}
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
            Conectado a: {API_BASE_URL}
          </p>
        </div>
      </form>
    </div>
  );
}