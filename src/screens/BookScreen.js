// src/screens/BookScreen.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNode, getChildren, addChild, updateTask, updateAlarm, updateNode, deleteNode } from '../services/storageService';
import { SubBook, Alarm, Task } from '../models/types';
import Tarjeta from '../components/Tarjeta';
import Modal from '../components/Modal';
import { SOUNDS } from '../constants/sounds';

function BookScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [children, setChildren] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('subbook');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    alarmTime: '',
    soundType: 'default',
    soundId: SOUNDS[0].id,
    soundFile: null,
    repeatType: 'once',
    repeatInterval: 1
  });

  const loadData = async () => {
    const bookData = await getNode(id);
    setBook(bookData);
    if (bookData) {
      const childList = await getChildren(id);
      setChildren(childList);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    let newChild;
    if (modalType === 'subbook') {
      newChild = new SubBook({ name: formData.name, description: formData.description, image: formData.image, parentId: id });
    } else if (modalType === 'alarm') {
      const soundData = formData.soundType === 'default'
        ? { soundId: formData.soundId, soundFile: null }
        : { soundId: null, soundFile: formData.soundFile };
      newChild = new Alarm({
        name: formData.name,
        description: formData.description,
        image: formData.image,
        parentId: id,
        alarmTime: formData.alarmTime || null,
        soundType: formData.soundType,
        ...soundData,
        repeatType: formData.repeatType,
        repeatInterval: formData.repeatType === 'once' ? null : parseInt(formData.repeatInterval)
      });
    } else if (modalType === 'task') {
      newChild = new Task({ name: formData.name, description: formData.description, image: formData.image, parentId: id });
    }
    await addChild(id, newChild, modalType);
    setShowModal(false);
    setFormData({ name: '', description: '', image: null, alarmTime: '', soundType: 'default', soundId: SOUNDS[0].id, soundFile: null, repeatType: 'once', repeatInterval: 1 });
    loadData();
  };

  const handleClickChild = (child) => {
    if (child.type === 'subbook') navigate(`/subbook/${child.id}`);
    else if (child.type === 'alarm') navigate(`/alarm/${child.id}`);
    else if (child.type === 'task') navigate(`/task/${child.id}`);
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    if (window.confirm(currentStatus ? '¿Desmarcar como completada?' : '¿Marcar como completada?')) {
      await updateTask(taskId, { isCompleted: !currentStatus });
      loadData();
    }
  };

  const handleToggleAlarm = async (alarmId, currentStatus) => {
    if (window.confirm(currentStatus ? '¿Desmarcar como completada?' : '¿Marcar como completada?')) {
      await updateAlarm(alarmId, { isCompleted: !currentStatus });
      loadData();
    }
  };

  const handleEditChild = async (child) => {
    const name = prompt('Editar nombre', child.name);
    if (!name) return;
    const description = prompt('Editar descripción', child.description || '') || '';
    const updates = { name, description };
    if (child.type === 'alarm') {
      const alarmTime = prompt('Editar fecha y hora (YYYY-MM-DDTHH:mm)', child.alarmTime || '');
      if (alarmTime) updates.alarmTime = alarmTime;
    }
    await updateNode(child.id, updates);
    loadData();
  };

  const handleDeleteChild = async (childId) => {
    if (!window.confirm('¿Eliminar este elemento?')) return;
    await deleteNode(childId);
    loadData();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFormData({ ...formData, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSoundFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFormData({ ...formData, soundFile: reader.result });
      reader.readAsDataURL(file);
    }
  };

  if (!book) return <div className="container">Cargando...</div>;

  return (
    <div className="container">
      <button className="secundario" onClick={() => navigate('/')}>← Volver</button>
      <h1>{book.name}</h1>
      {book.image && <img src={book.image} alt="Portada" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />}
      <p style={{ color: '#E0E0E0', marginBottom: '20px' }}>{book.description || 'Sin descripción'}</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className="primario" onClick={() => { setModalType('subbook'); setShowModal(true); }}>+ Sublibro</button>
        <button className="primario" onClick={() => { setModalType('alarm'); setShowModal(true); }}>+ Alarma</button>
        <button className="primario" onClick={() => { setModalType('task'); setShowModal(true); }}>+ Tarea</button>
      </div>

      {children.length === 0 && <p style={{ color: '#9E9E9E' }}>Este libro aún no tiene contenido.</p>}

      {children.map(child => {
        let badge = child.type;
        let className = '';
        let isCompleted = false;
        if (child.type === 'alarm') { className = 'alarma'; isCompleted = child.isCompleted; }
        else if (child.type === 'task') { className = 'tarea' + (child.isCompleted ? ' completada' : ''); isCompleted = child.isCompleted; }
        else if (child.type === 'subbook') { className = 'subbook'; }
        return (
          <Tarjeta key={child.id} onClick={() => handleClickChild(child)} badge={badge} className={className} image={child.image}>
            <h4>{child.name}</h4>
            <p>{child.description || 'Sin descripción'}</p>
            {child.type === 'alarm' && child.alarmTime && (
              <p style={{ fontSize: '12px', color: '#9E9E9E' }}>⏰ {new Date(child.alarmTime).toLocaleString()}</p>
            )}
            {(child.type === 'task' || child.type === 'alarm') && (
              <div className="tarea-botones">
                <button className="btn-incompleto" disabled={isCompleted} onClick={(e) => { e.stopPropagation(); child.type === 'task' ? handleToggleTask(child.id, isCompleted) : handleToggleAlarm(child.id, isCompleted); }}>✗ Incompleto</button>
                <button className="btn-completo" disabled={!isCompleted} onClick={(e) => { e.stopPropagation(); child.type === 'task' ? handleToggleTask(child.id, isCompleted) : handleToggleAlarm(child.id, isCompleted); }}>✓ Completo</button>
              </div>
            )}
            <div className="card-actions">
              <button className="secundario" onClick={(e) => { e.stopPropagation(); handleEditChild(child); }}>Editar</button>
              <button className="peligro" onClick={(e) => { e.stopPropagation(); handleDeleteChild(child.id); }}>Eliminar</button>
            </div>
          </Tarjeta>
        );
      })}

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h3>{modalType === 'subbook' ? 'Nuevo Sublibro' : modalType === 'alarm' ? 'Nueva Alarma' : 'Nueva Tarea'}</h3>
          <input type="text" placeholder="Nombre" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <textarea placeholder="Descripción (opcional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '12px' }} />
          {formData.image && <img src={formData.image} alt="Vista previa" style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />}

          {modalType === 'alarm' && (
            <>
              <label style={{ display: 'block', marginBottom: '4px', color: '#ccc' }}>Fecha y hora de la alarma</label>
              <input type="datetime-local" value={formData.alarmTime} onChange={(e) => setFormData({ ...formData, alarmTime: e.target.value })} style={{ marginBottom: '12px' }} />

              <label style={{ display: 'block', marginBottom: '4px', color: '#ccc' }}>Repetición</label>
              <select value={formData.repeatType} onChange={(e) => setFormData({ ...formData, repeatType: e.target.value })} style={{ marginBottom: '8px' }}>
                <option value="once">Una vez</option>
                <option value="daily">Diaria</option>
                <option value="interval_days">Cada X días</option>
                <option value="interval_minutes">Cada X minutos</option>
              </select>
              {(formData.repeatType === 'interval_days' || formData.repeatType === 'interval_minutes') && (
                <input type="number" min="1" value={formData.repeatInterval} onChange={(e) => setFormData({ ...formData, repeatInterval: e.target.value })} placeholder={formData.repeatType === 'interval_days' ? 'Días' : 'Minutos'} style={{ marginBottom: '12px' }} />
              )}

              <label style={{ display: 'block', marginBottom: '4px', color: '#ccc' }}>Sonido</label>
              <select value={formData.soundType} onChange={(e) => setFormData({ ...formData, soundType: e.target.value })} style={{ marginBottom: '8px' }}>
                <option value="default">Sonido predeterminado</option>
                <option value="upload">Subir archivo</option>
              </select>
              {formData.soundType === 'default' && (
                <select value={formData.soundId} onChange={(e) => setFormData({ ...formData, soundId: e.target.value })} style={{ marginBottom: '12px' }}>
                  {SOUNDS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
              {formData.soundType === 'upload' && (
                <input type="file" accept="audio/*" onChange={handleSoundFileChange} style={{ marginBottom: '12px' }} />
              )}
            </>
          )}

          <div className="acciones">
            <button className="secundario" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="primario" onClick={handleCreate}>Crear</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default BookScreen;