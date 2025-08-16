import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './EventTemplateModal.module.css';

interface EventTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: EventTemplateData) => Promise<void>;
  editingTemplate?: EventTemplateData | null;
}

export interface EventTemplateData {
  id?: string;
  name: string;
  description: string;
  event_type: string;
  color: string;
  duration_minutes: number;
  default_title: string;
  default_description: string;
  is_all_day: boolean;
  is_shared: boolean;
  is_recurring: boolean;
  default_recurrence_rule: any;
  tags: string[];
}

const EVENT_TYPES = [
  { value: 'custom', label: 'Пользовательский' },
  { value: 'plan', label: 'План' },
  { value: 'memory', label: 'Воспоминание' },
  { value: 'anniversary', label: 'Годовщина' },
  { value: 'birthday', label: 'День рождения' },
  { value: 'travel', label: 'Путешествие' },
  { value: 'date', label: 'Свидание' },
  { value: 'gift', label: 'Подарок' },
  { value: 'deadline', label: 'Дедлайн' }
];

const EventTemplateModal: React.FC<EventTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTemplate
}) => {
  const [formData, setFormData] = useState<EventTemplateData>({
    name: '',
    description: '',
    event_type: 'custom',
    color: '#D97A6C',
    duration_minutes: 60,
    default_title: '',
    default_description: '',
    is_all_day: false,
    is_shared: false,
    is_recurring: false,
    default_recurrence_rule: null,
    tags: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        ...editingTemplate,
        tags: editingTemplate.tags || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        event_type: 'custom',
        color: '#D97A6C',
        duration_minutes: 60,
        default_title: '',
        default_description: '',
        is_all_day: false,
        is_shared: false,
        is_recurring: false,
        default_recurrence_rule: null,
        tags: []
      });
    }
    setErrors({});
  }, [editingTemplate, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (formData.duration_minutes < 5 || formData.duration_minutes > 1440) {
      newErrors.duration_minutes = 'От 5 минут до 24 часов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении шаблона:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof EventTemplateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.content}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="Название шаблона"
                  className={errors.name ? styles.error : ''}
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              <div className={styles.field}>
                <label>Тип события</label>
                <select
                  value={formData.event_type}
                  onChange={e => handleInputChange('event_type', e.target.value)}
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Цвет</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => handleInputChange('color', e.target.value)}
                  className={styles.colorInput}
                />
              </div>

              <div className={styles.field}>
                <label>Заголовок по умолчанию</label>
                <input
                  type="text"
                  value={formData.default_title}
                  onChange={e => handleInputChange('default_title', e.target.value)}
                  placeholder="Заголовок для событий"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_all_day}
                    onChange={e => handleInputChange('is_all_day', e.target.checked)}
                  />
                  Весь день
                </label>

                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_shared}
                    onChange={e => handleInputChange('is_shared', e.target.checked)}
                  />
                  Общий
                </label>
              </div>

              {!formData.is_all_day && (
                <div className={styles.field}>
                  <label>Длительность (мин)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={formData.duration_minutes}
                    onChange={e => handleInputChange('duration_minutes', parseInt(e.target.value) || 60)}
                    className={errors.duration_minutes ? styles.error : ''}
                  />
                  {errors.duration_minutes && <span className={styles.errorText}>{errors.duration_minutes}</span>}
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : (editingTemplate ? 'Обновить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventTemplateModal;