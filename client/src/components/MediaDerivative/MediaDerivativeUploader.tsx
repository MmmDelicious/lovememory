import React, { useState } from 'react';
import mediaService from '../../services/media.service';
import styles from './MediaDerivativeUploader.module.css';

interface MediaDerivativeUploaderProps {
  mediaId: string;
  onUpload?: (derivative: any) => void;
  onClose?: () => void;
  allowedTypes?: string[];
}

const DERIVATIVE_TYPES = [
  { value: 'thumbnail', label: '🖼️ Миниатюра', description: 'Маленькое превью изображения (обычно 150×150)' },
  { value: 'preview', label: '👁️ Превью', description: 'Среднее изображение для предварительного просмотра' },
  { value: 'optimized', label: '⚡ Оптимизированный', description: 'Оптимизированная версия для быстрой загрузки' },
  { value: 'webp', label: '🌐 WebP', description: 'Современный формат с лучшим сжатием' },
  { value: 'blur_hash', label: '🌫️ Blur Hash', description: 'Размытый хеш для мгновенной загрузки' }
];

export const MediaDerivativeUploader: React.FC<MediaDerivativeUploaderProps> = ({
  mediaId,
  onUpload,
  onClose,
  allowedTypes = DERIVATIVE_TYPES.map(t => t.value)
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [derivativeType, setDerivativeType] = useState<string>('thumbnail');
  const [options, setOptions] = useState({
    width: 150,
    height: 150,
    quality: 80,
    format: 'jpeg'
  });
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Автоматически устанавливаем параметры на основе типа
    if (derivativeType === 'thumbnail') {
      setOptions(prev => ({ ...prev, width: 150, height: 150, quality: 80 }));
    } else if (derivativeType === 'preview') {
      setOptions(prev => ({ ...prev, width: 800, height: 600, quality: 90 }));
    } else if (derivativeType === 'webp') {
      setOptions(prev => ({ ...prev, format: 'webp', quality: 80 }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !derivativeType) {
      alert('Выберите файл и тип производного');
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (derivativeType === 'thumbnail') {
        result = await mediaService.createThumbnail(
          mediaId, 
          selectedFile, 
          options.width, 
          options.height, 
          options
        );
      } else {
        result = await mediaService.createMediaDerivative(
          mediaId, 
          derivativeType, 
          selectedFile, 
          options
        );
      }
      
      onUpload?.(result.data);
      
      // Сброс формы
      setSelectedFile(null);
      setPreview(null);
      
      alert('Производный файл успешно создан!');
    } catch (error) {
      console.error('Error uploading derivative:', error);
      alert('Ошибка при создании производного файла');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBlurHash = async () => {
    setLoading(true);
    try {
      const result = await mediaService.generateBlurHash(mediaId, {
        components_x: options.width || 4,
        components_y: options.height || 3
      });
      
      onUpload?.(result.data);
      alert('Blur Hash успешно сгенерирован!');
    } catch (error) {
      console.error('Error generating blur hash:', error);
      alert('Ошибка при генерации Blur Hash');
    } finally {
      setLoading(false);
    }
  };

  const getTypeInfo = (type: string) => {
    return DERIVATIVE_TYPES.find(t => t.value === type);
  };

  const filteredTypes = DERIVATIVE_TYPES.filter(type => 
    allowedTypes.includes(type.value)
  );

  return (
    <div className={styles.uploader}>
      <div className={styles.header}>
        <h3>📤 Создать производный файл</h3>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>×</button>
        )}
      </div>

      <div className={styles.form}>
        {/* Type Selection */}
        <div className={styles.field}>
          <label className={styles.label}>Тип производного файла</label>
          <div className={styles.typeSelection}>
            {filteredTypes.map(type => (
              <div
                key={type.value}
                className={`${styles.typeOption} ${
                  derivativeType === type.value ? styles.selected : ''
                }`}
                onClick={() => setDerivativeType(type.value)}
              >
                <div className={styles.typeLabel}>{type.label}</div>
                <div className={styles.typeDescription}>{type.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Special handling for Blur Hash */}
        {derivativeType === 'blur_hash' ? (
          <div className={styles.blurHashSection}>
            <div className={styles.field}>
              <label className={styles.label}>Настройки Blur Hash</label>
              <div className={styles.blurHashOptions}>
                <div className={styles.optionGroup}>
                  <label>Компоненты X:</label>
                  <input
                    type="number"
                    value={options.width}
                    onChange={(e) => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    min="1"
                    max="9"
                    className={styles.numberInput}
                  />
                </div>
                <div className={styles.optionGroup}>
                  <label>Компоненты Y:</label>
                  <input
                    type="number"
                    value={options.height}
                    onChange={(e) => setOptions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    min="1"
                    max="9"
                    className={styles.numberInput}
                  />
                </div>
              </div>
              <div className={styles.hint}>
                Blur Hash генерируется автоматически из оригинального изображения
              </div>
            </div>
            
            <div className={styles.actions}>
              <button
                onClick={handleGenerateBlurHash}
                disabled={loading}
                className={styles.generateButton}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Генерируем...
                  </>
                ) : (
                  '🌫️ Сгенерировать Blur Hash'
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* File Upload */}
            <div className={styles.field}>
              <label className={styles.label}>Файл изображения</label>
              <div
                className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {preview ? (
                  <div className={styles.previewContainer}>
                    <img src={preview} alt="Preview" className={styles.previewImage} />
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{selectedFile?.name}</span>
                      <span className={styles.fileSize}>
                        {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0'} МБ
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                      className={styles.removeFileButton}
                    >
                      ❌ Удалить
                    </button>
                  </div>
                ) : (
                  <div className={styles.dropContent}>
                    <div className={styles.dropIcon}>📁</div>
                    <p>Перетащите изображение сюда или нажмите для выбора</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className={styles.fileInput}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            {selectedFile && (
              <div className={styles.field}>
                <label className={styles.label}>Настройки</label>
                <div className={styles.optionsGrid}>
                  {(derivativeType === 'thumbnail' || derivativeType === 'preview') && (
                    <>
                      <div className={styles.optionGroup}>
                        <label>Ширина:</label>
                        <input
                          type="number"
                          value={options.width}
                          onChange={(e) => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                          className={styles.numberInput}
                        />
                      </div>
                      <div className={styles.optionGroup}>
                        <label>Высота:</label>
                        <input
                          type="number"
                          value={options.height}
                          onChange={(e) => setOptions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                          className={styles.numberInput}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className={styles.optionGroup}>
                    <label>Качество:</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={options.quality}
                      onChange={(e) => setOptions(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                      className={styles.rangeInput}
                    />
                    <span>{options.quality}%</span>
                  </div>
                  
                  <div className={styles.optionGroup}>
                    <label>Формат:</label>
                    <select
                      value={options.format}
                      onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value }))}
                      className={styles.selectInput}
                    >
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <button
                onClick={handleUpload}
                disabled={loading || !selectedFile}
                className={styles.uploadButton}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Создаем...
                  </>
                ) : (
                  <>
                    📤 Создать {getTypeInfo(derivativeType)?.label.split(' ')[1]}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
