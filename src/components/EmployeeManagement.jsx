import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaUserCog } from 'react-icons/fa';
import "./EmployeeManagement.css";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    password: '',
    confirmPassword: '',
    rol: 'vendedor'
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [permissions, setPermissions] = useState({});

  // Obtener el token del localStorage
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // ✅ URL base de la API
  const API_BASE = 'http://localhost:4000/api';

  // Permisos disponibles
  const availablePermissions = {
    can_view_products: 'Ver productos',
    can_edit_products: 'Editar productos',
    can_delete_products: 'Eliminar productos',
    can_create_products: 'Crear productos',
    can_view_sales: 'Ver ventas',
    can_create_sales: 'Crear ventas',
    can_view_customers: 'Ver clientes',
    can_edit_customers: 'Editar clientes',
    can_view_reports: 'Ver reportes',
    can_manage_stock: 'Gestionar stock'
  };

  // Traer empleados
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_BASE}/usuarios`, config);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      setMessage({ text: 'Error al obtener empleados. Inicie sesión nuevamente.', type: 'error' });
    }
  };

  // Cargar permisos de un empleado
  const loadPermissions = async (employeeId) => {
    try {
      const response = await axios.get(`${API_BASE}/permissions/${employeeId}`, config);
      setPermissions(response.data.permissions || {});
    } catch (error) {
      // Si no hay permisos guardados, establecer permisos por defecto
      setPermissions({
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
      });
    }
  };

  useEffect(() => {
    if (token) {
      fetchEmployees();
    } else {
      setMessage({ text: 'No está autorizado para ver esta sección. Por favor, inicie sesión.', type: 'error' });
    }
  }, [token]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.nombre || !formData.rol) {
      setMessage({ text: 'Usuario, nombre y rol son obligatorios', type: 'error' });
      return;
    }

    if (!editingId && formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Las contraseñas no coinciden', type: 'error' });
      return;
    }

    if (editingId && formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Las contraseñas no coinciden', type: 'error' });
      return;
    }

    try {
      if (editingId) {
        // Actualizar empleado
        const payload = { 
          username: formData.username,
          nombre: formData.nombre,
          rol: formData.rol
        };
        
        if (formData.password) {
          payload.password = formData.password;
        }
        
        await axios.put(`${API_BASE}/usuarios/${editingId}`, payload, config);
        setMessage({ text: 'Empleado actualizado correctamente', type: 'success' });
      } else {
        // Crear nuevo empleado
        if (!formData.password) {
          setMessage({ text: 'La contraseña es obligatoria para un nuevo empleado', type: 'error' });
          return;
        }
        await axios.post(`${API_BASE}/usuarios`, formData, config);
        setMessage({ text: 'Empleado agregado correctamente', type: 'success' });
      }

      setFormData({ username: '', nombre: '', password: '', confirmPassword: '', rol: 'vendedor' });
      setEditingId(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
      fetchEmployees();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      setMessage({ text: 'Error al guardar empleado', type: 'error' });
    }
  };

  // Manejar edición
  const handleEdit = (employee) => {
    setFormData({
      username: employee.username,
      nombre: employee.nombre,
      password: '', 
      confirmPassword: '',
      rol: employee.rol
    });
    setEditingId(employee.id);
  };

  // Abrir modal de permisos
  const openPermissionsModal = async (employee) => {
    setSelectedEmployee(employee);
    await loadPermissions(employee.id);
    setShowPermissionsModal(true);
  };

  // Cerrar modal de permisos
  const closePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedEmployee(null);
    setPermissions({});
  };

  // Manejar cambio de permisos
  const handlePermissionChange = (permissionKey, value) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: value
    }));
  };

  // Guardar permisos
  const savePermissions = async () => {
    try {
      await axios.post(`${API_BASE}/permissions`, {
        employee_id: selectedEmployee.id,
        permissions: permissions
      }, config);
      
      setMessage({ text: 'Permisos guardados correctamente', type: 'success' });
      closePermissionsModal();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      setMessage({ text: 'Error al guardar permisos', type: 'error' });
    }
  };

  // Restablecer permisos por defecto
  const setDefaultPermissions = () => {
    setPermissions({
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
    });
  };

  // Abrir modal de eliminación
  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  // Cerrar modal de eliminación
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  // Manejar eliminación
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/usuarios/${employeeToDelete.id}`, config);
      setEmployees(employees.filter(emp => emp.id !== employeeToDelete.id));
      setMessage({ text: 'Empleado eliminado correctamente', type: 'success' });
      closeDeleteModal();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      setMessage({ text: 'Error al eliminar empleado', type: 'error' });
      closeDeleteModal();
    }
  };

  // Cancelar edición
  const cancelEdit = () => {
    setFormData({ username: '', nombre: '', password: '', confirmPassword: '', rol: 'vendedor' });
    setEditingId(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="section">
      <h3>Gestión de Empleados</h3>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-card">
        <h4>{editingId ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}</h4>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usuario"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={editingId ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingId}
            />
            <button 
              type="button" 
              className="password-toggle" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder={editingId ? "Confirmar nueva contraseña" : "Repetir Contraseña"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required={!editingId}
            />
            <button 
              type="button" 
              className="password-toggle" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          <select
            value={formData.rol}
            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            required
          >
            <option value="admin">Admin</option>
            <option value="vendedor">Vendedor</option>
          </select>
          
          <div className="form-actions">
            <button type="submit" className="action-button">
              {editingId ? 'Actualizar Empleado' : 'Agregar Empleado'}
            </button>
            {editingId && (
              <button type="button" className="cancel-button" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="employees-list">
        <h4>Lista de Empleados</h4>
        <table className="employee-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>{emp.username}</td>
                <td>{emp.nombre}</td>
                <td>{emp.rol}</td>
                <td>
                  <button className="edit-button" onClick={() => handleEdit(emp)} title="Editar">
                    <FaEdit />
                  </button>
                  {emp.rol === 'vendedor' && (
                    <button className="permissions-button" onClick={() => openPermissionsModal(emp)} title="Gestionar Permisos">
                      <FaUserCog />
                    </button>
                  )}
                  <button className="delete-button" onClick={() => openDeleteModal(emp)} title="Eliminar">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de permisos */}
      {showPermissionsModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content wide-modal">
            <h3>Permisos de {selectedEmployee.nombre}</h3>
            
            <div className="permissions-grid">
              {Object.entries(availablePermissions).map(([key, label]) => (
                <div key={key} className="permission-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={permissions[key] || false}
                      onChange={(e) => handlePermissionChange(key, e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    {label}
                  </label>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="default-button" onClick={setDefaultPermissions}>
                Restablecer por Defecto
              </button>
              <button className="cancel-button" onClick={closePermissionsModal}>
                Cancelar
              </button>
              <button className="confirm-button" onClick={savePermissions}>
                Guardar Permisos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar al empleado <strong>{employeeToDelete?.nombre}</strong> ({employeeToDelete?.username})?</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={closeDeleteModal}>Cancelar</button>
              <button className="delete-confirm-button" onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;