const { MediaDerivative, Media, Event, Pair } = require('../models');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/derivatives/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.mediaId}-${req.body.derivative_type}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

class MediaDerivativeController {
  // Middleware для загрузки файлов
  static getUploadMiddleware() {
    return upload.single('file');
  }

  // Проверка доступа к медиафайлу
  async checkMediaAccess(mediaId, userId) {
    const media = await Media.findByPk(mediaId, {
      include: [
        {
          model: Event,
          as: 'Event',
          include: [
            {
              model: Pair,
              as: 'Pair'
            }
          ]
        }
      ]
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Проверяем доступ через Event -> Pair
    if (media.Event && media.Event.Pair) {
      const pair = media.Event.Pair;
      if (pair.user1_id !== userId && pair.user2_id !== userId) {
        throw new Error('Access denied to this media');
      }
    } else if (media.Event && media.Event.userId !== userId) {
      // Fallback: проверка через Event.userId
      throw new Error('Access denied to this media');
    }

    return media;
  }

  // Получить все производные для медиафайла
  async getMediaDerivatives(req, res, next) {
    try {
      const { mediaId } = req.params;
      const { type } = req.query;
      const userId = req.user.id;

      // Проверяем доступ к медиафайлу
      await this.checkMediaAccess(mediaId, userId);

      const derivatives = await MediaDerivative.getDerivativesForMedia(mediaId, type || null);
      res.status(200).json({ data: derivatives });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return res.status(error.message.includes('not found') ? 404 : 403)
          .json({ error: error.message });
      }
      next(error);
    }
  }

  // Получить конкретный тип производного файла
  async getMediaDerivative(req, res, next) {
    try {
      const { mediaId, derivativeType } = req.params;
      const userId = req.user.id;

      // Проверяем доступ к медиафайлу
      await this.checkMediaAccess(mediaId, userId);

      const derivative = await MediaDerivative.getDerivativeByType(mediaId, derivativeType);
      
      if (!derivative) {
        return res.status(404).json({ error: 'Derivative not found' });
      }

      res.status(200).json({ data: derivative });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return res.status(error.message.includes('not found') ? 404 : 403)
          .json({ error: error.message });
      }
      next(error);
    }
  }

