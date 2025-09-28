import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ✅ Define la URL de tu API usando VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

// Componente para modales
const Modals = ({
    showDeleteCategoryModal,
    categoryToDelete,
    showDeleteProductModal,
    productToDelete,
    onCancelDeleteCategory,
    onDeleteCategory,
    onCancelDeleteProduct,
    onDeleteProductConfirmed
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
    </>
);

// Componente principal
const StockControl = () => {
    // Estados principales
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

    // Estados de UI
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
    const [isSearching, setIsSearching] = useState(false);
    
    // Estados para permisos
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [requiredPermission, setRequiredPermission] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

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
        // Obtener información del usuario actual desde el token
        if (token) {
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                setCurrentUser(tokenData);
            } catch (error) {
                console.error('Error decoding token:', error);
            }
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

    // Función para mostrar modal de permisos insuficientes
    const showPermissionDenied = useCallback((permission) => {
        setRequiredPermission(permission);
        setShowPermissionModal(true);
    }, []);

    // Función para manejar cambios en el formulario
    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    }, []);

    // Función para manejar cambios en la edición
    const handleEditChange = useCallback((field, value) => {
        setEditingProduct(prev => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    // Función para limpiar el formulario
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

    // Funciones para obtener datos con manejo de errores mejorado
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/stock/products`, config);
            const sortedProducts = response.data.sort((a, b) => b.id - a.id);
            setProducts(sortedProducts);
            setFilteredProducts(sortedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            if (error.response?.status === 403) {
                showPermissionDenied('can_view_products');
            } else if (error.response?.status === 401) {
                showMessage('No autorizado. Por favor, inicia sesión nuevamente.', 'error');
            } else {
                showMessage('Error al cargar productos. Verifica tu conexión.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [config]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/stock/categories`, config);
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            if (error.response?.status === 403) {
                showPermissionDenied('can_view_products');
            } else if (error.response?.status === 401) {
                showMessage('No autorizado. Por favor, inicia sesión nuevamente.', 'error');
            } else {
                showMessage('Error al cargar categorías. Verifica tu conexión.', 'error');
            }
        }
    }, [config]);

    // Búsqueda por SKU - Se ejecuta cuando el campo pierde el foco
    const handleSkuSearch = useCallback(async () => {
        const skuToSearch = formData.sku.trim();
        if (!skuToSearch) return;

        setIsSearching(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/stock/products/by-sku/${skuToSearch}`, config);
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
                showMessage('Producto encontrado. Puedes actualizar la información.', 'info');
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // Producto no encontrado - es normal, se creará uno nuevo
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
            } else {
                console.error('Error searching product:', error);
                showMessage('Error al buscar el producto. Inténtalo de nuevo.', 'error');
            }
        } finally {
            setIsSearching(false);
        }
    }, [formData.sku, config]);

    // Mostrar mensajes
    const showMessage = useCallback((message, type) => {
        setSuccessMessage(message);
        setActionType(type);
        setShowSuccessMessage(true);
        setTimeout(() => {
            setShowSuccessMessage(false);
            setActionType('');
        }, 4000);
    }, []);

    // Gestión de productos
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

            await axios.post(`${API_BASE_URL}/api/stock/products/upsert`, productToSave, config);

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
                } else if (error.code === 'NETWORK_ERROR') {
                    errorMessage = 'Error de conexión. Verifica tu internet.';
                }
                
                showMessage(errorMessage, 'error');
            }
        }
    }, [formData, products, currentUserId, config, showMessage, clearForm, fetchProducts]);

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

            await axios.post(`${API_BASE_URL}/api/stock/products/upsert`, productToUpdate, config);
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
    }, [editingProduct, currentUserId, config, showMessage, fetchProducts]);

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
            await axios.delete(`${API_BASE_URL}/api/stock/products/${productToDelete.id}`, config);
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
    }, [productToDelete, config, fetchProducts]);

    const handleCancelDeleteProduct = useCallback(() => {
        setShowDeleteProductModal(false);
        setProductToDelete(null);
    }, []);

    // Gestión de categorías
    const handleNewCategoryChange = useCallback((e) => {
        setNewCategoryName(e.target.value);
    }, []);

    const handleAddCategory = useCallback(async () => {
        if (!newCategoryName.trim()) {
            showMessage('El nombre de la categoría no puede estar vacío.', 'error');
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/api/stock/categories`, { nombre: newCategoryName }, config);
            showMessage(`Categoría "${newCategoryName}" agregada con éxito`, 'added');
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            console.error('Error adding category:', error);
            showMessage('Error al agregar la categoría. Por favor, inténtalo de nuevo.', 'error');
        }
    }, [newCategoryName, config, fetchCategories]);

    const handleToggleCategoryManagement = useCallback(() => {
        setShowCategoryManagement(prev => !prev);
    }, []);

    const handleConfirmDeleteCategory = useCallback((category) => {
        setCategoryToDelete(category);
        setShowDeleteCategoryModal(true);
    }, []);

    const handleDeleteCategory = useCallback(async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/stock/categories/${categoryToDelete.id}`, config);
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
    }, [categoryToDelete, config, fetchCategories]);

    const handleCancelDeleteCategory = useCallback(() => {
        setShowDeleteCategoryModal(false);
        setCategoryToDelete(null);
    }, []);

    // Utilidades
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
                        onCancelDeleteCategory={handleCancelDeleteCategory}
                        onDeleteCategory={handleDeleteCategory}
                        onCancelDeleteProduct={handleCancelDeleteProduct}
                        onDeleteProductConfirmed={handleDeleteProductConfirmed}
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
                            {actionType === 'info' && 'ℹ️'}
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
                        isSearching={isSearching}
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
                    onCancelDeleteCategory={handleCancelDeleteCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onCancelDeleteProduct={handleCancelDeleteProduct}
                    onDeleteProductConfirmed={handleDeleteProductConfirmed}
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