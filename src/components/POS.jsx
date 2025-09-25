import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './Pos.module.css';

// Configuración de axios para este componente
const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000/api'
});

// Interceptor para agregar el token automáticamente
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y permisos
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rol');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const POS = () => {
  const [scannedSku, setScannedSku] = useState('');
  const [saleItems, setSaleItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [received, setReceived] = useState('');
  const [change, setChange] = useState(0);
  const [debt, setDebt] = useState(0);
  const [changeClass, setChangeClass] = useState(styles.zeroChange);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState('');

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [productToWeigh, setProductToWeigh] = useState(null);
  const [weightInput, setWeightInput] = useState('');

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerData, setCustomerData] = useState({ rut: '', nombre: '', telefono: '', email: '', direccion: '' });
  const [clienteExistente, setClienteExistente] = useState(null);
  const [customerError, setCustomerError] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({ titular: '', banco: '' });
  const [transferError, setTransferError] = useState('');

  const [productError, setProductError] = useState('');
  const [insufficientStockData, setInsufficientStockData] = useState(null);

  // Estados para permisos
  const [userPermissions, setUserPermissions] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [requiredPermission, setRequiredPermission] = useState('');

  const skuInputRef = useRef(null);

  useEffect(() => skuInputRef.current?.focus(), []);

  // Obtener información del usuario y permisos
  useEffect(() => {
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

    const user = getUserFromToken();
    setCurrentUser(user);
    
    // Permisos por defecto según el rol
    const getDefaultPermissionsByRole = (rol) => {
      if (rol === 'admin') {
        return {
          can_view_products: true,
          can_edit_products: true,
          can_delete_products: true,
          can_create_products: true,
          can_view_sales: true,
          can_create_sales: true,
          can_view_customers: true,
          can_edit_customers: true,
          can_view_reports: true,
          can_manage_stock: true
        };
      }
      
      // Permisos por defecto para vendedores
      return {
        can_view_products: true,
        can_edit_products: false,
        can_delete_products: false,
        can_create_products: false,
        can_view_sales: true,
        can_create_sales: true,
        can_view_customers: true,
        can_edit_customers: false,
        can_view_reports: false,
        can_manage_stock: false
      };
    };

    if (user) {
      const permissions = getDefaultPermissionsByRole(user.rol);
      setUserPermissions(permissions);
      
      // Verificar permiso para crear ventas
      if (!permissions.can_create_sales) {
        setRequiredPermission('can_create_sales');
        setShowPermissionModal(true);
      }
    }
  }, []);

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    if (currentUser?.rol === 'admin') return true;
    return userPermissions ? userPermissions[permission] === true : false;
  };

  // Modal de permisos insuficientes
  const PermissionDeniedModal = () => {
    if (!showPermissionModal) return null;

    const permissionMessages = {
      can_view_products: "ver productos",
      can_edit_products: "editar productos",
      can_delete_products: "eliminar productos",
      can_create_products: "crear productos",
      can_view_sales: "ver ventas",
      can_create_sales: "crear ventas",
      can_view_customers: "ver clientes",
      can_edit_customers: "editar clientes",
      can_view_reports: "ver reportes",
      can_manage_stock: "gestionar stock"
    };

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.permissionModalHeader}>
            <h3>❌ Permisos Insuficientes</h3>
          </div>
          <div className={styles.permissionModalBody}>
            <p>Lo sentimos, <strong>{currentUser?.username || 'Usuario'}</strong>.</p>
            <p>No tienes permisos para <strong>{permissionMessages[requiredPermission] || "realizar esta acción"}</strong>.</p>
            <p className={styles.permissionHelpText}>
              Tu rol actual: <strong>{currentUser?.rol || 'No definido'}</strong>
            </p>
            <p className={styles.permissionHelpText}>
              Contacta al administrador del sistema para solicitar los permisos necesarios.
            </p>
          </div>
          <div className={styles.modalButtons}>
            <button 
              className={styles.button} 
              onClick={() => setShowPermissionModal(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const newTotal = saleItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    setTotal(newTotal);
  }, [saleItems]);

  useEffect(() => {
    const totalValue = parseFloat(total);
    const receivedValue = parseFloat(received);
    if (!isNaN(totalValue) && !isNaN(receivedValue)) {
      const calculatedChange = receivedValue - totalValue;
      setChange(calculatedChange);
      if (calculatedChange > 0) {
        setChangeClass(styles.positiveChange);
        setDebt(0);
      } else if (calculatedChange < 0) {
        setChangeClass(styles.negativeChange);
        setDebt(Math.abs(calculatedChange));
      } else {
        setChangeClass(styles.zeroChange);
        setDebt(0);
      }
    } else {
      setChange(0);
      setChangeClass(styles.zeroChange);
      setDebt(0);
    }
  }, [total, received]);

  useEffect(() => {
    const buscarCliente = async () => {
      // Verificar permiso para ver clientes
      if (!hasPermission('can_view_customers')) return;

      // Solo buscar si el RUT tiene al menos 8 caracteres (incluyendo puntos y guión)
      if (customerData.rut.trim().length >= 8) {
        try {
          const res = await axiosInstance.get(`/clientes/rut/${customerData.rut}`);
          setClienteExistente(res.data);
        } catch {
          setClienteExistente(null);
        }
      } else {
        setClienteExistente(null);
      }
    };
    const timeoutId = setTimeout(buscarCliente, 500);
    return () => clearTimeout(timeoutId);
  }, [customerData.rut]);

  const handleSkuScan = async (e) => {
    if (e.key !== 'Enter' || isProcessing || scannedSku.trim() === '') return;
    e.preventDefault();
    
    // Verificar permiso para ver productos
    if (!hasPermission('can_view_products')) {
      setRequiredPermission('can_view_products');
      setShowPermissionModal(true);
      return;
    }

    setIsProcessing(true);
    setProductError('');

    try {
      const { data: product } = await axiosInstance.get(`/stock/products/by-sku/${scannedSku}`);

      if (!product.stock || product.stock <= 0) {
        setProductError(`Producto "${scannedSku}" agotado.`);
      } else if (['kg', 'kilos'].includes(product.stock_unit.toLowerCase())) {
        setProductToWeigh(product);
        setShowWeightModal(true);
      } else {
        const index = saleItems.findIndex(item => item.sku === product.sku);
        const cantidadDeseada = 1;
        if (index > -1) {
          if (saleItems[index].quantity + cantidadDeseada > product.stock) {
            setInsufficientStockData({ product, requested: saleItems[index].quantity + cantidadDeseada, available: product.stock });
          } else {
            const updated = [...saleItems];
            updated[index].quantity += cantidadDeseada;
            setSaleItems(updated);
          }
        } else {
          if (cantidadDeseada > product.stock) {
            setInsufficientStockData({ product, requested: cantidadDeseada, available: product.stock });
          } else {
            setSaleItems(prev => [...prev, { ...product, quantity: cantidadDeseada, purchase_price: product.purchase_price }]);
          }
        }
      }
    } catch {
      setProductError(`Producto con SKU "${scannedSku}" no encontrado.`);
    } finally {
      setScannedSku('');
      setIsProcessing(false);
    }
  };

  const handleWeightSubmit = () => {
    const weight = parseFloat(weightInput);
    if (!isNaN(weight) && weight > 0) {
      const quantityKg = weight / 1000;
      if (quantityKg > productToWeigh.stock) {
        setInsufficientStockData({ product: productToWeigh, requested: quantityKg, available: productToWeigh.stock });
        return;
      }
      setSaleItems(prev => [...prev, { ...productToWeigh, quantity: quantityKg, purchase_price: productToWeigh.purchase_price }]);
      setShowWeightModal(false);
      setProductToWeigh(null);
      setWeightInput('');
    } else {
      setProductError('Peso inválido. Ingrese un número mayor que 0.');
    }
  };

  const handleWeightCancel = () => {
    setShowWeightModal(false);
    setProductToWeigh(null);
    setWeightInput('');
  };

  const registerSaleInDatabase = async (saleData) => {
    try {
      // Verificar permiso para crear ventas
      if (!hasPermission('can_create_sales')) {
        setRequiredPermission('can_create_sales');
        setShowPermissionModal(true);
        return false;
      }

      const res = await axiosInstance.post('/sales', {
        total: saleData.total,
        recibido: saleData.received,
        cambio: saleData.change,
        metodo_pago: saleData.paymentMethod,
        cliente_id: saleData.customer?.id || null,
        deuda: saleData.debt,
        user_id: currentUser?.id || 1,
        transfer: saleData.transfer || null,
        items: saleData.items.map(i => ({
          producto_id: i.id,
          cantidad: i.quantity,
          precio: i.price,
          ganancia: (i.price - i.purchase_price) * i.quantity
        }))
      });

      return res.data.success;
    } catch (error) {
      console.error("Error registrar venta:", error);
      
      // Manejar errores de permisos específicos
      if (error.response?.status === 403) {
        setRequiredPermission('can_create_sales');
        setShowPermissionModal(true);
      } else {
        setProductError('Error al registrar la venta. Verifique la conexión.');
      }
      
      return false;
    }
  };

  const handleRegisterSale = async () => {
    // Verificar permiso para crear ventas
    if (!hasPermission('can_create_sales')) {
      setRequiredPermission('can_create_sales');
      setShowPermissionModal(true);
      return;
    }

    if (saleItems.length === 0) {
      setProductError('No hay productos en la venta.');
      return;
    }

    if (paymentMethod === 'Transferencia') {
      setShowTransferModal(true);
      return;
    }

    const finalChange = parseFloat(received) - parseFloat(total);
    if (finalChange < 0) {
      // Verificar permiso para editar clientes si hay deuda
      if (!hasPermission('can_edit_customers')) {
        setRequiredPermission('can_edit_customers');
        setShowPermissionModal(true);
        return;
      }
      setShowCustomerModal(true);
    } else {
      const saleRecord = { 
        items: saleItems, 
        total, 
        received: parseFloat(received), 
        change: finalChange, 
        paymentMethod, 
        debt: 0, 
        transfer: null 
      };
      const success = await registerSaleInDatabase(saleRecord);
      if (success) {
        const totalGanancia = saleItems.reduce((sum, item) => sum + (item.price - item.purchase_price) * item.quantity, 0);
        setSummaryMessage(`Venta registrada!\nTotal: ${formatPrice(total)}\nRecibido: ${formatPrice(received)}\nCambio: ${formatPrice(finalChange)}\nGanancia: ${formatPrice(totalGanancia)}`);
        setShowSummaryModal(true);
      } else {
        setProductError('Error al registrar la venta.');
      }
    }
  };

  const handleRegisterCustomer = async () => {
    setCustomerError('');
    
    // Verificar permiso para editar clientes
    if (!hasPermission('can_edit_customers')) {
      setRequiredPermission('can_edit_customers');
      setShowPermissionModal(true);
      return;
    }

    // Solo validar nombre y teléfono, el RUT es opcional
    if (!customerData.nombre || !customerData.telefono) {
      return setCustomerError('Nombre y teléfono son obligatorios.');
    }

    try {
      let customerId = clienteExistente?.id;
      
      // Si no existe el cliente o el RUT está vacío, crear nuevo cliente
      if (!customerId || !customerData.rut.trim()) {
        const payload = { 
          ...customerData, 
          rut: customerData.rut.trim() || null
        };
        const res = await axiosInstance.post('/clientes', payload);
        customerId = res.data.id;
      }

      const finalChange = parseFloat(received) - parseFloat(total);
      const totalGanancia = saleItems.reduce((sum, item) => sum + (item.price - item.purchase_price) * item.quantity, 0);

      const saleRecord = {
        items: saleItems,
        total,
        received: parseFloat(received),
        change: finalChange,
        paymentMethod,
        debt: Math.abs(finalChange),
        customer: { id: customerId, ...customerData }
      };

      const success = await registerSaleInDatabase(saleRecord);

      if (success) {
        setSummaryMessage(`Venta registrada!\nTotal: ${formatPrice(total)}\nRecibido: ${formatPrice(received)}\nSaldo Pendiente: ${formatPrice(Math.abs(finalChange))}\nGanancia: ${formatPrice(totalGanancia)}\nCliente: ${customerData.nombre}`);
        setShowCustomerModal(false);
        setShowSummaryModal(true);
      } else {
        setCustomerError('Error al registrar la venta.');
      }
    } catch (error) {
      console.error('Error al registrar cliente:', error);
      setCustomerError('Error al registrar el cliente. Verifique los datos.');
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferData.titular || !transferData.banco) {
      setTransferError('Nombre y banco son obligatorios.');
      return;
    }

    setShowTransferModal(false);
    setTransferError('');

    const finalChange = parseFloat(received) - parseFloat(total);
    const saleRecord = {
      items: saleItems,
      total,
      received: parseFloat(received),
      change: finalChange,
      paymentMethod,
      debt: 0,
      transfer: { ...transferData }
    };

    const success = await registerSaleInDatabase(saleRecord);
    if (success) {
      const totalGanancia = saleItems.reduce((sum, item) => sum + (item.price - item.purchase_price) * item.quantity, 0);
      setSummaryMessage(`Venta registrada!\nTotal: ${formatPrice(total)}\nRecibido: ${formatPrice(received)}\nCambio: ${formatPrice(finalChange)}\nGanancia: ${formatPrice(totalGanancia)}\nTitular: ${transferData.titular}\nBanco: ${transferData.banco}`);
      setShowSummaryModal(true);
    } else {
      setProductError('Error al registrar la venta.');
    }
  };

  const clearSale = () => {
    setScannedSku('');
    setSaleItems([]);
    setTotal(0);
    setReceived('');
    setChange(0);
    setDebt(0);
    setPaymentMethod('Efectivo');
    setCustomerData({ rut: '', nombre: '', telefono:  '' });
    setClienteExistente(null);
    setCustomerError('');
    setProductError('');
    setTransferData({ titular: '', banco: '' });
    setInsufficientStockData(null);
  };

  const handleCloseModal = () => {
    setShowSummaryModal(false);
    clearSale();
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

  const increaseQuantity = (index) => {
    const updated = [...saleItems];
    if (updated[index].quantity + 1 > updated[index].stock) {
      setInsufficientStockData({ product: updated[index], requested: updated[index].quantity + 1, available: updated[index].stock });
      return;
    }
    updated[index].quantity += 1;
    setSaleItems(updated);
  };

  const decreaseQuantity = (index) => {
    const updated = [...saleItems];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
      setSaleItems(updated);
    } else {
      removeItem(index);
    }
  };

  const removeItem = (index) => {
    const updated = [...saleItems];
    updated.splice(index, 1);
    setSaleItems(updated);
  };

  // Función para cerrar modales haciendo clic fuera
  const handleOverlayClick = (e, closeFunction) => {
    if (e.target === e.currentTarget) {
      closeFunction();
    }
  };

  // Si no tiene permiso para crear ventas, mostrar mensaje de acceso denegado
  if (!hasPermission('can_create_sales')) {
    return (
      <div className={styles.posContainerMain}>
        <div className={styles.posSection}>
          <div className={styles.noAccessContainer}>
            <h3>❌ Acceso Restringido</h3>
            <p>No tienes permisos para acceder al punto de venta.</p>
            <p><strong>Permiso requerido:</strong> can_create_sales</p>
            <p><strong>Tu rol:</strong> {currentUser?.rol || 'No definido'}</p>
            <button 
              className={styles.button} 
              onClick={() => {
                setRequiredPermission('can_create_sales');
                setShowPermissionModal(true);
              }}
            >
              Ver Mis Permisos
            </button>
          </div>
        </div>
        <PermissionDeniedModal />
      </div>
    );
  }

  return (
    <>
      <div className={styles.posContainerMain}>
        <div className={styles.posSection}>
          <h3 className={styles.sectionTitle}>Punto de Venta</h3>
          
       

          <div className={styles.posCardsContainer}>
            {/* Tarjeta Venta */}
            <div className={styles.posCard}>
              <h4>Venta</h4>
              <div className={styles.posItem}>
                <label>Escanear o digitar SKU:</label>
                <input
                  type="text"
                  value={scannedSku}
                  onChange={e => setScannedSku(e.target.value)}
                  onKeyDown={handleSkuScan}
                  placeholder="Escanear o digitar SKU"
                  ref={skuInputRef}
                  disabled={isProcessing || !hasPermission('can_view_products')}
                />
                {!hasPermission('can_view_products') && (
                  <p className={styles.warningText}>No tienes permiso para ver productos</p>
                )}
                {productError && <p className={styles.errorMessage}>{productError}</p>}
              </div>

              <div className={styles.saleItemsList}>
                <h5>Productos en la venta:</h5>
                {saleItems.length === 0 ? (
                  <p>No hay productos agregados.</p>
                ) : (
                  <ul className={styles.saleItems}>
                    {saleItems.map((item, i) => (
                      <li key={i} className={styles.saleItem}>
                        <div className={styles.saleItemInfo}>
                          <span className={styles.productName}>{item.name}</span>
                         
                        </div>
                        <div className={styles.saleItemButtons}>
                          <span className={styles.qtyDisplay}>{item.quantity}</span>
                          <button className={styles.qtyButton} onClick={() => decreaseQuantity(i)}>➖</button>
                          <button className={styles.qtyButton} onClick={() => increaseQuantity(i)}>➕</button>
                          <button className={styles.qtyButton} onClick={() => removeItem(i)}>🗑️</button>
                        </div>
                        <div className={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className={styles.totalDisplay}>
                  <p><strong>Total:</strong> {formatPrice(total)}</p>
                </div>
              </div>

              <button className={styles.button} onClick={clearSale}>Limpiar Venta</button>
            </div>

            {/* Tarjeta Cambio */}
            <div className={styles.posCard}>
              <h4>Calculadora de Cambio</h4>
              <div className={styles.posItem}>
                <label>Total a Pagar:</label>
                <span>{formatPrice(total)}</span>
              </div>
              <div className={styles.posItem}>
                <label>Monto Recibido:</label>
                <input 
                  type="number" 
                  value={received} 
                  onChange={e => setReceived(e.target.value)} 
                  placeholder="0" 
                  min="0" 
                  step="100"
                  disabled={!hasPermission('can_create_sales')}
                />
              </div>
              <div className={styles.posItem}>
                <label>Método de Pago:</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)}
                  disabled={!hasPermission('can_create_sales')}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Credito">Crédito</option>
                </select>
              </div>

              <div className={`${styles.changeDisplayContainer} ${changeClass}`}>
                <p>Cambio: {formatPrice(change)}</p>
              </div>

              {debt > 0 && (
                <div className={styles.debtDisplay}>
                  <p>Saldo Pendiente: {formatPrice(debt)}</p>
                  {!hasPermission('can_edit_customers') && (
                    <p className={styles.warningText}>No tienes permiso para registrar clientes</p>
                  )}
                </div>
              )}

              <button 
                className={styles.button} 
                onClick={handleRegisterSale}
                disabled={!hasPermission('can_create_sales') || saleItems.length === 0}
              >
                Registrar Venta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODALES - FUERA DEL CONTENEDOR PRINCIPAL ==================== */}
      
      {/* Modal Peso */}
      {showWeightModal && (
        <div className={styles.modalOverlay} onClick={(e) => handleOverlayClick(e, handleWeightCancel)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h4>Ingresar peso para {productToWeigh?.name}</h4>
            <input 
              type="number" 
              value={weightInput} 
              onChange={e => setWeightInput(e.target.value)} 
              placeholder="Peso en gramos" 
              className={styles.modalInput}
              autoFocus
            />
            <div className={styles.modalButtons}>
              <button className={styles.button} onClick={handleWeightSubmit}>Aceptar</button>
              <button className={styles.button} onClick={handleWeightCancel}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cliente */}
      {showCustomerModal && (
        <div className={styles.modalOverlay} onClick={(e) => handleOverlayClick(e, () => setShowCustomerModal(false))}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h4>Registrar Cliente (Saldo Pendiente)</h4>
            {customerError && <p className={styles.errorMessage}>{customerError}</p>}
            {clienteExistente && (
              <p className={styles.customerFound}>Cliente encontrado: {clienteExistente.nombre}</p>
            )}
            <input 
              type="text" 
              placeholder="RUT (opcional)" 
              value={customerData.rut} 
              onChange={e => setCustomerData({...customerData, rut: e.target.value})} 
              className={styles.modalInput}
            />
            <input 
              type="text" 
              placeholder="Nombre *" 
              value={customerData.nombre} 
              onChange={e => setCustomerData({...customerData, nombre: e.target.value})} 
              className={styles.modalInput}
              required
            />
            <input 
              type="text" 
              placeholder="Teléfono *" 
              value={customerData.telefono} 
              onChange={e => setCustomerData({...customerData, telefono: e.target.value})} 
              className={styles.modalInput}
              required
            />
            <div className={styles.modalButtons}>
              <button className={styles.button} onClick={handleRegisterCustomer}>
                Guardar y Registrar Venta
              </button>
              <button className={styles.button} onClick={() => setShowCustomerModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transferencia */}
      {showTransferModal && (
        <div className={styles.modalOverlay} onClick={(e) => handleOverlayClick(e, () => setShowTransferModal(false))}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h4>Datos de la cuenta destino</h4>
            {transferError && <p className={styles.errorMessage}>{transferError}</p>}
            <input 
              type="text" 
              placeholder="Nombre del titular" 
              value={transferData.titular} 
              onChange={e => setTransferData({...transferData, titular: e.target.value})} 
              className={styles.modalInput}
            />
            <input 
              type="text" 
              placeholder="Banco" 
              value={transferData.banco} 
              onChange={e => setTransferData({...transferData, banco: e.target.value})} 
              className={styles.modalInput}
            />
            <div className={styles.modalButtons}>
              <button className={styles.button} onClick={handleTransferSubmit}>
                Guardar y Registrar Venta
              </button>
              <button className={styles.button} onClick={() => setShowTransferModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resumen */}
      {showSummaryModal && (
        <div className={styles.modalOverlay} onClick={(e) => handleOverlayClick(e, handleCloseModal)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h4>✅ Venta Registrada Exitosamente</h4>
            <div className={styles.summaryMessage}>
              <pre>{summaryMessage}</pre>
            </div>
            <div className={styles.modalButtons}>
              <button className={styles.button} onClick={handleCloseModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Stock Insuficiente */}
      {insufficientStockData && (
        <div className={styles.modalOverlay} onClick={(e) => handleOverlayClick(e, () => setInsufficientStockData(null))}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h4>⚠️ Stock Insuficiente</h4>
            <p><strong>Producto:</strong> {insufficientStockData.product.name}</p>
            <p><strong>Disponible:</strong> {insufficientStockData.available}</p>
            <p><strong>Solicitado:</strong> {insufficientStockData.requested}</p>
            <div className={styles.modalButtons}>
              <button className={styles.button} onClick={() => setInsufficientStockData(null)}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de permisos insuficientes */}
      <PermissionDeniedModal />
    </>
  );
};

export default POS;