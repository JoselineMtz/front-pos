import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './StockControl.css';

// Componente Modal de Permisos Insuficientes
const PermissionDeniedModal = ({ show, onClose, requiredPermission, currentUser }) => {
  if (!show) return null;

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
    <div className="modal-overlay">
      <div className="modal-content permission-modal">
        <div className="permission-modal-header">
          <h3>❌ Permisos Insuficientes</h3>
        </div>
        <div className="permission-modal-body">
          <p>Lo sentimos, <strong>{currentUser?.username}</strong>.</p>
          <p>No tienes permisos para <strong>{permissionMessages[requiredPermission] || "realizar esta acción"}</strong>.</p>
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

// Componente para el formulario de producto
const ProductForm = ({ formData, categories, products, onFormChange, onSkuSearch, onAddOrUpdateProduct, isSearching }) => {
    return (
        <div className="form-card">
            <h4>Agregar o Actualizar Producto</h4>
            <div className="posItem">
                <input
                    type="text"
                    name="sku"
                    placeholder="SKU (Escanear o digitar - Buscará automáticamente)"
                    value={formData.sku}
                    onChange={onFormChange}
                    onBlur={onSkuSearch}
                    disabled={isSearching}
                />
            </div>
            <div className="posItem">
                <input
                    type="text"
                    name="name"
                    placeholder="Nombre"
                    value={formData.name}
                    onChange={onFormChange}
                />
            </div>
            <div className="posItem">
                <input
                    type="text"
                    name="description"
                    placeholder="Descripción"
                    value={formData.description}
                    onChange={onFormChange}
                />
            </div>
            <div className="posItem">
                <input
                    type="number"
                    name="price"
                    placeholder="Precio"
                    value={formData.price}
                    onChange={onFormChange}
                />
            </div>
            <div className="posItem">
                <div className="input-group">
                    <input
                        type="number"
                        name="stock"
                        placeholder="Cantidad"
                        value={formData.stock}
                        onChange={onFormChange}
                    />
                    <select
                        name="stockUnit"
                        value={formData.stockUnit}
                        onChange={onFormChange}
                    >
                        <option value="Unidad">Unidad</option>
                        <option value="Kilos">Kilos</option>
                    </select>
                </div>
            </div>
            <div className="posItem">
                <select
                    name="categoria_id"
                    value={formData.categoria_id || ''}
                    onChange={onFormChange}
                >
                    <option value="">Selecciona una categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
            </div>
            <button className="button" onClick={onAddOrUpdateProduct}>
                {products.some(p => p.sku === formData.sku) ? 'Actualizar Producto' : 'Agregar Producto'}
            </button>
        </div>
    );
};

// Componente para el formulario de categoría
const CategoryForm = ({
    newCategoryName,
    categories,
    showCategoryManagement,
    onNewCategoryChange,
    onAddCategory,
    onToggleCategoryManagement,
    onConfirmDeleteCategory
}) => {
    return (
        <div className="form-card">
            <h4>Agregar Categoría</h4>
            <div className="posItem">
                <input
                    type="text"
                    placeholder="Nombre de la nueva categoría"
                    value={newCategoryName}
                    onChange={onNewCategoryChange}
                />
            </div>
            <button className="button" onClick={onAddCategory}>
                Agregar Categoría
            </button>
            <button
                className="button manage-categories-button"
                onClick={onToggleCategoryManagement}
            >
                {showCategoryManagement ? 'Ocultar Categorías' : 'Administrar Categorías'}
            </button>

            {showCategoryManagement && (
                <div className="category-management">
                    <h5>Categorías Disponibles</h5>
                    <ul className="category-list">
                        {categories.map(c => (
                            <li key={c.id} className="category-item">
                                <span>{c.nombre}</span>
                                <button
                                    className="delete-category-button"
                                    onClick={() => onConfirmDeleteCategory(c)}
                                >
                                    Eliminar
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Componente para ítem de producto
const ProductItem = ({
    product,
    isEditing,
    editingProduct,
    categories,
    onEditChange,
    onUpdateProduct,
    onCancelEdit,
    onEditClick,
    onConfirmDeleteProduct,
    formatStock
}) => {
    if (isEditing) {
        return (
            <div className="edit-form">
                <div className="posItem">
                    <input
                        type="text"
                        value={editingProduct.sku}
                        onChange={(e) => onEditChange('sku', e.target.value)}
                    />
                </div>
                <div className="posItem">
                    <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => onEditChange('name', e.target.value)}
                    />
                </div>
                <div className="posItem">
                    <input
                        type="text"
                        placeholder="Descripción"
                        value={editingProduct.description}
                        onChange={(e) => onEditChange('description', e.target.value)}
                    />
                </div>
                <div className="posItem">
                    <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => onEditChange('price', e.target.value)}
                    />
                </div>
                <div className="posItem">
                    <div className="input-group">
                        <input
                            type="number"
                            value={editingProduct.stock}
                            onChange={(e) => onEditChange('stock', e.target.value)}
                        />
                        <select
                            value={editingProduct.stockUnit || 'Unidad'}
                            onChange={(e) => onEditChange('stockUnit', e.target.value)}
                        >
                            <option value="Unidad">Unidad</option>
                            <option value="Kilos">Kilos</option>
                        </select>
                    </div>
                </div>
                <div className="posItem">
                    <select
                        value={editingProduct.categoria_id || ''}
                        onChange={(e) => onEditChange('categoria_id', e.target.value === '' ? null : parseInt(e.target.value))}
                    >
                        <option value="">Selecciona una categoría</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>
                <div className="button-group">
                    <button onClick={onUpdateProduct} className="button save-button">
                        Guardar
                    </button>
                    <button onClick={onCancelEdit} className="button cancel-button">
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="product-details">
            <div className="details-text">
                <p><strong>SKU:</strong> {product.sku}</p>
                <p><strong>Nombre:</strong> {product.name}</p>
                <p><strong>Precio:</strong> {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(product.price)}</p>
                <p><strong>Stock:</strong> {formatStock(product.stock)} {product.stock_unit}</p>
                {product.categoria_nombre && <p><strong>Categoría:</strong> {product.categoria_nombre}</p>}
            </div>
            <div className="button-group">
                <button onClick={() => onEditClick(product)} className="button edit-button">
                    Editar
                </button>
                <button onClick={() => onConfirmDeleteProduct(product)} className="button delete-button">
                    Eliminar
                </button>
            </div>
        </div>
    );
};

// Componente para la lista de productos
const ProductList = ({
    products,
    title,
    showFullStock,
    editingProduct,
    onEditChange,
    onUpdateProduct,
    onCancelEdit,
    onEditClick,
    onConfirmDeleteProduct,
    formatStock,
    categories,
    isLoading
}) => (
    <>
        {title && <h4>{title}</h4>}
        {isLoading ? (
            <p>Cargando productos...</p>
        ) : (
            <ul className={`product-list ${showFullStock ? 'full-list' : ''}`}>
                {products.map(product => (
                    <li key={product.id} className="product-item-card">
                        <ProductItem
                            product={product}
                            isEditing={editingProduct && editingProduct.id === product.id}
                            editingProduct={editingProduct}
                            categories={categories}
                            onEditChange={onEditChange}
                            onUpdateProduct={onUpdateProduct}
                            onCancelEdit={onCancelEdit}
                            onEditClick={onEditClick}
                            onConfirmDeleteProduct={onConfirmDeleteProduct}
                            formatStock={formatStock}
                        />
                    </li>
                ))}
            </ul>
        )}
    </>
);

// Componente para el SuperStock (Registro de Compras)
const SuperStockForm = ({
    superStockData,
    categories,
    onSuperStockChange,
    onSkuSearch,
    onAddToTempList,
    existingProduct,
    purchasePrice,
    profitPercentage,
    calculatedProfitPercentage,
    calculationMode,
    onPurchasePriceChange,
    onProfitPercentageChange,
    onCalculationModeChange,
    addedProducts,
    onFinalizeStock,
    isFinalizing,
    onShowAllProducts,
    tempProductsCount
}) => {
    return (
        <div className="form-card super-stock-form">
            <h4>Registro de Compras (Super Stock)</h4>
            
            <div className="posItem">
                <input
                    type="text"
                    placeholder="SKU (Buscará automáticamente)"
                    value={superStockData.sku}
                    onChange={(e) => onSuperStockChange('sku', e.target.value)}
                    onBlur={onSkuSearch}
                />
            </div>
            
            <div className="posItem">
                <input
                    type="text"
                    placeholder="Nombre"
                    value={superStockData.name}
                    onChange={(e) => onSuperStockChange('name', e.target.value)}
                />
            </div>
            
            <div className="posItem">
                <input
                    type="text"
                    placeholder="Descripción"
                    value={superStockData.description}
                    onChange={(e) => onSuperStockChange('description', e.target.value)}
                />
            </div>
            
            <div className="posItem">
                <div className="input-group">
                    <input
                        type="number"
                        placeholder="Cantidad"
                        value={superStockData.stock}
                        onChange={(e) => onSuperStockChange('stock', e.target.value)}
                    />
                    <select
                        value={superStockData.stockUnit}
                        onChange={(e) => onSuperStockChange('stockUnit', e.target.value)}
                    >
                        <option value="Unidad">Unidad</option>
                        <option value="Kilos">Kilos</option>
                    </select>
                </div>
            </div>
            
            <div className="posItem">
                <select
                    value={superStockData.categoria_id || ''}
                    onChange={(e) => onSuperStockChange('categoria_id', e.target.value === '' ? null : parseInt(e.target.value))}
                >
                    <option value="">Selecciona una categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
            </div>
            
            {/* Calculadora de Precios */}
            <div className="price-calculator">
                <h5>Calculadora de Precios</h5>
                
                <div className="posItem">
                    <input
                        type="number"
                        placeholder="Precio de Compra"
                        value={purchasePrice}
                        onChange={onPurchasePriceChange}
                        step="0.01"
                    />
                </div>
                
                <div className="calculation-mode">
                    <label>
                        <input
                            type="radio"
                            value="price"
                            checked={calculationMode === 'price'}
                            onChange={onCalculationModeChange}
                        />
                        Calcular Precio de Venta
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="profit"
                            checked={calculationMode === 'profit'}
                            onChange={onCalculationModeChange}
                        />
                        Calcular Margen de Ganancia
                    </label>
                </div>
                
                {calculationMode === 'price' ? (
                    <div className="posItem">
                        <input
                            type="number"
                            placeholder="% Ganancia"
                            value={profitPercentage}
                            onChange={onProfitPercentageChange}
                            step="0.01"
                        />
                    </div>
                ) : (
                    <div className="posItem">
                        <input
                            type="number"
                            placeholder="Precio de Venta"
                            value={superStockData.price}
                            onChange={(e) => onSuperStockChange('price', e.target.value)}
                            step="0.01"
                        />
                    </div>
                )}
                
                <div className="calculation-results">
                    {calculationMode === 'price' ? (
                        <p>Precio de Venta: ${superStockData.price || 0}</p>
                    ) : (
                        <p>Margen de Ganancia: {calculatedProfitPercentage}%</p>
                    )}
                </div>
            </div>
            
            <button className="button" onClick={onAddToTempList}>
                {existingProduct ? "Añadir Stock a Lista" : "Añadir Nuevo Producto a Lista"}
            </button>
            
            {/* Lista Temporal de Productos */}
            {addedProducts.length > 0 && (
                <div className="temp-products-list">
                    <h5>Productos en Lista Temporal ({tempProductsCount})</h5>
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
                        <button className="button" onClick={onShowAllProducts}>
                            Ver todos ({addedProducts.length})
                        </button>
                    )}
                    <button className="button finalize-button" onClick={onFinalizeStock} disabled={isFinalizing}>
                        {isFinalizing ? 'Guardando...' : 'Finalizar y Guardar en BD'}
                    </button>
                </div>
            )}
        </div>
    );
};

// Componente para modales
const Modals = ({
    showDeleteCategoryModal,
    categoryToDelete,
    showDeleteProductModal,
    productToDelete,
    showAllProducts,
    addedProducts,
    onCancelDeleteCategory,
    onDeleteCategory,
    onCancelDeleteProduct,
    onDeleteProductConfirmed,
    onCloseAllProducts
}) => (
    <>
        {showDeleteCategoryModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h4>Confirmar Eliminación</h4>
                    <p>¿Estás seguro de que deseas eliminar la categoría <strong>"{categoryToDelete?.nombre}"</strong>?</p>
                    <p className="warning-text">Esta acción no se puede deshacer.</p>
                    <div className="modalButtons">
                        <button className="button cancel-button" onClick={onCancelDeleteCategory}>
                            Cancelar
                        </button>
                        <button className="button delete-button" onClick={onDeleteCategory}>
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showDeleteProductModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h4>Confirmar Eliminación</h4>
                    <p>¿Estás seguro de que deseas eliminar el producto <strong>"{productToDelete?.name}"</strong>?</p>
                    <p className="warning-text">Esta acción no se puede deshacer.</p>
                    <div className="modalButtons">
                        <button className="button cancel-button" onClick={onCancelDeleteProduct}>
                            Cancelar
                        </button>
                        <button className="button delete-button" onClick={onDeleteProductConfirmed}>
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showAllProducts && (
            <div className="modal-overlay">
                <div className="modal-content wide-modal">
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
                                        <td>${p.purchase_price?.toFixed(2)}</td>
                                        <td>${p.price?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="modalButtons">
                        <button className="button" onClick={onCloseAllProducts}>Cerrar</button>
                    </div>
                </div>
            </div>
        )}
    </>
);

// Componente principal
const StockControl = () => {
    // Estados principales del StockControl original
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        price: '',
        stock: '',
        stockUnit: 'Unidad',
        categoria_id: null,
    });

    // Estados de UI del StockControl original
    const [currentUserId] = useState(1);
    const [showFullStock, setShowFullStock] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showCategoryManagement, setShowCategoryManagement] = useState(false);
    const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [actionType, setActionType] = useState('');
    const [lastSkuSearched, setLastSkuSearched] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Estados para permisos
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [requiredPermission, setRequiredPermission] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // ✅ Estados del SuperStock
    const [superStockData, setSuperStockData] = useState({
        sku: '', name: '', description: '', stock: 0, stockUnit: 'Unidad', categoria_id: null, price: 0
    });
    const [existingProduct, setExistingProduct] = useState(null);
    const [purchasePrice, setPurchasePrice] = useState('');
    const [profitPercentage, setProfitPercentage] = useState('');
    const [calculatedProfitPercentage, setCalculatedProfitPercentage] = useState('');
    const [calculationMode, setCalculationMode] = useState('price');
    const [addedProducts, setAddedProducts] = useState([]);
    const [showAllProducts, setShowAllProducts] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    // Clave para localStorage del SuperStock
    const localStorageKey = `superstock_temp_products_${currentUserId}`;

    // ✅ URL base corregida
    const API_URL = process.env.NODE_ENV === 'production' 
        ? '/api/stock' 
        : 'http://localhost:4000/api/stock';
    
    const token = localStorage.getItem('token');
    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // Efectos
    useEffect(() => {
        fetchProducts();
        fetchCategories();
        const tokenData = token ? JSON.parse(atob(token.split('.')[1])) : null;
        setCurrentUser(tokenData);
        
        // Cargar productos temporales del SuperStock
        try {
            const stored = localStorage.getItem(localStorageKey);
            if (stored) {
                setAddedProducts(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error al leer productos temporales de localStorage:', error);
        }
    }, [token]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const results = products.filter(product =>
            product.name.toLowerCase().includes(term) ||
            product.sku.toLowerCase().includes(term) ||
            (product.categoria_nombre && product.categoria_nombre.toLowerCase().includes(term))
        );
        setFilteredProducts(results);
    }, [searchTerm, products]);

    // 🔹 Guardar productos del SuperStock en localStorage
    useEffect(() => {
        localStorage.setItem(localStorageKey, JSON.stringify(addedProducts));
    }, [addedProducts, localStorageKey]);

    // 🔹 Calculadora de precios del SuperStock
    useEffect(() => {
        const price = parseFloat(purchasePrice);
        if (calculationMode === 'price') {
            const profit = parseFloat(profitPercentage);
            if (!isNaN(price) && !isNaN(profit)) {
                setSuperStockData(prev => ({ ...prev, price: price * (1 + profit / 100) }));
            }
        } else {
            const salePrice = parseFloat(superStockData.price);
            if (!isNaN(price) && !isNaN(salePrice) && price > 0) {
                setCalculatedProfitPercentage((((salePrice - price) / price) * 100).toFixed(2));
            } else {
                setCalculatedProfitPercentage('');
            }
        }
    }, [purchasePrice, profitPercentage, superStockData.price, calculationMode]);

    // Función para mostrar modal de permisos insuficientes
    const showPermissionDenied = useCallback((permission) => {
        setRequiredPermission(permission);
        setShowPermissionModal(true);
    }, []);

    // Funciones del StockControl original (se mantienen igual)
    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    }, []);

    const handleEditChange = useCallback((field, value) => {
        setEditingProduct(prev => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const clearForm = useCallback(() => {
        setFormData({
            sku: '',
            name: '',
            description: '',
            price: '',
            stock: '',
            stockUnit: 'Unidad',
            categoria_id: null,
        });
        setLastSkuSearched('');
    }, []);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/products`, config);
            const sortedProducts = response.data.sort((a, b) => b.id - a.id);
            setProducts(sortedProducts);
            setFilteredProducts(sortedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            if (error.response?.status === 403) {
                showPermissionDenied('can_view_products');
            } else {
                showMessage('Error al cargar productos. Por favor, inténtalo de nuevo.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [config, API_URL]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/categories`, config);
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showMessage('Error al cargar categorías. Por favor, inténtalo de nuevo.', 'error');
        }
    }, [config, API_URL]);

    const handleSkuSearch = useCallback(async () => {
        const skuToSearch = formData.sku.trim();
        if (!skuToSearch) return;

        try {
            const response = await axios.get(`${API_URL}/products/by-sku/${skuToSearch}`, config);
            const productFound = response.data;

            if (productFound) {
                setFormData(prev => ({
                    ...prev,
                    name: productFound.name || '',
                    description: productFound.description || '',
                    price: productFound.price ? productFound.price.toString() : '',
                    stock: productFound.stock ? productFound.stock.toString() : '',
                    stockUnit: productFound.stock_unit || 'Unidad',
                    categoria_id: productFound.categoria_id || null,
                }));
                setLastSkuSearched(skuToSearch);
            } else {
                setFormData(prev => ({
                    ...prev,
                    name: '',
                    description: '',
                    price: '',
                    stock: '',
                    stockUnit: 'Unidad',
                    categoria_id: null,
                }));
                showMessage('SKU no encontrado. Puedes agregar un nuevo producto.', 'info');
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setFormData(prev => ({
                    sku: prev.sku,
                    name: '',
                    description: '',
                    price: '',
                    stock: '',
                    stockUnit: 'Unidad',
                    categoria_id: null,
                }));
                showMessage('SKU no encontrado. Puedes agregar un nuevo producto.', 'info');
            } else {
                console.error('Error scanning product:', error);
                showMessage('Error al buscar el producto. Inténtalo de nuevo.', 'error');
            }
        }
    }, [formData.sku, config, API_URL]);

    const showMessage = useCallback((message, type) => {
        setSuccessMessage(message);
        setActionType(type);
        setShowSuccessMessage(true);
        setTimeout(() => {
            setShowSuccessMessage(false);
            setActionType('');
        }, 3000);
    }, []);

    const handleAddOrUpdateProduct = useCallback(async () => {
        if (!formData.sku || !formData.name || formData.price === '' || formData.stock === '') {
            showMessage('Por favor, completa todos los campos obligatorios: SKU, Nombre, Precio y Cantidad.', 'error');
            return;
        }

        try {
            const productToSave = {
                sku: formData.sku,
                name: formData.name,
                description: formData.description || '',
                price: parseFloat(formData.price),
                stock: formData.stockUnit === 'Kilos' ? parseFloat(formData.stock) : parseInt(formData.stock),
                stockUnit: formData.stockUnit,
                user_id: currentUserId,
                categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
                purchase_price: parseFloat(formData.price) * 0.7
            };

            await axios.post(`${API_URL}/products/upsert`, productToSave, config);

            const isUpdate = products.some(p => p.sku === productToSave.sku);
            showMessage(
                `Producto ${isUpdate ? 'actualizado' : 'registrado'} con éxito`,
                isUpdate ? 'updated' : 'added'
            );

            clearForm();
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            
            if (error.response?.status === 403) {
                const isUpdate = products.some(p => p.sku === formData.sku);
                showPermissionDenied(isUpdate ? 'can_edit_products' : 'can_create_products');
            } else {
                let errorMessage = 'Error al guardar el producto';
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                }
                
                showMessage(errorMessage, 'error');
            }
        }
    }, [formData, products, currentUserId, config, showMessage, clearForm, fetchProducts, API_URL]);

    // 🔹 Funciones del SuperStock
    const handleSuperStockChange = useCallback((field, value) => {
        setSuperStockData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSuperStockSkuSearch = useCallback(async () => {
        const skuToSearch = superStockData.sku.trim();
        if (!skuToSearch) return;

        try {
            const response = await axios.get(`${API_URL}/products/by-sku/${skuToSearch}`, config);
            const product = response.data;
            setExistingProduct(product);
            setSuperStockData(prev => ({
                ...prev,
                name: product.name,
                description: product.description,
                stock: 0,
                stockUnit: product.stock_unit,
                categoria_id: product.categoria_id,
                price: product.price
            }));
            setPurchasePrice(product.purchase_price || '');
            showMessage(`Producto '${product.name}' encontrado. Se actualizará el stock.`, 'info');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setExistingProduct(null);
                showMessage('SKU no encontrado. Se creará como un producto nuevo.', 'info');
            } else {
                console.error('Error buscando producto:', error);
                showMessage('Error al buscar producto.', 'error');
            }
        }
    }, [superStockData.sku, config, API_URL]);

    const resetSuperStockForm = useCallback(() => {
        setSuperStockData({ sku: '', name: '', description: '', stock: 0, stockUnit: 'Unidad', categoria_id: null, price: 0 });
        setPurchasePrice('');
        setProfitPercentage('');
        setCalculatedProfitPercentage('');
        setExistingProduct(null);
    }, []);

    const handleAddToTempList = useCallback(() => {
        if (!superStockData.sku || !superStockData.name || !superStockData.stock || !purchasePrice) {
            showMessage('SKU, Nombre, Cantidad y Precio de Compra son requeridos.', 'error');
            return;
        }

        const productData = {
            ...superStockData,
            purchase_price: parseFloat(purchasePrice) || 0,
            added_stock: parseFloat(superStockData.stock) || 0,
        };

        const productIndex = addedProducts.findIndex(p => p.sku === productData.sku);

        if (productIndex > -1) {
            const updatedProducts = [...addedProducts];
            updatedProducts[productIndex].added_stock += productData.added_stock;
            setAddedProducts(updatedProducts);
        } else {
            setAddedProducts(prev => [...prev, productData]);
        }

        showMessage(`'${productData.name}' agregado a la lista temporal.`, 'info');
        resetSuperStockForm();
    }, [superStockData, purchasePrice, addedProducts, resetSuperStockForm]);

    const handleFinalizeStock = useCallback(async () => {
        if (addedProducts.length === 0) {
            showMessage('No hay productos en la lista para finalizar.', 'info');
            return;
        }
        setIsFinalizing(true);
        showMessage('Finalizando y guardando en la base de datos...', 'info');

        const upsertPromises = addedProducts.map(product => {
            const payload = {
                sku: product.sku,
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.added_stock,
                stockUnit: product.stockUnit,
                categoria_id: product.categoria_id,
                purchase_price: product.purchase_price
            };
            return axios.post(`${API_URL}/products/upsert`, payload, config);
        });

        try {
            await Promise.all(upsertPromises);
            setAddedProducts([]);
            localStorage.removeItem(localStorageKey);
            showMessage('¡Stock actualizado exitosamente en la base de datos!', 'success');
            fetchProducts(); // Actualizar la lista de productos
        } catch (error) {
            console.error('Error al finalizar stock:', error);
            const errorMsg = error.response?.data?.message || 'Ocurrió un error al guardar.';
            showMessage(`Error: ${errorMsg}. Revisa los permisos o la consola.`, 'error');
        } finally {
            setIsFinalizing(false);
        }
    }, [addedProducts, config, API_URL, fetchProducts, localStorageKey]);

    // Resto de funciones del StockControl (se mantienen igual)
    const handleEditClick = useCallback((product) => {
        setEditingProduct({
            ...product,
            price: product.price.toString(),
            stock: product.stock.toString(),
            stockUnit: product.stock_unit || 'Unidad',
            description: product.description || '',
        });
    }, []);

    const handleUpdateProduct = useCallback(async () => {
        if (!editingProduct) return;

        if (!editingProduct.sku || !editingProduct.name || editingProduct.price === '' || editingProduct.stock === '') {
            showMessage('Por favor, completa todos los campos para actualizar.', 'error');
            return;
        }

        try {
            const productToUpdate = {
                id: editingProduct.id,
                sku: editingProduct.sku,
                name: editingProduct.name,
                description: editingProduct.description || '',
                price: parseFloat(editingProduct.price),
                stock: editingProduct.stockUnit === 'Kilos' ? parseFloat(editingProduct.stock) : parseInt(editingProduct.stock),
                stockUnit: editingProduct.stockUnit,
                user_id: currentUserId,
                categoria_id: editingProduct.categoria_id ? parseInt(editingProduct.categoria_id) : null,
                purchase_price: parseFloat(editingProduct.price) * 0.7
            };

            await axios.post(`${API_URL}/products/upsert`, productToUpdate, config);
            setEditingProduct(null);
            showMessage('Producto actualizado con éxito', 'updated');
            fetchProducts();
        } catch (error) {
            console.error('Error updating product:', error);
            if (error.response?.status === 403) {
                showPermissionDenied('can_edit_products');
            } else if (error.response?.data?.message) {
                showMessage(`Error: ${error.response.data.message}`, 'error');
            } else {
                showMessage('Error al actualizar el producto. Por favor, inténtalo de nuevo.', 'error');
            }
        }
    }, [editingProduct, currentUserId, config, showMessage, fetchProducts, API_URL]);

    const handleCancelEdit = useCallback(() => {
        setEditingProduct(null);
    }, []);

    const handleConfirmDeleteProduct = useCallback((product) => {
        setProductToDelete(product);
        setShowDeleteProductModal(true);
    }, []);

    const handleDeleteProductConfirmed = useCallback(async () => {
        if (!productToDelete) return;

        try {
            await axios.delete(`${API_URL}/products/${productToDelete.id}`, config);
            fetchProducts();
            setShowDeleteProductModal(false);
            showMessage('Producto eliminado con éxito', 'deleted');
            setProductToDelete(null);
        } catch (error) {
            console.error('Error deleting product:', error);
            if (error.response?.status === 403) {
                showPermissionDenied('can_delete_products');
                setShowDeleteProductModal(false);
            } else {
                showMessage('Error al eliminar el producto. Intenta de nuevo.', 'error');
            }
        }
    }, [productToDelete, config, fetchProducts, API_URL]);

    const handleCancelDeleteProduct = useCallback(() => {
        setShowDeleteProductModal(false);
        setProductToDelete(null);
    }, []);

    const handleNewCategoryChange = useCallback((e) => {
        setNewCategoryName(e.target.value);
    }, []);

    const handleAddCategory = useCallback(async () => {
        if (!newCategoryName.trim()) {
            showMessage('El nombre de la categoría no puede estar vacío.', 'error');
            return;
        }
        try {
            await axios.post(`${API_URL}/categories`, { nombre: newCategoryName }, config);
            showMessage(`Categoría "${newCategoryName}" agregada con éxito`, 'added');
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            console.error('Error adding category:', error);
            showMessage('Error al agregar la categoría. Por favor, inténtalo de nuevo.', 'error');
        }
    }, [newCategoryName, config, fetchCategories, API_URL]);

    const handleToggleCategoryManagement = useCallback(() => {
        setShowCategoryManagement(prev => !prev);
    }, []);

    const handleConfirmDeleteCategory = useCallback((category) => {
        setCategoryToDelete(category);
        setShowDeleteCategoryModal(true);
    }, []);

    const handleDeleteCategory = useCallback(async () => {
        try {
            await axios.delete(`${API_URL}/categories/${categoryToDelete.id}`, config);
            setShowDeleteCategoryModal(false);
            setCategoryToDelete(null);
            showMessage('Categoría eliminada con éxito', 'deleted');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            if (error.response?.status === 404) {
                showMessage('La categoría no se encontró.', 'error');
            } else {
                showMessage('Error al eliminar la categoría. Intenta de nuevo.', 'error');
            }
        }
    }, [categoryToDelete, config, fetchCategories, API_URL]);

    const handleCancelDeleteCategory = useCallback(() => {
        setShowDeleteCategoryModal(false);
        setCategoryToDelete(null);
    }, []);

    const formatStock = useCallback((stock) => Number(stock).toLocaleString('es-CL'), []);

    // Renderizado principal
    if (showFullStock) {
        return (
            <div className="posContainerMain">
                <div className="posSection">
                    <div className="section-header">
                        <h3 className="sectionTitle">Inventario Completo</h3>
                        <button className="button back-button" onClick={() => setShowFullStock(false)}>
                            ← Volver al Control de Inventario
                        </button>
                    </div>

                    <div className="posItem">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, SKU o categoría"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="full-stock-container">
                        <ProductList
                            products={filteredProducts}
                            showFullStock={showFullStock}
                            editingProduct={editingProduct}
                            onEditChange={handleEditChange}
                            onUpdateProduct={handleUpdateProduct}
                            onCancelEdit={handleCancelEdit}
                            onEditClick={handleEditClick}
                            onConfirmDeleteProduct={handleConfirmDeleteProduct}
                            formatStock={formatStock}
                            categories={categories}
                            isLoading={isLoading}
                        />
                    </div>
                    <Modals
                        showDeleteCategoryModal={showDeleteCategoryModal}
                        categoryToDelete={categoryToDelete}
                        showDeleteProductModal={showDeleteProductModal}
                        productToDelete={productToDelete}
                        showAllProducts={showAllProducts}
                        addedProducts={addedProducts}
                        onCancelDeleteCategory={handleCancelDeleteCategory}
                        onDeleteCategory={handleDeleteCategory}
                        onCancelDeleteProduct={handleCancelDeleteProduct}
                        onDeleteProductConfirmed={handleDeleteProductConfirmed}
                        onCloseAllProducts={() => setShowAllProducts(false)}
                    />
                    <PermissionDeniedModal
                        show={showPermissionModal}
                        onClose={() => setShowPermissionModal(false)}
                        requiredPermission={requiredPermission}
                        currentUser={currentUser}
                    />
                </div>
            </div>
        );
    }

    const latestProducts = products.slice(0, 5);

    return (
        <div className="posContainerMain">
            <div className="posSection">
                <h3 className="sectionTitle">Control de Inventario</h3>
                {showSuccessMessage && (
                    <div className={`success-message ${actionType}`}>
                        <span className="message-icon">
                            {actionType === 'added' && '✓'}
                            {actionType === 'updated' && '✎'}
                            {actionType === 'deleted' && '🗑️'}
                            {actionType === 'error' && '❌'}
                        </span>
                        {successMessage}
                    </div>
                )}
                
                <div className="posCardsContainer">
                    <ProductForm
                        formData={formData}
                        categories={categories}
                        products={products}
                        onFormChange={handleFormChange}
                        onSkuSearch={handleSkuSearch}
                        onAddOrUpdateProduct={handleAddOrUpdateProduct}
                    />
                    
                    <CategoryForm
                        newCategoryName={newCategoryName}
                        categories={categories}
                        showCategoryManagement={showCategoryManagement}
                        onNewCategoryChange={handleNewCategoryChange}
                        onAddCategory={handleAddCategory}
                        onToggleCategoryManagement={handleToggleCategoryManagement}
                        onConfirmDeleteCategory={handleConfirmDeleteCategory}
                    />
                    
                    {/* 🔹 Nuevo componente SuperStock */}
                    <SuperStockForm
                        superStockData={superStockData}
                        categories={categories}
                        onSuperStockChange={handleSuperStockChange}
                        onSkuSearch={handleSuperStockSkuSearch}
                        onAddToTempList={handleAddToTempList}
                        existingProduct={existingProduct}
                        purchasePrice={purchasePrice}
                        profitPercentage={profitPercentage}
                        calculatedProfitPercentage={calculatedProfitPercentage}
                        calculationMode={calculationMode}
                        onPurchasePriceChange={(e) => setPurchasePrice(e.target.value)}
                        onProfitPercentageChange={(e) => setProfitPercentage(e.target.value)}
                        onCalculationModeChange={(e) => setCalculationMode(e.target.value)}
                        addedProducts={addedProducts}
                        onFinalizeStock={handleFinalizeStock}
                        isFinalizing={isFinalizing}
                        onShowAllProducts={() => setShowAllProducts(true)}
                        tempProductsCount={addedProducts.length}
                    />
                </div>
                
                <div className="form-card latest-products">
                    <ProductList
                        products={latestProducts}
                        title="Últimos Productos Agregados"
                        showFullStock={showFullStock}
                        editingProduct={editingProduct}
                        onEditChange={handleEditChange}
                        onUpdateProduct={handleUpdateProduct}
                        onCancelEdit={handleCancelEdit}
                        onEditClick={handleEditClick}
                        onConfirmDeleteProduct={handleConfirmDeleteProduct}
                        formatStock={formatStock}
                        categories={categories}
                        isLoading={isLoading}
                    />
                </div>
                
                <button className="button show-full-stock-button" onClick={() => setShowFullStock(true)}>
                    Ver Inventario Completo ({products.length} productos)
                </button>
                
                <Modals
                    showDeleteCategoryModal={showDeleteCategoryModal}
                    categoryToDelete={categoryToDelete}
                    showDeleteProductModal={showDeleteProductModal}
                    productToDelete={productToDelete}
                    showAllProducts={showAllProducts}
                    addedProducts={addedProducts}
                    onCancelDeleteCategory={handleCancelDeleteCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onCancelDeleteProduct={handleCancelDeleteProduct}
                    onDeleteProductConfirmed={handleDeleteProductConfirmed}
                    onCloseAllProducts={() => setShowAllProducts(false)}
                />
                
                <PermissionDeniedModal
                    show={showPermissionModal}
                    onClose={() => setShowPermissionModal(false)}
                    requiredPermission={requiredPermission}
                    currentUser={currentUser}
                />
            </div>
        </div>
    );
};

export default StockControl;