  // Создать производный файл
  async createMediaDerivative(req, res, next) {
    try {
      const { mediaId } = req.params;
      const { derivative_type, options } = req.body;
      const userId = req.user.id;

      // Проверяем доступ к медиафайлу
      await this.checkMediaAccess(mediaId, userId);

      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      // Получаем информацию о файле
      const filePath = req.file.path.replace(/\\/g, '/'); // Нормализуем путь
      const fileStats = await fs.stat(req.file.path);
      
      // Парсим опции если переданы как JSON
      let parsedOptions = {};
      if (options) {
        try {
          parsedOptions = JSON.parse(options);
        } catch (e) {
          // Если не JSON, игнорируем
        }
      }

      const derivativeOptions = {
        size_bytes: fileStats.size,
        format: path.extname(req.file.originalname).slice(1).toLowerCase(),
        ...parsedOptions
      };

      const derivative = await MediaDerivative.createDerivative(
        mediaId,
        derivative_type,
        filePath,
        derivativeOptions
      );

      res.status(201).json({
        data: derivative,
        message: 'Derivative created successfully'
      });
    } catch (error) {
      // Удаляем загруженный файл в случае ошибки
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return res.status(error.message.includes('not found') ? 404 : 403)
          .json({ error: error.message });
      }
      next(error);
    }
  }

  // Создать thumbnail
  async createThumbnail(req, res, next) {
    try {
      const { mediaId } = req.params;
      const { width = 150, height = 150, quality = 80 } = req.body;
      const userId = req.user.id;

      // Проверяем доступ к медиафайлу
      await this.checkMediaAccess(mediaId, userId);

      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const filePath = req.file.path.replace(/\\/g, '/');
      const fileStats = await fs.stat(req.file.path);

      const derivative = await MediaDerivative.createThumbnail(
        mediaId,
        filePath,
        parseInt(width),
        parseInt(height),
        {
          quality: parseInt(quality),
          size_bytes: fileStats.size,
          format: path.extname(req.file.originalname).slice(1).toLowerCase()
        }
      );

      res.status(201).json({
        data: derivative,
        message: 'Thumbnail created successfully'
      });
    } catch (error) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return res.status(error.message.includes('not found') ? 404 : 403)
          .json({ error: error.message });
      }
      next(error);
    }
  }

  // Генерировать blur hash
  async generateBlurHash(req, res, next) {
    try {
      const { mediaId } = req.params;
      const { components_x = 4, components_y = 3 } = req.body;
      const userId = req.user.id;

      // Проверяем доступ к медиафайлу
      const media = await this.checkMediaAccess(mediaId, userId);

      // Здесь должна быть логика генерации blur hash из оригинального файла
      // Для примера создаем фиктивный blur hash
      const mockBlurHash = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

      const derivative = await MediaDerivative.createBlurHash(
        mediaId,
        mockBlurHash,
        {
          components_x: parseInt(components_x),
          components_y: parseInt(components_y)
        }
      );

      res.status(201).json({
        data: derivative,
        message: 'Blur hash generated successfully'
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return res.status(error.message.includes('not found') ? 404 : 403)
          .json({ error: error.message });
      }
      next(error);
    }
  }

  // Массовое создание производных
  async bulkCreateDerivatives(req, res, next) {
    try {
      const { mediaId } = req.params;
      const { derivatives } = req.body;
      const userId = req.user.id;

      // Проверяем доступ к медиафайлу
      await this.checkMediaAccess(mediaId, userId);

      if (!derivatives || !Array.isArray(derivatives)) {
        return res.status(400).json({ error: 'Derivatives array is required' });
      }

      const created = await MediaDerivative.bulkCreateForMedia(mediaId, derivatives);

      res.status(201).json({
        data: created,
        message: `${created.length} derivatives created successfully`
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return res.status(error.message.includes('not found') ? 404 : 403)
          .json({ error: error.message });
      }
      next(error);
    }
  }

  // Удалить производный файл
  async deleteMediaDerivative(req, res, next) {
    try {
      const { derivativeId } = req.params;
      const userId = req.user.id;

      const derivative = await MediaDerivative.findByPk(derivativeId, {
        include: [
          {
            model: Media,
            as: 'SourceMedia',
            include: [
              {
                model: Event,
                as: 'Event',
                include: [
                  {
                    model: Pair,
                    as: 'Pair'
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!derivative) {
        return res.status(404).json({ error: 'Derivative not found' });
      }

      // Проверяем доступ через медиафайл
      const media = derivative.SourceMedia;
      if (media && media.Event && media.Event.Pair) {
        const pair = media.Event.Pair;
        if (pair.user1_id !== userId && pair.user2_id !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (media && media.Event && media.Event.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Удаляем файл с диска
      if (derivative.derivative_type !== 'blur_hash') {
        try {
          await fs.unlink(derivative.file_path);
        } catch (unlinkError) {
          console.error('Error deleting derivative file:', unlinkError);
        }
      }

      await derivative.destroy();

      res.status(200).json({ message: 'Derivative deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Удалить все производные для медиафайла
  async deleteAllDerivatives(req, res, next) {
    try {
      const { mediaId } = req.params;
      const userId = req.user.id;

      // Проверяем доступ к медиафайлу
      await this.checkMediaAccess(mediaId, userId);

      // Получаем все производные
      const derivatives = await MediaDerivative.findAll({
        where: { source_media_id: mediaId }
      });

      // Удаляем файлы с диска
      for (const derivative of derivatives) {
        if (derivative.derivative_type !== 'blur_hash') {
          try {
            await fs.unlink(derivative.file_path);
          } catch (unlinkError) {
            console.error('Error deleting derivative file:', unlinkError);
          }
        }
      }

      const deletedCount = await MediaDerivative.deleteAllForMedia(mediaId);

      res.status(200).json({ 
        message: `${deletedCount} derivatives deleted successfully` 
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return res.status(error.message.includes('not found') ? 404 : 403)
          .json({ error: error.message });
      }
      next(error);
    }
  }

  // Автоматически генерировать все стандартные производные
  async autoGenerateDerivatives(req, res, next) {
    try {
      const { mediaId } = req.params;
      const userId = req.user.id;

      // Проверяем доступ к медиафайлу
      const media = await this.checkMediaAccess(mediaId, userId);

      // В реальном приложении здесь была бы логика автоматической генерации
      // thumbnails, previews, optimized версий и blur hash из оригинального файла
      
      // Для примера возвращаем сообщение
      res.status(200).json({
        message: 'Auto-generation started. This feature requires image processing implementation.',
        media_url: media.file_url
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return res.status(error.message.includes('not found') ? 404 : 403)
          .json({ error: error.message });
      }
      next(error);
    }
  }

  // Получить статистику производных файлов
  async getDerivativeStats(req, res, next) {
    try {
      const { mediaId } = req.params;
      const userId = req.user.id;

      // Проверяем доступ к медиафайлу
      await this.checkMediaAccess(mediaId, userId);

      const derivatives = await MediaDerivative.getDerivativesForMedia(mediaId);
      
      const stats = {
        totalDerivatives: derivatives.length,
        totalSize: derivatives.reduce((sum, d) => sum + (d.size_bytes || 0), 0),
        byType: {}
      };

      derivatives.forEach(d => {
        if (!stats.byType[d.derivative_type]) {
          stats.byType[d.derivative_type] = {
            count: 0,
            totalSize: 0,
            avgSize: 0
          };
        }
        
        stats.byType[d.derivative_type].count++;
        stats.byType[d.derivative_type].totalSize += d.size_bytes || 0;
        stats.byType[d.derivative_type].avgSize = 
          stats.byType[d.derivative_type].totalSize / stats.byType[d.derivative_type].count;
      });

      res.status(200).json({ data: stats });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return res.status(error.message.includes('not found') ? 404 : 403)
          .json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new MediaDerivativeController();
