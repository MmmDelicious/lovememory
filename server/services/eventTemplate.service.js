const { Op } = require('sequelize');
const { EventTemplate, User } = require('../models');

class EventTemplateService {
  async getTemplatesForUser(userId) {
    try {
      const templates = await EventTemplate.findAll({
        where: {
          userId: userId,
          is_active: true
        },
        order: [
          ['usage_count', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });

      return templates;
    } catch (error) {
      console.error('Error fetching user templates:', error);
      throw error;
    }
  }

  async createTemplate(userId, templateData) {
    try {
      const {
        name,
        description,
        event_type,
        color,
        duration_minutes,
        default_title,
        default_description,
        is_all_day,
        is_shared,
        is_recurring,
        default_recurrence_rule,
        tags
      } = templateData;

      // Валидация обязательных полей
      if (!name || name.trim() === '') {
        const error = new Error('Название шаблона обязательно');
        error.statusCode = 400;
        throw error;
      }

      // Проверка уникальности названия для пользователя
      const existingTemplate = await EventTemplate.findOne({
        where: {
          userId: userId,
          name: name.trim(),
          is_active: true
        }
      });

      if (existingTemplate) {
        const error = new Error('Шаблон с таким названием уже существует');
        error.statusCode = 400;
        throw error;
      }

      const newTemplate = await EventTemplate.create({
        name: name.trim(),
        description: description || null,
        event_type: event_type || 'custom',
        color: color || '#D97A6C',
        duration_minutes: duration_minutes || 60,
        default_title: default_title || null,
        default_description: default_description || null,
        is_all_day: is_all_day || false,
        is_shared: is_shared || false,
        is_recurring: is_recurring || false,
        default_recurrence_rule: default_recurrence_rule || null,
        tags: tags || [],
        userId: userId
      });

      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(templateId, userId, updateData) {
    try {
      const template = await EventTemplate.findOne({
        where: {
          id: templateId,
          userId: userId,
          is_active: true
        }
      });

      if (!template) {
        const error = new Error('Шаблон не найден или у вас нет прав на его редактирование');
        error.statusCode = 404;
        throw error;
      }

      // Если обновляется название, проверяем уникальность
      if (updateData.name && updateData.name !== template.name) {
        const existingTemplate = await EventTemplate.findOne({
          where: {
            userId: userId,
            name: updateData.name.trim(),
            is_active: true,
            id: { [Op.ne]: templateId }
          }
        });

        if (existingTemplate) {
          const error = new Error('Шаблон с таким названием уже существует');
          error.statusCode = 400;
          throw error;
        }
      }

      await template.update(updateData);
      return template;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId, userId) {
    try {
      const template = await EventTemplate.findOne({
        where: {
          id: templateId,
          userId: userId,
          is_active: true
        }
      });

      if (!template) {
        const error = new Error('Шаблон не найден или у вас нет прав на его удаление');
        error.statusCode = 404;
        throw error;
      }

      // Мягкое удаление - помечаем как неактивный
      await template.update({ is_active: false });
      
      return { message: 'Шаблон успешно удален' };
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  async incrementUsageCount(templateId, userId) {
    try {
      const template = await EventTemplate.findOne({
        where: {
          id: templateId,
          userId: userId,
          is_active: true
        }
      });

      if (template) {
        await template.increment('usage_count');
        return template;
      }

      return null;
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }
  }

  async getPopularTemplates(userId, limit = 5) {
    try {
      const templates = await EventTemplate.findAll({
        where: {
          userId: userId,
          is_active: true,
          usage_count: { [Op.gt]: 0 }
        },
        order: [['usage_count', 'DESC']],
        limit: limit
      });

      return templates;
    } catch (error) {
      console.error('Error fetching popular templates:', error);
      throw error;
    }
  }

  async getTemplatesByType(userId, eventType) {
    try {
      const templates = await EventTemplate.findAll({
        where: {
          userId: userId,
          event_type: eventType,
          is_active: true
        },
        order: [
          ['usage_count', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });

      return templates;
    } catch (error) {
      console.error('Error fetching templates by type:', error);
      throw error;
    }
  }

  async searchTemplates(userId, searchQuery) {
    try {
      const templates = await EventTemplate.findAll({
        where: {
          userId: userId,
          is_active: true,
          [Op.or]: [
            { name: { [Op.iLike]: `%${searchQuery}%` } },
            { description: { [Op.iLike]: `%${searchQuery}%` } },
            { default_title: { [Op.iLike]: `%${searchQuery}%` } }
          ]
        },
        order: [
          ['usage_count', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });

      return templates;
    } catch (error) {
      console.error('Error searching templates:', error);
      throw error;
    }
  }

  async duplicateTemplate(templateId, userId, newName) {
    try {
      const originalTemplate = await EventTemplate.findOne({
        where: {
          id: templateId,
          userId: userId,
          is_active: true
        }
      });

      if (!originalTemplate) {
        const error = new Error('Исходный шаблон не найден');
        error.statusCode = 404;
        throw error;
      }

      // Проверяем уникальность нового названия
      const existingTemplate = await EventTemplate.findOne({
        where: {
          userId: userId,
          name: newName.trim(),
          is_active: true
        }
      });

      if (existingTemplate) {
        const error = new Error('Шаблон с таким названием уже существует');
        error.statusCode = 400;
        throw error;
      }

      const duplicatedTemplate = await EventTemplate.create({
        name: newName.trim(),
        description: originalTemplate.description,
        event_type: originalTemplate.event_type,
        color: originalTemplate.color,
        duration_minutes: originalTemplate.duration_minutes,
        default_title: originalTemplate.default_title,
        default_description: originalTemplate.default_description,
        is_all_day: originalTemplate.is_all_day,
        is_shared: originalTemplate.is_shared,
        is_recurring: originalTemplate.is_recurring,
        default_recurrence_rule: originalTemplate.default_recurrence_rule,
        tags: originalTemplate.tags,
        userId: userId
      });

      return duplicatedTemplate;
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw error;
    }
  }
}

module.exports = new EventTemplateService();
