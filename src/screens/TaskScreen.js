import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNode, updateTask, updateNode, deleteNode } from '../services/storageService';

function TaskScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await getNode(id);
      setTask(data);
    };
    load();
  }, [id]);

  const handleToggle = async () => {
    if (window.confirm(`¿Marcar como ${task.isCompleted ? 'incompleta' : 'completa'}?`)) {
      const updated = await updateTask(id, { isCompleted: !task.isCompleted });
      setTask(updated);
    }
  };

  const handleEditTask = async () => {
    const name = prompt('Editar nombre de la tarea', task.name);
    if (!name) return;
    const description = prompt('Editar descripción', task.description || '') || '';
    const updated = await updateNode(id, { name, description });
    setTask(updated);
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    await deleteNode(id);
    navigate(-1);
  };

  if (!task) return <div className="container">Cargando...</div>;

  return (
    <div className="container">
      <button className="secundario" onClick={() => navigate(-1)}>← Volver</button>
      <h1>📋 {task.name}</h1>
      {task.image && <img src={task.image} alt="Portada" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />}
      <p style={{ color: '#E0E0E0' }}>{task.description || 'Sin descripción'}</p>
      <p><strong>Estado:</strong> {task.isCompleted ? '✅ Completada' : '⏳ Pendiente'}</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
        <button className={task.isCompleted ? 'peligro' : 'exito'} onClick={handleToggle}>
          {task.isCompleted ? 'Marcar como incompleta' : 'Marcar como completa'}
        </button>
        <button className="secundario" onClick={handleEditTask}>Editar</button>
        <button className="peligro" onClick={handleDeleteTask}>Eliminar</button>
      </div>
    </div>
  );
}

export default TaskScreen;