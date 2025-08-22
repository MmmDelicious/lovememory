const eventTemplateService = require('../services/eventTemplate.service');
exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await eventTemplateService.getTemplatesForUser(req.user.id);
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};
exports.createTemplate = async (req, res, next) => {
  try {
    const newTemplate = await eventTemplateService.createTemplate(req.user.id, req.body);
    res.status(201).json(newTemplate);
  } catch (error) {
    next(error);
  }
};
exports.updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedTemplate = await eventTemplateService.updateTemplate(id, req.user.id, req.body);
    res.status(200).json(updatedTemplate);
  } catch (error) {
    next(error);
  }
};
exports.deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await eventTemplateService.deleteTemplate(id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
exports.getPopularTemplates = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const templates = await eventTemplateService.getPopularTemplates(req.user.id, limit);
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};
exports.getTemplatesByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const templates = await eventTemplateService.getTemplatesByType(req.user.id, type);
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};
exports.searchTemplates = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Поисковый запрос не может быть пустым' });
    }
    const templates = await eventTemplateService.searchTemplates(req.user.id, q.trim());
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};
exports.duplicateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Название для копии шаблона обязательно' });
    }
    const duplicatedTemplate = await eventTemplateService.duplicateTemplate(id, req.user.id, name);
    res.status(201).json(duplicatedTemplate);
  } catch (error) {
    next(error);
  }
};
exports.incrementUsage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await eventTemplateService.incrementUsageCount(id, req.user.id);
    res.status(200).json({ success: true, template });
  } catch (error) {
    next(error);
  }
};

