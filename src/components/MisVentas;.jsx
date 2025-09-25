import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoneyBillWave, FaBoxOpen, FaChartLine, FaClock, FaCoins, FaUser, FaBuilding, FaIdCard, FaChartBar, FaTimesCircle, FaPhoneAlt, FaExclamationTriangle } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './MisVentas.css';

const MisVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [detallesVenta, setDetallesVenta] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [estadisticas, setEstadisticas] = useState({});
  const [chartData, setChartData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [showDeudaModal, setShowDeudaModal] = useState(false);
  const [clientesConDeuda, setClientesConDeuda] = useState([]);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [requiredPermission, setRequiredPermission] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Obtener token y configurar headers
  const getConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Manejo de token ausente
      throw new Error('No hay token de autenticación');
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // Obtener información del usuario desde el token
  const getUserFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      }
    } catch (error) {
      console.error('Error al decodificar token:', error);
    }
    return null;
  };

  useEffect(() => {
    const user = getUserFromToken();
    setCurrentUser(user);
    fetchVentas();
  }, [filtroFecha]);

  // Modal de permisos insuficientes
  const PermissionDeniedModal = ({ show, onClose, requiredPermission, currentUser }) => {
    if (!show) return null;

    const permissionMessages = {
      can_view_sales: "ver ventas",
      can_create_sales: "crear ventas",
      can_view_reports: "ver reportes"
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content permission-modal">
          <div className="permission-modal-header">
            <h3><FaExclamationTriangle /> Permisos Insuficientes</h3>
          </div>
          <div className="permission-modal-body">
            <p>Lo sentimos, <strong>{currentUser?.username || 'Usuario'}</strong>.</p>
            <p>No tienes permisos para <strong>{permissionMessages[requiredPermission] || "acceder a las ventas"}</strong>.</p>
            <p className="permission-help-text">
              Tu rol actual: <strong>{currentUser?.rol || 'No definido'}</strong>
            </p>
            <p className="permission-help-text">
              Contacta al administrador del sistema para solicitar los permisos necesarios.
            </p>
          </div>
          <div className="permission-modal-footer">
            <button className="button confirm-button" onClick={onClose}>
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  };

  const formatFecha = (fecha) => new Date(fecha).toLocaleString('es-CL');
  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

  // Función para manejar errores de permisos
  const handlePermissionError = (error, requiredPermission) => {
    if (error.response?.status === 403) {
      setRequiredPermission(requiredPermission);
      setShowPermissionModal(true);
      return true;
    }
    return false;
  };

  // Función para manejar errores generales
  const handleError = (error, defaultMessage) => {
    console.error('Error:', error);
    
    if (error.response?.status === 401) {
      setErrorMessage('Sesión expirada. Por favor, inicia sesión nuevamente.');
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 3000);
      return;
    }
    
    if (error.response?.status === 403) {
      setErrorMessage('No tienes permisos para realizar esta acción.');
      return;
    }

    setErrorMessage(error.response?.data?.message || defaultMessage);
  };

  const fetchVentas = async () => {
    try {
      setCargando(true);
      setErrorMessage('');
      const config = getConfig();
      const response = await axios.get('http://localhost:4000/api/sales', config);
      
      let ventasFiltradas = response.data;

      // Filtrar por fecha
      const hoy = new Date();
      switch (filtroFecha) {
        case 'hoy':
          ventasFiltradas = ventasFiltradas.filter(v => new Date(v.fecha).toDateString() === hoy.toDateString());
          break;
        case 'semana':
          const hace7Dias = new Date(); 
          hace7Dias.setDate(hoy.getDate() - 7);
          ventasFiltradas = ventasFiltradas.filter(v => new Date(v.fecha) >= hace7Dias);
          break;
        case 'mes':
          const hace30Dias = new Date(); 
          hace30Dias.setDate(hoy.getDate() - 30);
          ventasFiltradas = ventasFiltradas.filter(v => new Date(v.fecha) >= hace30Dias);
          break;
        default:
          break;
      }

      setVentas(ventasFiltradas);
      await calcularGananciasYEstadisticas(ventasFiltradas);

    } catch (error) {
      if (!handlePermissionError(error, 'can_view_sales')) {
        handleError(error, 'Error al cargar ventas');
      }
    } finally {
      setCargando(false);
    }
  };

  const calcularGananciasYEstadisticas = async (ventasFiltradas) => {
    if (ventasFiltradas.length === 0) {
      setEstadisticas({
        totalVentas: 0,
        totalVentasCount: 0,
        totalDeuda: 0,
        promedioVenta: 0,
        gananciasTotales: 0,
      });
      setChartData([]);
      setTopProductsData([]);
      return;
    }

    let gananciasTotales = 0;
    const detallesPromises = ventasFiltradas.map(venta => {
      try {
        const config = getConfig();
        return axios.get(`http://localhost:4000/api/sales/${venta.id}/detalles`, config);
      } catch (error) {
        console.error(`Error al obtener detalles de venta ${venta.id}:`, error);
        return Promise.reject(error);
      }
    });

    const chartDataMap = {};
    const productSalesMap = {};

    try {
      const detallesResponses = await Promise.allSettled(detallesPromises);

      detallesResponses.forEach((response, index) => {
        if (response.status === 'fulfilled') {
          const venta = ventasFiltradas[index];
          const fecha = new Date(venta.fecha).toLocaleDateString('es-CL');
          const totalVenta = parseFloat(venta.total) || 0;
          let gananciaVenta = 0;

          response.value.data.forEach(d => {
            const precio = parseFloat(d.precio) || 0;
            const costo = parseFloat(d.purchase_price) || 0;
            const cantidad = parseFloat(d.cantidad) || 0;
            gananciaVenta += (precio - costo) * cantidad;

            const productoNombre = d.producto_nombre;
            if (!productSalesMap[productoNombre]) {
              productSalesMap[productoNombre] = { name: productoNombre, vendidos: 0 };
            }
            productSalesMap[productoNombre].vendidos += cantidad;
          });
          
          gananciasTotales += gananciaVenta;

          if (!chartDataMap[fecha]) {
            chartDataMap[fecha] = { fecha, totalVentas: 0, totalGanancias: 0 };
          }
          chartDataMap[fecha].totalVentas += totalVenta;
          chartDataMap[fecha].totalGanancias += gananciaVenta;
        }
      });
      
      const totalVentas = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
      const totalCount = ventasFiltradas.length;
      const totalDeuda = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.deuda || 0), 0);

      setEstadisticas({
        totalVentas,
        totalVentasCount: totalCount,
        totalDeuda,
        promedioVenta: totalCount > 0 ? totalVentas / totalCount : 0,
        gananciasTotales,
      });

      setChartData(Object.values(chartDataMap));

      const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.vendidos - a.vendidos);
      setTopProductsData(sortedProducts.slice(0, 5));

    } catch (err) {
      console.error('Error al calcular ganancias y estadísticas:', err);
    }
  };

  const verDetallesVenta = async (venta) => {
    try {
      setVentaSeleccionada(venta);
      const config = getConfig();
      const response = await axios.get(`http://localhost:4000/api/sales/${venta.id}/detalles`, config);
      setDetallesVenta(response.data);
    } catch (error) {
      if (!handlePermissionError(error, 'can_view_sales')) {
        handleError(error, 'Error al cargar detalles de la venta');
      }
    }
  };
  
  // ✅ Función mejorada para registrar el pago de deuda
  const registrarPagoDeuda = async () => {
    if (!ventaSeleccionada) return;
    
    const inputElement = document.getElementById('input-deuda');
    const montoPago = parseFloat(inputElement.value) || 0;
    
    // Validaciones
    if (montoPago <= 0) {
      setErrorMessage('❌ Ingresa un monto válido para el pago');
      return;
    }
    
    const deudaActual = parseFloat(ventaSeleccionada.deuda) || 0;
    
    if (montoPago > deudaActual) {
      setErrorMessage(`❌ El monto no puede exceder la deuda de ${formatPrice(deudaActual)}`);
      return;
    }
    
    if (deudaActual <= 0) {
      setErrorMessage('❌ Esta venta no tiene deuda pendiente');
      return;
    }
    
    try {
      const config = getConfig();
      
      const response = await axios.post(
        `http://localhost:4000/api/sales/${ventaSeleccionada.id}/pagar-deuda`, 
        { monto: montoPago }, 
        config
      );

      console.log("✅ Pago registrado exitosamente:", response.data);

      const { deuda_actualizada, pago_registrado } = response.data;
      
      // Actualizar la lista de ventas
      setVentas(prevVentas =>
        prevVentas.map(v => 
          v.id === ventaSeleccionada.id ? { ...v, deuda: deuda_actualizada } : v
        )
      );

      // Actualizar la venta seleccionada para el modal
      setVentaSeleccionada(prev => ({ 
        ...prev, 
        deuda: deuda_actualizada 
      }));
      
      // Actualizar las estadísticas
      setEstadisticas(prev => ({
        ...prev,
        totalDeuda: prev.totalDeuda - pago_registrado
      }));

      // Limpiar input y mostrar mensaje de éxito
      inputElement.value = '';
      
      // ✅ CORRECCIÓN: usar 'let' para permitir la reasignación con +=
      let mensajeExito = `✅ Pago de ${formatPrice(pago_registrado)} registrado exitosamente. `;
      mensajeExito += `Deuda restante: ${formatPrice(deuda_actualizada)}`;
      
      setErrorMessage(mensajeExito);
      
      // Cerrar el modal después de 3 segundos
      setTimeout(() => {
        setErrorMessage('');
        setVentaSeleccionada(null); // Cerrar modal
      }, 3000);

    } catch (error) {
      console.error('❌ Error detallado al registrar pago:', error);
      
      if (error.response?.status === 403) {
        setRequiredPermission('can_create_sales');
        setShowPermissionModal(true);
      } else {
        const errorMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        'Error al registrar pago de deuda';
        setErrorMessage(`❌ ${errorMsg}`);
      }
    }
  };

  const handleDeudaClick = async () => {
    try {
      const config = getConfig();
      const response = await axios.get(`http://localhost:4000/api/clientes/con-deuda?filtro=${filtroFecha}`, config);
      setClientesConDeuda(response.data);
      setShowDeudaModal(true);
    } catch (error) {
      if (!handlePermissionError(error, 'can_view_customers')) {
        handleError(error, 'No se pudo cargar la lista de clientes con deuda');
      }
    }
  };

  const ChartSection = () => {
    const hasChartData = chartData && chartData.length > 0;
    const hasTopProductsData = topProductsData && topProductsData.length > 0;

    if (!hasChartData && !hasTopProductsData) {
      return (
        <div className="no-chart-data">
          <p>No hay datos suficientes para generar gráficos de ventas.</p>
        </div>
      );
    }

    const formatTooltip = (value, name) => {
      if (name === 'Ventas' || name === 'Ganancias') {
        return formatPrice(value);
      }
      return value;
    };
    
    return (
      <div className="charts-grid-container">
        {hasChartData && (
          <div className="chart-container">
            <h3>Tendencia de Ventas y Ganancias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis tickFormatter={(value) => formatPrice(value).slice(0, -3)} />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Line type="monotone" dataKey="totalVentas" name="Ventas" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="totalGanancias" name="Ganancias" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasTopProductsData && (
          <div className="chart-container">
            <h3>Productos más vendidos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="vendidos" name="Unidades Vendidas" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  if (cargando) return <div className="cargando">Cargando ventas...</div>;

  return (
    <div className="mis-ventas-container">
      {/* Header de errores */}
      {errorMessage && (
        <div className="error-message">
          <FaExclamationTriangle /> {errorMessage}
        </div>
      )}

      <div className="ventas-header">
        <h2><FaMoneyBillWave /> Mis Ventas</h2>
        <div className="user-info">
          <span>Usuario: {currentUser?.username || 'No identificado'}</span>
          <span>Rol: {currentUser?.rol || 'No definido'}</span>
        </div>
        <div className="filtros">
          {['hoy','semana','mes','todos'].map(f => (
            <button 
              key={f} 
              className={filtroFecha===f ? 'active':''} 
              onClick={()=>setFiltroFecha(f)}
            >
              {f==='hoy'?'Hoy':f==='semana'?'Esta Semana':f==='mes'?'Este Mes':'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="estadisticas-grid">
        <div className="estadistica-card">
          <div className="estadistica-icon"><FaMoneyBillWave/></div>
          <div className="estadistica-info">
            <h3>Total Ventas</h3>
            <p className="estadistica-valor">{formatPrice(estadisticas.totalVentas)}</p>
          </div>
        </div>
        <div className="estadistica-card">
          <div className="estadistica-icon"><FaBoxOpen/></div>
          <div className="estadistica-info">
            <h3>N° de Ventas</h3>
            <p className="estadistica-valor">{estadisticas.totalVentasCount}</p>
          </div>
        </div>
        <div className="estadistica-card">
          <div className="estadistica-icon"><FaChartLine/></div>
          <div className="estadistica-info">
            <h3>Promedio por Venta</h3>
            <p className="estadistica-valor">{formatPrice(estadisticas.promedioVenta)}</p>
          </div>
        </div>
        <div className="estadistica-card" onClick={handleDeudaClick} style={{ cursor: 'pointer' }}>
          <div className="estadistica-icon"><FaClock/></div>
          <div className="estadistica-info">
            <h3>Deuda Pendiente</h3>
            <p className="estadistica-valor deuda">{formatPrice(estadisticas.totalDeuda)}</p>
          </div>
        </div>
        <div className="estadistica-card">
          <div className="estadistica-icon"><FaCoins/></div>
          <div className="estadistica-info">
            <h3>Ganancias</h3>
            <p className="estadistica-valor">{formatPrice(estadisticas.gananciasTotales)}</p>
          </div>
        </div>
      </div>
      
      <button className="button-toggle-charts" onClick={() => setShowCharts(!showCharts)}>
        <FaChartBar /> {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
      </button>

      {showCharts ? (
        <ChartSection />
      ) : (
        <div className="ventas-section">
          <h3>Ventas del {filtroFecha==='hoy'?'Día':filtroFecha==='semana'?'Semana':filtroFecha==='mes'?'Mes':'Total'}</h3>
          {ventas.length === 0 ? (
            <div className="sin-ventas">
              <p>No hay ventas registradas para este período.</p>
            </div>
          ) : (
            <div className="ventas-lista">
              {ventas.map(v => (
                <div key={v.id} className="venta-tarjeta" onClick={()=>verDetallesVenta(v)}>
                  <div className="venta-header">
                    <span className="venta-numero">Venta #{v.id}</span>
                    <span className="venta-fecha">{formatFecha(v.fecha)}</span>
                  </div>
                  <div className="venta-info">
                    <div className="venta-monto">
                      <strong>{formatPrice(v.total)}</strong>
                      <span className={`metodo-pago ${v.metodo_pago.toLowerCase()}`}>{v.metodo_pago}</span>
                    </div>
                    {v.cliente_nombre && <div className="venta-cliente"><FaUser/> {v.cliente_nombre}</div>}
                    {v.deuda > 0 && <div className="venta-deuda">⚠️ Deuda: {formatPrice(v.deuda)}</div>}
                    {v.metodo_pago === 'Transferencia' && v.titular_transferencia && (
                      <div className="venta-transferencia-info">
                        <FaIdCard/> {v.titular_transferencia} - {v.banco_transferencia}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de detalles de venta */}
      {ventaSeleccionada && (
        <div className="modal-overlay" onClick={()=>setVentaSeleccionada(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles Venta #{ventaSeleccionada.id}</h3>
              <button className="cerrar-modal" onClick={()=>setVentaSeleccionada(null)}>×</button>
            </div>

            <div className="venta-detalles">
              <div className="detalle-grid">
                <div className="detalle-item"><label>Fecha:</label> <span>{formatFecha(ventaSeleccionada.fecha)}</span></div>
                <div className="detalle-item"><label>Total:</label> <span>{formatPrice(ventaSeleccionada.total)}</span></div>
                <div className="detalle-item"><label>Recibido:</label> <span>{formatPrice(ventaSeleccionada.recibido)}</span></div>
                <div className="detalle-item"><label>Cambio:</label> <span>{formatPrice(ventaSeleccionada.cambio)}</span></div>
                <div className="detalle-item"><label>Método:</label> <span className={`metodo-pago ${ventaSeleccionada.metodo_pago.toLowerCase()}`}>{ventaSeleccionada.metodo_pago}</span></div>
                
                {ventaSeleccionada.metodo_pago === 'Transferencia' && ventaSeleccionada.titular_transferencia && (
                  <>
                    <div className="detalle-item transferencia-info">
                      <label><FaIdCard /> Titular:</label> 
                      <span>{ventaSeleccionada.titular_transferencia}</span>
                    </div>
                    <div className="detalle-item transferencia-info">
                      <label><FaBuilding /> Banco:</label> 
                      <span>{ventaSeleccionada.banco_transferencia}</span>
                    </div>
                  </>
                )}

                {ventaSeleccionada.deuda > 0 && (
                  <div className="detalle-item"><label>Deuda pendiente:</label> <span>{formatPrice(ventaSeleccionada.deuda)}</span></div>
                )}
              </div>

              {ventaSeleccionada.deuda > 0 && (
                <div className="pago-deuda">
                  <input
                    type="number"
                    min="0"
                    max={ventaSeleccionada.deuda}
                    step="1"
                    id="input-deuda"
                    placeholder="Monto a pagar"
                    className="input-deuda"
                  />
                  <button className="btn-registrar-pago" onClick={registrarPagoDeuda}>
                    Registrar Pago
                  </button>
                </div>
              )}

              <h4>Productos vendidos:</h4>
              <div className="productos-lista">
                {detallesVenta.map(d => {
                  const precio = parseFloat(d.precio) || 0;
                  const costo = parseFloat(d.purchase_price) || 0;
                  const cantidad = parseFloat(d.cantidad) || 0;
                  const gananciaProducto = (precio - costo) * cantidad;

                  return (
                    <div key={d.id} className="producto-item">
                      <div className="producto-info">
                        <span className="producto-nombre">{d.producto_nombre}</span>
                        <span className="producto-sku">SKU: {d.sku}</span>
                      </div>
                      <div className="producto-precios">
                        <span>{cantidad} × {formatPrice(precio)}</span>
                        <span>Total: {formatPrice(cantidad*precio)}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="producto-total-general">
                  <strong>Ganancia total neta: {formatPrice(
                    detallesVenta.reduce((sum,d) => sum + ((parseFloat(d.precio)-parseFloat(d.purchase_price))*parseFloat(d.cantidad)),0) - parseFloat(ventaSeleccionada.deuda || 0)
                  )}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de clientes con deuda */}
      {showDeudaModal && (
        <div className="modal-overlay" onClick={() => setShowDeudaModal(false)}>
          <div className="modal-content modal-deuda" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaClock /> Clientes con Deuda Pendiente</h3>
              <button className="cerrar-modal" onClick={() => setShowDeudaModal(false)}><FaTimesCircle /></button>
            </div>
            <div className="modal-body">
              {clientesConDeuda.length === 0 ? (
                <p>¡No hay clientes con deudas pendientes para este período!</p>
              ) : (
                <div className="lista-deuda">
                  {clientesConDeuda.map(cliente => (
                    <div key={cliente.id} className="cliente-deuda-item">
                      <div className="cliente-info-deuda">
                        <div className="cliente-nombre-deuda">
                          <FaUser /> <strong>{cliente.nombre}</strong>
                        </div>
                        <div className="cliente-rut-deuda">
                          <FaIdCard /> {cliente.rut || 'No especificado'}
                        </div>
                        <div className="cliente-telefono-deuda">
                          <FaPhoneAlt /> {cliente.telefono || 'No especificado'}
                        </div>
                      </div>
                      <div className="cliente-monto-deuda">
                        <FaCoins /> {formatPrice(cliente.saldo_pendiente)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de permisos insuficientes */}
      <PermissionDeniedModal
        show={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        requiredPermission={requiredPermission}
        currentUser={currentUser}
      />
    </div>
  );
};

export default MisVentas;