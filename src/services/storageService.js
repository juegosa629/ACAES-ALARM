import localforage from 'localforage';

const storage = localforage.createInstance({
  name: 'GestorJerarquico',
  storeName: 'data',
});

const KEY = 'appData';

export async function loadData() {
  const data = await storage.getItem(KEY);
  if (!data) {
    return { books: {}, subbooks: {}, alarms: {}, tasks: {}, rootBookIds: [] };
  }
  return data;
}

export async function saveData(data) {
  await storage.setItem(KEY, data);
}

export async function addRootBook(book) {
  const data = await loadData();
  data.books[book.id] = book;
  data.rootBookIds.push(book.id);
  await saveData(data);
  return book;
}

export async function addChild(parentId, child, childType) {
  const data = await loadData();
  if (childType === 'subbook') {
    data.subbooks[child.id] = child;
  } else if (childType === 'alarm') {
    data.alarms[child.id] = child;
  } else if (childType === 'task') {
    data.tasks[child.id] = child;
  }
  const parent = data.books[parentId] || data.subbooks[parentId];
  if (parent) {
    parent.children = parent.children || [];
    parent.children.push(child.id);
    if (data.books[parentId]) {
      data.books[parentId] = parent;
    } else if (data.subbooks[parentId]) {
      data.subbooks[parentId] = parent;
    }
  }
  await saveData(data);
  return child;
}

export async function getNode(id) {
  const data = await loadData();
  return data.books[id] || data.subbooks[id] || data.alarms[id] || data.tasks[id] || null;
}

export async function getAllAlarms() {
  const data = await loadData();
  return Object.values(data.alarms || {});
}

export async function getChildren(parentId) {
  const data = await loadData();
  const parent = data.books[parentId] || data.subbooks[parentId];
  if (!parent || !parent.children) return [];
  const children = [];
  for (const childId of parent.children) {
    const child = data.books[childId] || data.subbooks[childId] || data.alarms[childId] || data.tasks[childId];
    if (child) children.push(child);
  }
  return children;
}

export async function updateTask(taskId, updates) {
  const data = await loadData();
  if (data.tasks[taskId]) {
    data.tasks[taskId] = { ...data.tasks[taskId], ...updates };
    await saveData(data);
    return data.tasks[taskId];
  }
  return null;
}

export async function updateAlarm(alarmId, updates) {
  const data = await loadData();
  if (data.alarms[alarmId]) {
    data.alarms[alarmId] = { ...data.alarms[alarmId], ...updates };
    await saveData(data);
    return data.alarms[alarmId];
  }
  return null;
}

export async function updateNode(id, updates) {
  const data = await loadData();
  const collections = ['books', 'subbooks', 'alarms', 'tasks'];
  for (const collection of collections) {
    if (data[collection][id]) {
      data[collection][id] = { ...data[collection][id], ...updates };
      await saveData(data);
      return data[collection][id];
    }
  }
  return null;
}

export async function deleteNode(id) {
  const data = await loadData();

  const removeFromParent = (nodeId) => {
    const node = data.books[nodeId] || data.subbooks[nodeId] || data.alarms[nodeId] || data.tasks[nodeId];
    if (!node || !node.parentId) return;
    const parent = data.books[node.parentId] || data.subbooks[node.parentId];
    if (!parent || !parent.children) return;
    parent.children = parent.children.filter(childId => childId !== nodeId);
    if (data.books[parent.id]) data.books[parent.id] = parent;
    if (data.subbooks[parent.id]) data.subbooks[parent.id] = parent;
  };

  const recursiveDelete = (nodeId) => {
    const node = data.books[nodeId] || data.subbooks[nodeId] || data.alarms[nodeId] || data.tasks[nodeId];
    if (!node) return;

    if (node.type === 'book') {
      (node.children || []).forEach(childId => recursiveDelete(childId));
      delete data.books[nodeId];
      data.rootBookIds = data.rootBookIds.filter(bookId => bookId !== nodeId);
      return;
    }

    if (node.type === 'subbook') {
      (node.children || []).forEach(childId => recursiveDelete(childId));
      removeFromParent(nodeId);
      delete data.subbooks[nodeId];
      return;
    }

    if (node.type === 'alarm') {
      removeFromParent(nodeId);
      delete data.alarms[nodeId];
      return;
    }

    if (node.type === 'task') {
      removeFromParent(nodeId);
      delete data.tasks[nodeId];
      return;
    }
  };

  recursiveDelete(id);
  await saveData(data);
}
