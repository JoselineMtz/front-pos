import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // CAMBIO CRUCIAL: Se ajusta la URL para usar el dominio de Vercel
      const res = await axios.post(
        "https://pos-sales-74qzidk8n-joselinemtzs-projects.vercel.app/api/login",
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
      localStorage.setItem("rol", user.rol); // Se mantiene "rol" para consistencia con tu backend

      alert(message || "Inicio de sesión exitoso");

      if (user.rol === "admin") {
        navigate("/admin");
      } else if (user.rol === "vendedor") {
        navigate("/vendedor");
      } else {
        setError("Rol no reconocido");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "Error en login");
      } else {
        setError("Error de conexión. Asegúrate de que el servidor esté funcionando.");
      }
    } finally {
      setLoading(false);
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

        {error && (
          <div
            style={{
              marginTop: "20px",
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
      </form>
    </div>
  );
}