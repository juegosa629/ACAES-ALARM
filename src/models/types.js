import { v4 as uuidv4 } from 'uuid';

// ---------- Clase base ----------
class TreeNode {
  constructor({ id, name, description, image, parentId, type }) {
    this.id = id || uuidv4();
    this.name = name || '';
    this.description = description || '';
    this.image = image || null;
    this.parentId = parentId || null;
    this.type = type || 'book';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}

// ---------- Libro (raíz) ----------
export class Book extends TreeNode {
  constructor(data) {
    super({ ...data, type: 'book' });
    this.children = data.children || [];
  }
}

// ---------- Sublibro ----------
export class SubBook extends TreeNode {
  constructor(data) {
    super({ ...data, type: 'subbook' });
    this.children = data.children || [];
  }
}

// ---------- Alarma (con nuevos campos) ----------
export class Alarm extends TreeNode {
  constructor(data) {
    super({ ...data, type: 'alarm' });
    this.alarmTime = data.alarmTime || null;          // ISO string
    this.soundFile = data.soundFile || null;          // URL o base64
    this.soundType = data.soundType || 'default';     // 'default' | 'upload'
    this.soundId = data.soundId || null;              // id de SOUNDS si es default
    this.isCompleted = data.isCompleted || false;
    this.triggered = data.triggered || false;         // si ya sonó
    this.repeatType = data.repeatType || 'once';      // 'once' | 'daily' | 'interval_days' | 'interval_minutes'
    this.repeatInterval = data.repeatInterval || null;
    this.lastTriggered = data.lastTriggered || null;
    this.reminder = data.reminder || null;
  }
}

// ---------- Tarea ----------
export class Task extends TreeNode {
  constructor(data) {
    super({ ...data, type: 'task' });
    this.isCompleted = data.isCompleted || false;
  }
}