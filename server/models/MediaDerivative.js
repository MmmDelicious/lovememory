const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MediaDerivative = sequelize.define('MediaDerivative', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  source_media_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Media',
      key: 'id',
    },
  },
  derivative_type: {
    type: DataTypes.ENUM('thumbnail', 'preview', 'optimized', 'webp', 'blur_hash', 'low_quality'),
    allowNull: false,
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size_bytes: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  format: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quality: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 100
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'media_derivatives',
  indexes: [
    {
      fields: ['source_media_id'],
      name: 'idx_media_derivatives_source'
    },
    {
      fields: ['derivative_type'],
      name: 'idx_media_derivatives_type'
    },
    {
      unique: true,
      fields: ['source_media_id', 'derivative_type'],
      name: 'unique_media_derivative_type'
    },
    {
      fields: ['file_path'],
      name: 'idx_media_derivatives_path'
    }
  ]
});

// Ассоциации
MediaDerivative.associate = (models) => {
  MediaDerivative.belongsTo(models.Media, {
    foreignKey: 'source_media_id',
    as: 'SourceMedia',
    onDelete: 'CASCADE'
  });
};

// Статические методы для создания производных файлов
MediaDerivative.createDerivative = async function(sourceMediaId, derivativeType, filePath, options = {}) {
  try {
    const derivative = await this.create({
      source_media_id: sourceMediaId,
      derivative_type: derivativeType,
      file_path: filePath,
      size_bytes: options.size_bytes || 0,
      width: options.width || null,
      height: options.height || null,
      format: options.format || 'jpeg',
      quality: options.quality || null,
      metadata: options.metadata || {}
    });

    return derivative;
  } catch (error) {
    console.error('Error creating media derivative:', error);
    throw error;
  }
};

MediaDerivative.getDerivativesForMedia = async function(mediaId, derivativeType = null) {
  const where = { source_media_id: mediaId };
  if (derivativeType) {
    where.derivative_type = derivativeType;
  }

  return await this.findAll({
    where,
    include: [
      {
        model: sequelize.models.Media,
        as: 'SourceMedia',
        attributes: ['id', 'file_url', 'file_type']
      }
    ],
    order: [['derivative_type', 'ASC'], ['created_at', 'DESC']]
  });
};

MediaDerivative.getDerivativeByType = async function(mediaId, derivativeType) {
  return await this.findOne({
    where: {
      source_media_id: mediaId,
      derivative_type: derivativeType
    }
  });
};

MediaDerivative.createThumbnail = async function(sourceMediaId, filePath, width, height, options = {}) {
  return await this.createDerivative(sourceMediaId, 'thumbnail', filePath, {
    width,
    height,
    format: options.format || 'jpeg',
    quality: options.quality || 80,
    size_bytes: options.size_bytes || 0,
    metadata: {
      ...options.metadata,
      thumbnail_size: `${width}x${height}`
    }
  });
};

MediaDerivative.createPreview = async function(sourceMediaId, filePath, width, height, options = {}) {
  return await this.createDerivative(sourceMediaId, 'preview', filePath, {
    width,
    height,
    format: options.format || 'jpeg',
    quality: options.quality || 90,
    size_bytes: options.size_bytes || 0,
    metadata: {
      ...options.metadata,
      preview_size: `${width}x${height}`
    }
  });
};

MediaDerivative.createOptimized = async function(sourceMediaId, filePath, options = {}) {
  return await this.createDerivative(sourceMediaId, 'optimized', filePath, {
    width: options.width || null,
    height: options.height || null,
    format: options.format || 'jpeg',
    quality: options.quality || 85,
    size_bytes: options.size_bytes || 0,
    metadata: {
      ...options.metadata,
      optimization_level: options.optimization_level || 'medium'
    }
  });
};

MediaDerivative.createWebP = async function(sourceMediaId, filePath, options = {}) {
  return await this.createDerivative(sourceMediaId, 'webp', filePath, {
    width: options.width || null,
    height: options.height || null,
    format: 'webp',
    quality: options.quality || 80,
    size_bytes: options.size_bytes || 0,
    metadata: options.metadata || {}
  });
};

MediaDerivative.createBlurHash = async function(sourceMediaId, blurHashString, options = {}) {
  return await this.createDerivative(sourceMediaId, 'blur_hash', blurHashString, {
    format: 'hash',
    size_bytes: blurHashString.length,
    metadata: {
      ...options.metadata,
      blur_hash: blurHashString,
      components_x: options.components_x || 4,
      components_y: options.components_y || 3
    }
  });
};

// Методы экземпляра
MediaDerivative.prototype.getUrl = function(baseUrl = '/uploads') {
  if (this.derivative_type === 'blur_hash') {
    return this.file_path; // blur hash - это строка, не файл
  }
  return `${baseUrl}/${this.file_path}`;
};

MediaDerivative.prototype.isImage = function() {
  const imageFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp'];
  return imageFormats.includes(this.format.toLowerCase());
};

MediaDerivative.prototype.getDisplayInfo = function() {
  return {
    id: this.id,
    type: this.derivative_type,
    format: this.format,
    size: this.size_bytes,
    dimensions: this.width && this.height ? `${this.width}x${this.height}` : null,
    quality: this.quality,
    url: this.getUrl(),
    created: this.created_at
  };
};

// Утилитарные методы для массовых операций
MediaDerivative.bulkCreateForMedia = async function(mediaId, derivatives) {
  const transaction = await sequelize.transaction();
  
  try {
    const created = [];
    for (const derivative of derivatives) {
      const item = await this.createDerivative(
        mediaId,
        derivative.type,
        derivative.path,
        derivative.options || {}
      );
      created.push(item);
    }
    
    await transaction.commit();
    return created;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

MediaDerivative.deleteAllForMedia = async function(mediaId) {
  return await this.destroy({
    where: { source_media_id: mediaId }
  });
};

module.exports = MediaDerivative;
