import React, { useState, useEffect } from 'react';
import sessionService from '../../services/session.service';
import styles from './SessionStartModal.module.css';

interface SessionStartModalProps {
  pairId: string;
  onStart: (sessionData: any) => void;
  onClose: () => void;
}

const SESSION_TYPES = [
  { value: 'date', label: '💕 Свидание', description: 'Романтический вечер или времяпровождение вместе' },
  { value: 'activity', label: '🎯 Активность', description: 'Физическая активность или спорт' },
  { value: 'conversation', label: '💬 Разговор', description: 'Глубокий разговор или обсуждение' },
  { value: 'planning', label: '📋 Планирование', description: 'Планирование будущих событий' },
  { value: 'reflection', label: '🤔 Рефлексия', description: 'Обсуждение отношений и чувств' },
  { value: 'exercise', label: '🏃‍♀️ Тренировка', description: 'Совместная тренировка или упражнения' },
  { value: 'learning', label: '📚 Обучение', description: 'Изучение чего-то нового вместе' },
  { value: 'creative', label: '🎨 Творчество', description: 'Творческая деятельность' },
  { value: 'relaxation', label: '😌 Отдых', description: 'Спокойное времяпровождение' },
  { value: 'other', label: '📝 Другое', description: 'Другой тип сессии' }
];

export const SessionStartModal: React.FC<SessionStartModalProps> = ({
  pairId,
  onStart,
  onClose
}) => {
  const [formData, setFormData] = useState({
    session_type: 'date',
    title: '',
    description: '',
    goals: [] as string[],
    participants: [] as string[],
    metadata: {}
  });
  const [loading, setLoading] = useState(false);
  const [popularTypes, setPopularTypes] = useState<any[]>([]);
  const [currentGoal, setCurrentGoal] = useState('');

  useEffect(() => {
    loadPopularTypes();
  }, []);

  const loadPopularTypes = async () => {
    try {
      const response = await sessionService.getPopularSessionTypes(pairId);
      setPopularTypes(response.data || []);
    } catch (error) {
      console.error('Error loading popular types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.session_type) {
      alert('Выберите тип сессии');
      return;
    }

    setLoading(true);
    try {
      await onStart(formData);
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addGoal = () => {
    if (currentGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, currentGoal.trim()]
      }));
      setCurrentGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const getSelectedTypeInfo = () => {
    return SESSION_TYPES.find(type => type.value === formData.session_type);
  };

  const getPopularTypesForDisplay = () => {
    return popularTypes.slice(0, 3).map(pt => 
      SESSION_TYPES.find(st => st.value === pt.type)
    ).filter(Boolean);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>▶️ Начать новую сессию</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Session Type Selection */}
          <div className={styles.field}>
            <label className={styles.label}>Тип сессии *</label>
            
            {/* Popular Types Quick Select */}
            {getPopularTypesForDisplay().length > 0 && (
              <div className={styles.popularTypes}>
                <span className={styles.popularLabel}>🔥 Популярные:</span>
                <div className={styles.popularButtons}>
                  {getPopularTypesForDisplay().map(type => (
                    <button
                      key={type!.value}
                      type="button"
                      onClick={() => handleInputChange('session_type', type!.value)}
                      className={`${styles.popularButton} ${
                        formData.session_type === type!.value ? styles.selected : ''
                      }`}
                    >
                      {type!.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Types Grid */}
            <div className={styles.typeGrid}>
              {SESSION_TYPES.map(type => (
                <div
                  key={type.value}
                  className={`${styles.typeCard} ${
                    formData.session_type === type.value ? styles.selected : ''
                  }`}
                  onClick={() => handleInputChange('session_type', type.value)}
                >
                  <div className={styles.typeLabel}>{type.label}</div>
                  <div className={styles.typeDescription}>{type.description}</div>
                </div>
              ))}
            </div>

            {/* Selected Type Info */}
            {getSelectedTypeInfo() && (
              <div className={styles.selectedTypeInfo}>
                <strong>{getSelectedTypeInfo()!.label}</strong>
                <span>{getSelectedTypeInfo()!.description}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div className={styles.field}>
            <label className={styles.label}>Название сессии</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={`Например: "Прогулка в парке" или "Планирование отпуска"`}
              className={styles.input}
            />
            <div className={styles.hint}>
              Оставьте пустым для автоматического названия
            </div>
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label className={styles.label}>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Что планируете делать во время сессии?"
              className={styles.textarea}
              rows={3}
            />
          </div>

          {/* Goals */}
          <div className={styles.field}>
            <label className={styles.label}>🎯 Цели сессии</label>
            <div className={styles.goalInput}>
              <input
                type="text"
                value={currentGoal}
                onChange={(e) => setCurrentGoal(e.target.value)}
                placeholder="Добавить цель..."
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
              />
              <button
                type="button"
                onClick={addGoal}
                disabled={!currentGoal.trim()}
                className={styles.addButton}
              >
                ➕
              </button>
            </div>
            
            {formData.goals.length > 0 && (
              <div className={styles.goalsList}>
                {formData.goals.map((goal, index) => (
                  <div key={index} className={styles.goalItem}>
                    <span>{goal}</span>
                    <button
                      type="button"
                      onClick={() => removeGoal(index)}
                      className={styles.removeButton}
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.startButton}
              disabled={loading || !formData.session_type}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Создаем...
                </>
              ) : (
                <>
                  ▶️ Начать сессию
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
