import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SuperStock = () => {
  // Usar una clave única para el almacenamiento local, como el ID del usuario
  const currentUserId = 1;
  const localStorageKey = `superstock_temp_products_${currentUserId}`;

  // Estado para la lista de categorías
  const [categories, setCategories] = useState([]);
  
  // Estado para productos agregados a tabla temporal
  const [addedProducts, setAddedProducts] = useState(() => {
    try {
      const storedProducts = localStorage.getItem(localStorageKey);
      return storedProducts ? JSON.parse(storedProducts) : [];
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return [];
    }
  });

  // Estado para el nuevo producto
  const [newProduct, setNewProduct] = useState({ 
    sku: '', 
    name: '', 
    description: '', 
    stock: 0, 
    stockUnit: 'Unidad', 
    categoria_id: null,
    price: 0
  });

  // Estado para producto existente (si coincide SKU)
  const [existingProduct, setExistingProduct] = useState(null);

  // Estados de calculadora de precios
  const [purchasePrice, setPurchasePrice] = useState('');
  const [profitPercentage, setProfitPercentage] = useState('');
  const [calculatedProfitPercentage, setCalculatedProfitPercentage] = useState('');
  const [calculationMode, setCalculationMode] = useState('price');

  // Mensajes de estado
  const [message, setMessage] = useState(null);

  // Modal ver todos
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Timeout búsqueda SKU
  const [searchTimeout, setSearchTimeout] = useState(null);

  // ✅ Obtener token de autenticación
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // 🔹 Guardar productos en localStorage cada vez que `addedProducts` cambie
  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(addedProducts));
  }, [addedProducts, localStorageKey]);

  // 🔹 Traer categorías al inicio
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // ✅ AGREGAR CONFIG CON TOKEN
        const response = await axios.get('http://localhost:4000/api/stock/categories', config);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setMessage({ text: 'Error al cargar categorías. Verifica tu autenticación.', type: 'error' });
      }
    };
    
    if (token) {
      fetchCategories();
    } else {
      setMessage({ text: 'No estás autenticado. Por favor inicia sesión.', type: 'error' });
    }
  }, [token]); // ✅ Agregar token como dependencia

  // 🔹 Buscar producto por SKU en tabla principal
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    if (newProduct.sku.trim() !== '') {
      const timeout = setTimeout(async () => {
        try {
          // ✅ AGREGAR CONFIG CON TOKEN
          const response = await axios.get(
            `http://localhost:4000/api/stock/products/by-sku/${newProduct.sku}`,
            config
          );
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
          setPurchasePrice(product.purchase_price);
          setMessage({ text: `Producto '${product.name}' encontrado en stock.`, type: 'info' });
        } catch (error) {
          if (error.response && error.response.status === 404) {
            setExistingProduct(null);
            setNewProduct(prev => ({
              ...prev,
              name: '',
              description: '',
              stock: 0,
              categoria_id: null,
              price: 0
            }));
            setPurchasePrice('');
            setProfitPercentage('');
            setMessage({ text: 'SKU no encontrado, se guardará como producto nuevo en temporal.', type: 'info' });
          } else {
            console.error('Error buscando producto:', error);
            setMessage({ text: 'Error al buscar producto. Verifica tu autenticación.', type: 'error' });
          }
        }
      }, 500);

      setSearchTimeout(timeout);
    }
  }, [newProduct.sku, token]); // ✅ Agregar token como dependencia

  // 🔹 Calculadora de precios
  useEffect(() => {
    const price = parseFloat(purchasePrice);
    
    if (calculationMode === 'price') {
      const profit = parseFloat(profitPercentage);
      if (!isNaN(price) && !isNaN(profit)) {
        const calculatedPrice = price * (1 + profit / 100);
        setNewProduct(prev => ({ ...prev, price: calculatedPrice }));
      }
    } else {
      const salePrice = parseFloat(newProduct.price);
      if (!isNaN(price) && !isNaN(salePrice) && price > 0) {
        const calculatedProfit = ((salePrice - price) / price) * 100;
        setCalculatedProfitPercentage(calculatedProfit.toFixed(2));
      } else {
        setCalculatedProfitPercentage('N/A');
      }
    }
  }, [purchasePrice, profitPercentage, newProduct.price, calculationMode]);

  // 🔹 Guardar en tabla temporal
  const handleAddProduct = async () => {
    try {
      const productData = {
        sessionId: `user_${currentUserId}`,
        sku: newProduct.sku.trim(),
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        stock: parseFloat(newProduct.stock) || 0,
        stockUnit: newProduct.stockUnit || 'Unidad',
        categoria_id: newProduct.categoria_id || null,
        price: parseFloat(newProduct.price) || 0,
        added_stock: parseFloat(newProduct.stock) || 0,
        purchase_price: parseFloat(purchasePrice) || 0,
        user_id: currentUserId
      };

      // Validar campos clave
      if (!productData.sessionId || !productData.sku || !productData.added_stock || !productData.purchase_price) {
        setMessage({ text: 'Faltan datos clave para agregar el producto.', type: 'error' });
        return;
      }

      // Para evitar duplicados en la lista local
      const productExists = addedProducts.find(p => p.sku === productData.sku);
      if (productExists) {
        setAddedProducts(prev => prev.map(p => 
          p.sku === productData.sku ? { ...productData, added_stock: p.added_stock + productData.added_stock } : p
        ));
      } else {
        setAddedProducts(prev => [...prev, productData]);
      }

      // Resetear campos
      setExistingProduct(null);
      setNewProduct({ sku: '', name: '', description: '', stock: 0, stockUnit: 'Unidad', categoria_id: null, price: 0 });
      setPurchasePrice('');
      setProfitPercentage('');
      setCalculatedProfitPercentage('');

      setMessage({ text: 'Producto agregado a tabla temporal.', type: 'info' });
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error agregando producto temporal:', error);
      setMessage({ text: 'Error al guardar en temporal.', type: 'error' });
    }
  };

  // 🔹 Finalizar → mover todo de temp_products a products
  const handleFinalizeStock = async () => {
    try {
      // ✅ AGREGAR CONFIG CON TOKEN
      await axios.post('http://localhost:4000/api/stock/finalize', {
        sessionId: `user_${currentUserId}`,
        products: addedProducts
      }, config);
      
      setAddedProducts([]);
      localStorage.removeItem(localStorageKey);
      setMessage({ text: 'Productos trasladados a Control Stock.', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error finalizando stock:', error);
      setMessage({ text: 'Error al finalizar stock. Verifica tu autenticación.', type: 'error' });
    }
  };

  const handleSetSuggestedPrice = () => {
    if (calculationMode === 'price') {
      const suggestedPrice = parseFloat(purchasePrice) * (1 + parseFloat(profitPercentage) / 100);
      setNewProduct(prev => ({ ...prev, price: suggestedPrice }));
    }
  };

  return (
    <div className="posContainerMain super-stock-container">
      <div className="posSection super-stock-section">
        <h3 className="sectionTitle">Registro de Compras (Super Stock)</h3>
        
        {message && (
          <div className={`success-message ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' && '✓'}
              {message.type === 'info' && 'ℹ'}
              {message.type === 'error' && '⚠'}
            </span>
            {message.text}
          </div>
        )}
        
        <div className="super-stock-cards-container">
          <div className="form-card super-stock-form">
            <h4>Agregar Nuevo Stock</h4>
            
            <div className="posItem">
              <input
                type="text"
                placeholder="SKU (Buscará automáticamente)"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              />
            </div>
            
            <div className="posItem">
              <input
                type="text"
                placeholder="Nombre"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            
            <div className="posItem">
              <input
                type="text"
                placeholder="Descripción"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
            
            <div className="posItem">
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseFloat(e.target.value) || 0 })}
                />
                <select
                  value={newProduct.stockUnit}
                  onChange={(e) => setNewProduct({ ...newProduct, stockUnit: e.target.value })}
                >
                  <option value="Unidad">Unidad</option>
                  <option value="Kilo">Kilo</option>
                </select>
              </div>
            </div>

            <div className="divider"></div>
            
            <div className="calculation-mode-toggle">
              <button
                className={`button mode-button ${calculationMode === 'price' ? 'active' : ''}`}
                onClick={() => setCalculationMode('price')}
              >
                Calcular Precio de Venta
              </button>
              <button
                className={`button mode-button ${calculationMode === 'profit' ? 'active' : ''}`}
                onClick={() => setCalculationMode('profit')}
              >
                Calcular % de Ganancia
              </button>
            </div>
            
            <div className="posItem">
              <input
                type="number"
                placeholder="Precio de Compra"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>

            {calculationMode === 'price' ? (
              <>
                <div className="posItem">
                  <input
                    type="number"
                    placeholder="Porcentaje de Ganancia (%)"
                    value={profitPercentage}
                    onChange={(e) => setProfitPercentage(e.target.value)}
                  />
                </div>
                <p className="suggested-price">
                  Precio de Venta Sugerido: <strong>${(parseFloat(purchasePrice) * (1 + parseFloat(profitPercentage || 0) / 100)).toFixed(2)}</strong>
                </p>
                <button
                  className="button set-price-button"
                  onClick={handleSetSuggestedPrice}
                >
                  Establecer precio sugerido
                </button>
              </>
            ) : (
              <>
                <div className="posItem">
                  <input
                    type="number"
                    placeholder="Precio de Venta Deseado"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <p className="suggested-price">
                  Porcentaje de Ganancia: <strong>{calculatedProfitPercentage}%</strong>
                </p>
              </>
            )}

            <div className="divider"></div>

            <div className="posItem">
              <select
                value={newProduct.categoria_id || ''}
                onChange={(e) => setNewProduct({ ...newProduct, categoria_id: e.target.value === '' ? null : parseInt(e.target.value) })}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <button className="button" onClick={handleAddProduct}>
              {existingProduct ? "Actualizar en Temporal" : "Agregar a Temporal"}
            </button>
          </div>

          {addedProducts.length > 0 && (
            <div className="form-card super-stock-products">
              <h4>Productos en Temporal ({addedProducts.length})</h4>
              <div className="products-scroll-container">
                <ul className="product-list">
                  {addedProducts.slice(0, 4).map((product, index) => (
                    <li key={index} className="product-item-card">
                      <div className="product-details">
                        <div className="details-text">
                          <p><strong>SKU:</strong> {product.sku}</p>
                          <p><strong>Nombre:</strong> {product.name}</p>
                          <p><strong>Cantidad:</strong> {product.added_stock} {product.stockUnit || product.stock_unit}</p>
                          <p><strong>Precio:</strong> ${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {addedProducts.length > 4 && (
                <button className="button show-full-stock-button" onClick={() => setShowAllProducts(true)}>
                  Ver todos ({addedProducts.length})
                </button>
              )}
              <button className="button finalize-button" onClick={handleFinalizeStock}>
                Finalizar y llevar a Stock
              </button>
            </div>
          )}
        </div>
      </div>

      {showAllProducts && (
        <div className="modal">
          <div className="modalContent wide-modal">
            <h4>Todos los Productos en Temporal ({addedProducts.length})</h4>
            <div className="modal-products-scroll">
              <ul className="product-list full-list">
                {addedProducts.map((product, index) => (
                  <li key={index} className="product-item-card">
                    <div className="product-details">
                      <div className="details-text">
                        <p><strong>SKU:</strong> {product.sku}</p>
                        <p><strong>Nombre:</strong> {product.name}</p>
                        <p><strong>Cantidad:</strong> {product.added_stock} {product.stockUnit || product.stock_unit}</p>
                        <p><strong>Precio:</strong> ${product.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modalButtons">
              <button className="button cancel-button" onClick={() => setShowAllProducts(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>                                                                                                                     
  );
};

export default SuperStock;