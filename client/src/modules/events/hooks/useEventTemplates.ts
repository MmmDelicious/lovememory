import { useState, useEffect, useCallback } from 'react';
import { eventTemplateService } from '@/services';
import { EventTemplateData } from '../components/EventTemplateModal/EventTemplateModal';
export const useEventTemplates = (userId?: string) => {
  const [templates, setTemplates] = useState<EventTemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchTemplates = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await eventTemplateService.getTemplates();
      setTemplates(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке шаблонов');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  const createTemplate = async (templateData: Omit<EventTemplateData, 'id'>) => {
    try {
      const response = await eventTemplateService.createTemplate(templateData);
      const newTemplate = response.data;
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Ошибка при создании шаблона');
    }
  };
  const updateTemplate = async (templateId: string, templateData: Partial<EventTemplateData>) => {
    try {
      const response = await eventTemplateService.updateTemplate(templateId, templateData);
      const updatedTemplate = response.data;
      setTemplates(prev => prev.map(template => 
        template.id === templateId ? updatedTemplate : template
      ));
      return updatedTemplate;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Ошибка при обновлении шаблона');
    }
  };
  const deleteTemplate = async (templateId: string) => {
    try {
      await eventTemplateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Ошибка при удалении шаблона');
    }
  };
  const duplicateTemplate = async (templateId: string, newName: string) => {
    try {
      const response = await eventTemplateService.duplicateTemplate(templateId, newName);
      const duplicatedTemplate = response.data;
      setTemplates(prev => [...prev, duplicatedTemplate]);
      return duplicatedTemplate;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Ошибка при дублировании шаблона');
    }
  };
  const incrementUsage = async (templateId: string) => {
    try {
      await eventTemplateService.incrementUsage(templateId);
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, usage_count: (template.usage_count || 0) + 1 }
          : template
      ));
    } catch (err: any) {
      console.error('Error incrementing template usage:', err);
    }
  };
  const getPopularTemplates = async (limit: number = 5) => {
    try {
      const response = await eventTemplateService.getPopularTemplates(limit);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching popular templates:', err);
      return [];
    }
  };
  const searchTemplates = async (query: string) => {
    try {
      const response = await eventTemplateService.searchTemplates(query);
      return response.data;
    } catch (err: any) {
      console.error('Error searching templates:', err);
      return [];
    }
  };
  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    incrementUsage,
    getPopularTemplates,
    searchTemplates,
    refetch: fetchTemplates
  };
};

