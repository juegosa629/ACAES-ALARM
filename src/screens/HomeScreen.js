import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadData, addRootBook, updateNode, deleteNode } from '../services/storageService';
import { Book } from '../models/types';

function HomeScreen() {
  const [books, setBooks] = useState([]);

  const loadBooks = async () => {
    const data = await loadData();
    const bookList = data.rootBookIds.map(id => data.books[id]).filter(Boolean);
    setBooks(bookList);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleAddBook = async () => {
    const name = prompt('Nombre del libro:');
    if (name) {
      const description = prompt('Descripción (opcional):') || '';
      const newBook = new Book({ name, description });
      await addRootBook(newBook);
      loadBooks();
    }
  };

  const handleEditBook = async (book) => {
    const name = prompt('Editar nombre del libro', book.name);
    if (!name) return;
    const description = prompt('Editar descripción', book.description || '') || '';
    await updateNode(book.id, { name, description });
    loadBooks();
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('¿Eliminar este libro y todo su contenido?')) return;
    await deleteNode(bookId);
    loadBooks();
  };

  return (
    <div className="container">
      <h1>ACAES alarm</h1>
      <p className="credito">Desarrollado por Xavier Vargas</p>
      <button className="primario" onClick={handleAddBook}>+ Nuevo Libro</button>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {books.map(book => (
          <li key={book.id} style={{ margin: '10px 0' }}>
            <div className="tarjeta" style={{ padding: '15px' }}>
              <Link to={`/book/${book.id}`} style={{ display: 'block', textDecoration: 'none', color: 'white' }}>
                <strong>{book.name}</strong>
                <p style={{ margin: '5px 0 0', fontSize: '0.9em', color: '#ccc' }}>{book.description || 'Sin descripción'}</p>
              </Link>
              <div className="card-actions">
                <button className="secundario" onClick={() => handleEditBook(book)}>Editar</button>
                <button className="peligro" onClick={() => handleDeleteBook(book.id)}>Eliminar</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HomeScreen;