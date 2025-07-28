import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import styles from './TodoList.module.css';

const TodoList = ({ todos, date, onTodosUpdate }) => {
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  const handleAddTodo = () => {
    if (newTodo.trim() === '') return;

    const newTodoItem = {
      id: Date.now(), // Временный ID, в реальном приложении будет генерироваться сервером
      text: newTodo.trim(),
      completed: false,
      date: date,
      createdAt: new Date().toISOString()
    };

    const updatedTodos = [...todos, newTodoItem];
    onTodosUpdate(updatedTodos);
    setNewTodo('');
    setIsAddingTodo(false);

    // TODO: Здесь будет вызов API для сохранения задачи
    console.log('Adding todo:', newTodoItem);
  };

  const handleToggleTodo = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    onTodosUpdate(updatedTodos);

    // TODO: Здесь будет вызов API для обновления статуса
    console.log('Toggling todo:', id);
  };

  const handleEditTodo = (id, text) => {
    setEditingId(id);
    setEditingText(text);
  };

  const handleSaveEdit = () => {
    if (editingText.trim() === '') return;

    const updatedTodos = todos.map(todo =>
      todo.id === editingId ? { ...todo, text: editingText.trim() } : todo
    );
    onTodosUpdate(updatedTodos);
    setEditingId(null);
    setEditingText('');

    // TODO: Здесь будет вызов API для обновления текста
    console.log('Saving edit for todo:', editingId);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleDeleteTodo = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    onTodosUpdate(updatedTodos);

    // TODO: Здесь будет вызов API для удаления задачи
    console.log('Deleting todo:', id);
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      if (action === handleSaveEdit) {
        handleCancelEdit();
      } else if (action === handleAddTodo) {
        setIsAddingTodo(false);
        setNewTodo('');
      }
    }
  };

  const completedTodos = todos.filter(todo => todo.completed);
  const pendingTodos = todos.filter(todo => !todo.completed);

  return (
    <div className={styles.todoContainer}>
      {/* Add New Todo */}
      <div className={styles.addTodoSection}>
        {!isAddingTodo ? (
          <button 
            className={styles.addButton}
            onClick={() => setIsAddingTodo(true)}
          >
            <FaPlus className={styles.addIcon} />
            Добавить задачу
          </button>
        ) : (
          <div className={styles.addTodoForm}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Введите новую задачу..."
              className={styles.addInput}
              autoFocus
              onKeyDown={(e) => handleKeyPress(e, handleAddTodo)}
            />
            <div className={styles.addActions}>
              <button
                className={styles.saveButton}
                onClick={handleAddTodo}
                disabled={newTodo.trim() === ''}
              >
                <FaSave />
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setIsAddingTodo(false);
                  setNewTodo('');
                }}
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Todo Lists */}
      <div className={styles.todoLists}>
        {/* Pending Todos */}
        {pendingTodos.length > 0 && (
          <div className={styles.todoSection}>
            <h3 className={styles.sectionTitle}>
              К выполнению ({pendingTodos.length})
            </h3>
            <div className={styles.todoList}>
              {pendingTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isEditing={editingId === todo.id}
                  editingText={editingText}
                  onEditingTextChange={setEditingText}
                  onToggle={handleToggleTodo}
                  onEdit={handleEditTodo}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onDelete={handleDeleteTodo}
                  onKeyPress={handleKeyPress}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Todos */}
        {completedTodos.length > 0 && (
          <div className={styles.todoSection}>
            <h3 className={styles.sectionTitle}>
              Выполнено ({completedTodos.length})
            </h3>
            <div className={styles.todoList}>
              {completedTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isEditing={editingId === todo.id}
                  editingText={editingText}
                  onEditingTextChange={setEditingText}
                  onToggle={handleToggleTodo}
                  onEdit={handleEditTodo}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onDelete={handleDeleteTodo}
                  onKeyPress={handleKeyPress}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todos.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              <FaPlus className={styles.emptyIcon} />
              <p>Задач на этот день пока нет</p>
              <p className={styles.emptySubtext}>
                Добавьте первую задачу, чтобы начать планирование дня
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// TodoItem Component
const TodoItem = ({
  todo,
  isEditing,
  editingText,
  onEditingTextChange,
  onToggle,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onKeyPress
}) => {
  return (
    <div className={`${styles.todoItem} ${todo.completed ? styles.completed : ''}`}>
      <div className={styles.todoContent}>
        {/* Checkbox */}
        <button
          className={styles.checkbox}
          onClick={() => onToggle(todo.id)}
          aria-label={todo.completed ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
        >
          {todo.completed && <FaCheck className={styles.checkIcon} />}
        </button>

        {/* Todo Text */}
        {isEditing ? (
          <input
            type="text"
            value={editingText}
            onChange={(e) => onEditingTextChange(e.target.value)}
            className={styles.editInput}
            autoFocus
            onKeyDown={(e) => onKeyPress(e, onSaveEdit)}
          />
        ) : (
          <span 
            className={styles.todoText}
            onClick={() => onEdit(todo.id, todo.text)}
          >
            {todo.text}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className={styles.todoActions}>
        {isEditing ? (
          <>
            <button
              className={styles.actionButton}
              onClick={onSaveEdit}
              disabled={editingText.trim() === ''}
            >
              <FaSave />
            </button>
            <button
              className={styles.actionButton}
              onClick={onCancelEdit}
            >
              <FaTimes />
            </button>
          </>
        ) : (
          <>
            <button
              className={styles.actionButton}
              onClick={() => onEdit(todo.id, todo.text)}
            >
              <FaEdit />
            </button>
            <button
              className={styles.actionButton}
              onClick={() => onDelete(todo.id)}
            >
              <FaTrash />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TodoList; 