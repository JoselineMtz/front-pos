import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ✅ Define la URL de tu API en un solo lugar.
//    Crea un archivo .env en la raíz de tu proyecto frontend con:
//    VITE_API_URL=https://tu-backend.onrender.com
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';


const SuperStock = () => {
  // Se recomienda obtener el ID del usuario del token decodificado o de un contexto de autenticación
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id || 1;
  const localStorageKey = `superstock_temp_products_${currentUserId}`;

  // Estados del componente
  const [categories, setCategories] = useState([]);
  const [addedProducts, setAddedProducts] = useState(() => {
    try {
      const stored = localStorage.getItem(localStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al leer productos temporales de localStorage:', error);
      return [];
    }
  });
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', description: '', stock: 0, stockUnit: 'Unidad', categoria_id: null, price: 0
  });
  const [existingProduct, setExistingProduct] = useState(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [profitPercentage, setProfitPercentage] = useState('');
  const [calculatedProfitPercentage, setCalculatedProfitPercentage] = useState('');
  const [calculationMode, setCalculationMode] = useState('price');
  const [message, setMessage] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Configuración de Axios con token de autenticación
  const token = localStorage.getItem('token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // 🔹 Guardar productos en localStorage cada vez que `addedProducts` cambie
  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(addedProducts));
  }, [addedProducts, localStorageKey]);

  // 🔹 Traer categorías al iniciar
  useEffect(() => {
    if (!token) {
      setMessage({ text: 'No estás autenticado. Por favor, inicia sesión.', type: 'error' });
      return;
    }
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/stock/categories`, config);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setMessage({ text: 'Error al cargar categorías. Verifica tu conexión y permisos.', type: 'error' });
      }
    };
    fetchCategories();
  }, [token]);

  // 🔹 Buscar producto por SKU en la base de datos
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (newProduct.sku.trim() === '') {
        setExistingProduct(null);
        return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/stock/products/by-sku/${newProduct.sku}`, config);
        const product = response.data;
        setExistingProduct(product);
        setNewProduct(prev => ({
          ...prev,
          name: product.name,
          description: product.description,
          stock: 0,
          stockUnit: product.stock_unit,
          categoria_id: product.categoria_id,
          price: product.price
        }));
        setPurchasePrice(product.purchase_price || '');
        setMessage({ text: `Producto '${product.name}' encontrado. Se actualizará el stock.`, type: 'info' });
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setExistingProduct(null);
          // No limpiar el formulario para que el usuario pueda crear uno nuevo
          setMessage({ text: 'SKU no encontrado. Se creará como un producto nuevo.', type: 'info' });
        } else {
          console.error('Error buscando producto:', error);
          setMessage({ text: 'Error al buscar producto.', type: 'error' });
        }
      }
    }, 500);

    setSearchTimeout(timeout);
  }, [newProduct.sku, token]);

  // 🔹 Calculadora de precios
  useEffect(() => {
    const price = parseFloat(purchasePrice);
    if (calculationMode === 'price') {
      const profit = parseFloat(profitPercentage);
      if (!isNaN(price) && !isNaN(profit)) {
        setNewProduct(prev => ({ ...prev, price: price * (1 + profit / 100) }));
      }
    } else {
      const salePrice = parseFloat(newProduct.price);
      if (!isNaN(price) && !isNaN(salePrice) && price > 0) {
        setCalculatedProfitPercentage((((salePrice - price) / price) * 100).toFixed(2));
      } else {
        setCalculatedProfitPercentage('');
      }
    }
  }, [purchasePrice, profitPercentage, newProduct.price, calculationMode]);
  
  // Resetea el formulario y los campos relacionados
  const resetForm = () => {
    setNewProduct({ sku: '', name: '', description: '', stock: 0, stockUnit: 'Unidad', categoria_id: null, price: 0 });
    setPurchasePrice('');
    setProfitPercentage('');
    setCalculatedProfitPercentage('');
    setExistingProduct(null);
    document.querySelector('input[placeholder="SKU (Buscará automáticamente)"]').focus();
  };

  // 🔹 Agregar producto a la lista temporal
  const handleAddProduct = () => {
    if (!newProduct.sku || !newProduct.name || !newProduct.stock || !purchasePrice) {
      setMessage({ text: 'SKU, Nombre, Cantidad y Precio de Compra son requeridos.', type: 'error' });
      return;
    }

    const productData = {
      ...newProduct,
      purchase_price: parseFloat(purchasePrice) || 0,
      added_stock: parseFloat(newProduct.stock) || 0,
    };

    const productIndex = addedProducts.findIndex(p => p.sku === productData.sku);

    if (productIndex > -1) {
      // Si el producto ya está en la lista, suma la cantidad
      const updatedProducts = [...addedProducts];
      updatedProducts[productIndex].added_stock += productData.added_stock;
      setAddedProducts(updatedProducts);
    } else {
      // Si es nuevo, lo agrega a la lista
      setAddedProducts(prev => [...prev, productData]);
    }

    setMessage({ text: `'${productData.name}' agregado a la lista temporal.`, type: 'info' });
    resetForm();
  };

  // 🔹 Finalizar y enviar todo a la base de datos
  const handleFinalizeStock = async () => {
    if (addedProducts.length === 0) {
        setMessage({ text: 'No hay productos en la lista para finalizar.', type: 'info' });
        return;
    }
    setIsFinalizing(true);
    setMessage({ text: 'Finalizando y guardando en la base de datos...', type: 'info' });

    // Se envían todas las peticiones en paralelo
    const upsertPromises = addedProducts.map(product => {
        const payload = {
            sku: product.sku,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.added_stock, // Se envía la cantidad a sumar
            stockUnit: product.stockUnit,
            categoria_id: product.categoria_id,
            purchase_price: product.purchase_price
        };
        return axios.post(`${API_BASE_URL}/api/stock/products/upsert`, payload, config);
    });

    try {
        await Promise.all(upsertPromises);
        setAddedProducts([]);
        localStorage.removeItem(localStorageKey);
        setMessage({ text: '¡Stock actualizado exitosamente en la base de datos!', type: 'success' });
    } catch (error) {
        console.error('Error al finalizar stock:', error);
        const errorMsg = error.response?.data?.message || 'Ocurrió un error al guardar.';
        setMessage({ text: `Error: ${errorMsg}. Revisa los permisos o la consola.`, type: 'error' });
    } finally {
        setIsFinalizing(false);
    }
  };

  return (
    <div className="posContainerMain super-stock-container">
      <div className="posSection super-stock-section">
        <h3 className="sectionTitle">Registro de Compras (Super Stock)</h3>
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="close-message">×</button>
          </div>
        )}
        
        <div className="super-stock-cards-container">
          <div className="form-card super-stock-form">
            {/* ... (Todo el JSX del formulario, inputs y calculadora de precios va aquí, sin cambios) ... */}
            {/* Ejemplo de un input: */}
            <div className="posItem">
              <input
                type="text"
                placeholder="SKU (Buscará automáticamente)"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              />
            </div>
            {/* ... (resto de inputs) ... */}

             <button className="button" onClick={handleAddProduct} disabled={isFinalizing}>
               {existingProduct ? "Añadir Stock a Lista" : "Añadir Nuevo Producto a Lista"}
             </button>
          </div>

          {addedProducts.length > 0 && (
            <div className="form-card super-stock-products">
              <h4>Productos en Lista Temporal ({addedProducts.length})</h4>
              <div className="products-scroll-container">
                <ul className="product-list">
                  {addedProducts.slice(0, 4).map((p, i) => (
                    <li key={i} className="product-item-card">
                      <p><strong>SKU:</strong> {p.sku}</p>
                      <p><strong>Nombre:</strong> {p.name}</p>
                      <p><strong>Cantidad a agregar:</strong> {p.added_stock} {p.stockUnit}</p>
                    </li>
                  ))}
                </ul>
              </div>
              {addedProducts.length > 4 && (
                <button className="button" onClick={() => setShowAllProducts(true)}>
                  Ver todos ({addedProducts.length})
                </button>
              )}
              <button className="button finalize-button" onClick={handleFinalizeStock} disabled={isFinalizing}>
                {isFinalizing ? 'Guardando...' : 'Finalizar y Guardar en BD'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showAllProducts && (
        <div className="modal">
          <div className="modalContent wide-modal">
            <h4>Todos los Productos en Lista Temporal</h4>
            <div className="modal-products-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Nombre</th>
                    <th>Cantidad a Agregar</th>
                    <th>Precio Compra</th>
                    <th>Precio Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {addedProducts.map((p, i) => (
                    <tr key={i}>
                      <td>{p.sku}</td>
                      <td>{p.name}</td>
                      <td>{p.added_stock} {p.stockUnit}</td>
                      <td>${p.purchase_price.toFixed(2)}</td>
                      <td>${p.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modalButtons">
              <button className="button" onClick={() => setShowAllProducts(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperStock;