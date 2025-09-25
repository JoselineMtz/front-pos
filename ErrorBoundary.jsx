import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Actualiza el estado para que el siguiente renderizado muestre la interfaz de fallback.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Puedes también registrar el error en un servicio de reporte de errores
        console.error("Error no capturado por el límite de error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Puedes renderizar cualquier UI de fallback personalizada
            return <h1>¡Algo salió mal! Por favor, recarga la página.</h1>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;