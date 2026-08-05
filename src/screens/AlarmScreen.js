import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNode, updateAlarm, updateNode, deleteNode } from '../services/storageService';
import { SOUNDS } from '../constants/sounds';

function AlarmScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alarm, setAlarm] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const data = await getNode(id);
      setAlarm(data);
    };
    load();
  }, [id]);

  const shouldPlaySound = alarm && !alarm.isCompleted && (alarm.triggered || (alarm.alarmTime && new Date(alarm.alarmTime) <= new Date()));

  const scheduleNextAlarm = (alarmData) => {
    if (!alarmData) return null;
    const baseTime = alarmData.alarmTime ? new Date(alarmData.alarmTime) : new Date();
    let nextTime = null;

    if (alarmData.repeatType === 'daily') {
      nextTime = new Date(baseTime);
      nextTime.setDate(nextTime.getDate() + 1);
    } else if (alarmData.repeatType === 'interval_days') {
      nextTime = new Date(baseTime);
      nextTime.setDate(nextTime.getDate() + (alarmData.repeatInterval || 1));
    } else if (alarmData.repeatType === 'interval_minutes') {
      nextTime = new Date(baseTime);
      nextTime.setMinutes(nextTime.getMinutes() + (alarmData.repeatInterval || 1));
    }

    return nextTime ? nextTime.toISOString() : null;
  };

  useEffect(() => {
    if (!alarm || !shouldPlaySound) return;

    const playSound = async () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const soundSource = alarm.soundType === 'default'
        ? SOUNDS.find(s => s.id === alarm.soundId)?.url
        : alarm.soundFile;

      if (!soundSource) {
        setPlayError('No se encontró el sonido de la alarma.');
        setIsPlaying(false);
        return;
      }

      const audio = new Audio(soundSource);
      audio.loop = true;
      audioRef.current = audio;

      try {
        await audio.play();
        setIsPlaying(true);
        setPlayError(null);
      } catch (error) {
        setIsPlaying(false);
        setPlayError('El navegador bloqueó la reproducción automática. Haz clic para activar el sonido.');
      }
    };

    playSound();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [alarm, shouldPlaySound]);

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleToggle = async () => {
    if (window.confirm(`¿Marcar como ${alarm.isCompleted ? 'incompleta' : 'completa'}?`)) {
      const updated = await updateAlarm(id, { isCompleted: !alarm.isCompleted });
      setAlarm(updated);
    }
  };

  const handleEditAlarm = async () => {
    const name = prompt('Editar nombre de la alarma', alarm.name);
    if (!name) return;
    const description = prompt('Editar descripción', alarm.description || '') || '';
    const alarmTime = prompt('Editar fecha y hora (YYYY-MM-DDTHH:mm)', alarm.alarmTime || '');
    const updates = { name, description };
    if (alarmTime) updates.alarmTime = alarmTime;
    const updated = await updateNode(id, updates);
    setAlarm(updated);
  };

  const handleDeleteAlarm = async () => {
    if (!window.confirm('¿Eliminar esta alarma?')) return;
    await deleteNode(id);
    navigate('/');
  };

  const handleSnooze = async () => {
    stopCurrentAudio();
    const nextTime = new Date(Date.now() + 5 * 60000).toISOString();
    const updated = await updateAlarm(id, {
      alarmTime: nextTime,
      triggered: false,
      lastTriggered: new Date().toISOString()
    });
    setAlarm(updated);
  };

  const handleDismiss = async () => {
    stopCurrentAudio();
    if (alarm.repeatType === 'once') {
      const updated = await updateAlarm(id, {
        isCompleted: true,
        triggered: true,
        lastTriggered: new Date().toISOString()
      });
      setAlarm(updated);
      return;
    }

    const nextTime = scheduleNextAlarm(alarm);
    const updated = await updateAlarm(id, {
      alarmTime: nextTime,
      triggered: false,
      lastTriggered: new Date().toISOString()
    });
    setAlarm(updated);
  };

  if (!alarm) return <div className="container">Cargando...</div>;

  const soundName = alarm.soundType === 'default' 
    ? SOUNDS.find(s => s.id === alarm.soundId)?.name || 'Predeterminado'
    : 'Archivo subido';

  return (
    <div className="container">
      <button className="secundario" onClick={() => navigate(-1)}>← Volver</button>
      <h1>🔔 {alarm.name}</h1>
      {alarm.image && <img src={alarm.image} alt="Portada" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />}
      <p style={{ color: '#E0E0E0', marginBottom: '12px' }}>{alarm.description || 'Sin descripción'}</p>
      
      <div style={{ marginBottom: '12px' }}>
        <p><strong>Estado:</strong> {alarm.isCompleted ? '✅ Completada' : '⏳ Pendiente'}</p>
        {alarm.alarmTime && <p><strong>Programada:</strong> {new Date(alarm.alarmTime).toLocaleString()}</p>}
        <p><strong>Repetición:</strong> {
          alarm.repeatType === 'once' ? 'Una vez' :
          alarm.repeatType === 'daily' ? 'Diaria' :
          alarm.repeatType === 'interval_days' ? `Cada ${alarm.repeatInterval} días` :
          alarm.repeatType === 'interval_minutes' ? `Cada ${alarm.repeatInterval} minutos` : 'No definida'
        }</p>
        <p><strong>Sonido:</strong> {soundName}</p>
        {alarm.triggered && <p><strong>Última vez sonó:</strong> {new Date(alarm.lastTriggered).toLocaleString()}</p>}
        <p><strong>Reproduciendo:</strong> {isPlaying ? 'Sí' : 'No'}</p>
        {playError && <p style={{ color: '#FF8080' }}>{playError}</p>}
      </div>

      {!isPlaying && playError && (
        <button className="primario" onClick={() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setPlayError('No se pudo reproducir el sonido.'));
          }
        }}>
          Activar sonido
        </button>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
        <button className={alarm.isCompleted ? 'peligro' : 'exito'} onClick={handleToggle}>
          {alarm.isCompleted ? 'Marcar como incompleta' : 'Marcar como completa'}
        </button>
        <button className="secundario" onClick={handleEditAlarm}>Editar</button>
        <button className="peligro" onClick={handleDeleteAlarm}>Eliminar</button>
      </div>

      {(isPlaying || alarm.triggered) && !alarm.isCompleted && (
        <div className="floating-actions">
          <button className="peligro" onClick={handleDismiss}>Detener alarma</button>
          <button className="primario" onClick={handleSnooze}>Aplazar 5 min</button>
        </div>
      )}
    </div>
  );
}

export default AlarmScreen;