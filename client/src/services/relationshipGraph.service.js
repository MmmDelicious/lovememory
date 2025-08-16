/**
 * Сервис для анализа и построения графика отношений
 * Динамически анализирует активность пары и строит граф связей
 */

class RelationshipGraphService {
  constructor() {
    this.baseNodes = [
      { 
        id: 'couple', 
        label: 'Вы как пара', 
        type: 'center',
        baseStrength: 85,
        description: 'Центральный узел ваших отношений'
      },
      { 
        id: 'communication', 
        label: 'Общение', 
        type: 'skill',
        baseStrength: 70,
        description: 'Качество и частота вашего общения'
      },
      { 
        id: 'trust', 
        label: 'Доверие', 
        type: 'emotion',
        baseStrength: 75,
        description: 'Уровень доверия друг к другу'
      },
      { 
        id: 'shared_time', 
        label: 'Совместное время', 
        type: 'activity',
        baseStrength: 65,
        description: 'Качество проведенного вместе времени'
      },
      { 
        id: 'intimacy', 
        label: 'Близость', 
        type: 'emotion',
        baseStrength: 80,
        description: 'Эмоциональная и физическая близость'
      },
      { 
        id: 'support', 
        label: 'Поддержка', 
        type: 'behavior',
        baseStrength: 72,
        description: 'Взаимная поддержка в трудные моменты'
      },
      { 
        id: 'future_plans', 
        label: 'Планы на будущее', 
        type: 'goal',
        baseStrength: 68,
        description: 'Совместное планирование и цели'
      },
      { 
        id: 'conflict_resolution', 
        label: 'Решение конфликтов', 
        type: 'skill',
        baseStrength: 60,
        description: 'Умение решать разногласия конструктивно'
      },
      { 
        id: 'personal_growth', 
        label: 'Личностный рост', 
        type: 'goal',
        baseStrength: 65,
        description: 'Поддержка развития друг друга'
      },
      { 
        id: 'fun_together', 
        label: 'Веселье вместе', 
        type: 'activity',
        baseStrength: 78,
        description: 'Способность получать удовольствие вместе'
      }
    ];

    this.baseConnections = [
      { from: 'couple', to: 'communication', strength: 0.9, type: 'strong' },
      { from: 'couple', to: 'trust', strength: 0.85, type: 'strong' },
      { from: 'couple', to: 'shared_time', strength: 0.75, type: 'medium' },
      { from: 'couple', to: 'intimacy', strength: 0.88, type: 'strong' },
      { from: 'communication', to: 'trust', strength: 0.7, type: 'medium' },
      { from: 'trust', to: 'intimacy', strength: 0.82, type: 'strong' },
      { from: 'shared_time', to: 'support', strength: 0.68, type: 'medium' },
      { from: 'intimacy', to: 'future_plans', strength: 0.65, type: 'medium' },
      { from: 'communication', to: 'conflict_resolution', strength: 0.8, type: 'strong' },
      { from: 'support', to: 'personal_growth', strength: 0.72, type: 'medium' },
      { from: 'shared_time', to: 'fun_together', strength: 0.85, type: 'strong' },
      { from: 'trust', to: 'future_plans', strength: 0.75, type: 'medium' },
      { from: 'conflict_resolution', to: 'trust', strength: 0.7, type: 'medium' },
      { from: 'personal_growth', to: 'future_plans', strength: 0.6, type: 'weak' },
      { from: 'fun_together', to: 'intimacy', strength: 0.65, type: 'medium' }
    ];
  }

  // Анализ статистики пользователя для расчета силы узлов
  analyzeUserStats(stats) {
    const analysis = {
      communication: Math.min(100, Math.max(40, 
        stats.events * 8 + stats.gamesPlayed * 5 + 50
      )),
      trust: Math.min(100, Math.max(45, 
        stats.gamesPlayed * 6 + stats.daysSinceRegistration * 0.5 + 55
      )),
      shared_time: Math.min(100, Math.max(35, 
        stats.events * 6 + stats.memories * 3 + 40
      )),
      intimacy: Math.min(100, Math.max(50, 
        stats.memories * 12 + stats.events * 2 + 45
      )),
      support: Math.min(100, Math.max(40, 
        stats.gamesPlayed * 4 + stats.events * 3 + 50
      )),
      future_plans: Math.min(100, Math.max(30, 
        stats.events * 5 + stats.daysSinceRegistration * 0.8 + 35
      )),
      conflict_resolution: Math.min(100, Math.max(35, 
        stats.gamesPlayed * 3 + stats.daysSinceRegistration * 0.6 + 45
      )),
      personal_growth: Math.min(100, Math.max(40, 
        stats.events * 4 + stats.memories * 2 + 50
      )),
      fun_together: Math.min(100, Math.max(45, 
        stats.gamesPlayed * 8 + stats.events * 4 + 60
      ))
    };

    // Центральный узел рассчитывается как среднее
    analysis.couple = Math.min(100, Math.max(60,
      Object.values(analysis).reduce((sum, val) => sum + val, 0) / Object.keys(analysis).length
    ));

    return analysis;
  }

  // Анализ событий для выявления паттернов
  analyzeEvents(events) {
    const patterns = {
      communication: 0,
      shared_time: 0,
      fun_together: 0,
      intimacy: 0,
      future_plans: 0,
      personal_growth: 0
    };

    events.forEach(event => {
      const title = event.title?.toLowerCase() || '';
      const description = event.description?.toLowerCase() || '';
      const content = title + ' ' + description;

      // Анализируем контент событий
      if (content.includes('разговор') || content.includes('обсуждение') || 
          content.includes('поговорить') || content.includes('общение')) {
        patterns.communication += 3;
      }

      if (content.includes('вместе') || content.includes('свидание') || 
          content.includes('время') || content.includes('провели')) {
        patterns.shared_time += 2;
      }

      if (content.includes('веселье') || content.includes('смех') || 
          content.includes('игра') || content.includes('развлечение')) {
        patterns.fun_together += 2;
      }

      if (content.includes('близость') || content.includes('объятия') || 
          content.includes('поцелуй') || content.includes('нежность')) {
        patterns.intimacy += 3;
      }

      if (content.includes('план') || content.includes('будущее') || 
          content.includes('мечта') || content.includes('цель')) {
        patterns.future_plans += 2;
      }

      if (content.includes('развитие') || content.includes('обучение') || 
          content.includes('новое') || content.includes('рост')) {
        patterns.personal_growth += 2;
      }
    });

    return patterns;
  }

  // Генерация динамического графа
  generateDynamicGraph(stats, events = []) {
    const statsAnalysis = this.analyzeUserStats(stats);
    const eventPatterns = this.analyzeEvents(events);

    // Объединяем анализ статистики и событий
    const enhancedNodes = this.baseNodes.map(node => {
      const statsBonus = statsAnalysis[node.id] || node.baseStrength;
      const eventBonus = eventPatterns[node.id] || 0;
      
      const finalStrength = Math.min(100, Math.max(20, 
        Math.round((statsBonus + eventBonus) * 0.8 + node.baseStrength * 0.2)
      ));

      return {
        ...node,
        strength: finalStrength,
        x: this.getNodePosition(node.id).x,
        y: this.getNodePosition(node.id).y,
        insights: this.generateNodeInsights(node.id, finalStrength, eventPatterns[node.id] || 0)
      };
    });

    // Адаптируем связи на основе силы узлов
    const enhancedConnections = this.baseConnections.map(connection => {
      const fromNode = enhancedNodes.find(n => n.id === connection.from);
      const toNode = enhancedNodes.find(n => n.id === connection.to);
      
      const avgStrength = (fromNode.strength + toNode.strength) / 200; // Нормализуем
      const dynamicStrength = Math.min(1, Math.max(0.2, connection.strength * avgStrength));

      return {
        ...connection,
        strength: dynamicStrength,
        dynamicType: this.getConnectionType(dynamicStrength)
      };
    });

    return {
      nodes: enhancedNodes,
      connections: enhancedConnections,
      overallHealth: this.calculateOverallHealth(enhancedNodes),
      recommendations: this.generateRecommendations(enhancedNodes)
    };
  }

  // Позиции узлов в SVG пространстве
  getNodePosition(nodeId) {
    const positions = {
      couple: { x: 250, y: 150 },
      communication: { x: 150, y: 100 },
      trust: { x: 350, y: 100 },
      shared_time: { x: 150, y: 200 },
      intimacy: { x: 350, y: 200 },
      support: { x: 100, y: 150 },
      future_plans: { x: 400, y: 150 },
      conflict_resolution: { x: 200, y: 50 },
      personal_growth: { x: 300, y: 50 },
      fun_together: { x: 250, y: 250 }
    };
    return positions[nodeId] || { x: 250, y: 150 };
  }

  // Определение типа связи по силе
  getConnectionType(strength) {
    if (strength >= 0.8) return 'strong';
    if (strength >= 0.6) return 'medium';
    if (strength >= 0.3) return 'weak';
    return 'potential';
  }

  // Расчет общего здоровья отношений
  calculateOverallHealth(nodes) {
    const totalStrength = nodes.reduce((sum, node) => sum + node.strength, 0);
    const averageStrength = totalStrength / nodes.length;
    return Math.round(averageStrength);
  }

  // Генерация инсайтов для узла
  generateNodeInsights(nodeId, strength, eventActivity) {
    const insights = {
      couple: {
        high: "Ваши отношения процветают! Вы отлично работаете как команда.",
        medium: "Хорошая база отношений. Есть потенциал для еще большего роста.",
        low: "Стоит уделить больше внимания укреплению связи между вами."
      },
      communication: {
        high: "Отличное общение! Вы открыты и честны друг с другом.",
        medium: "Хорошее общение, но можно быть еще более открытыми.",
        low: "Попробуйте больше говорить о ваших чувствах и мыслях."
      },
      trust: {
        high: "Безграничное доверие - основа крепких отношений.",
        medium: "Доверие есть, продолжайте его укреплять честностью.",
        low: "Работайте над построением доверия через открытость."
      },
      shared_time: {
        high: "Вы мастера проводить время вместе качественно!",
        medium: "Хорошо проводите время, но можно разнообразить активности.",
        low: "Планируйте больше времени только для вас двоих."
      },
      intimacy: {
        high: "Прекрасная эмоциональная и физическая близость.",
        medium: "Хорошая близость, продолжайте быть нежными друг с другом.",
        low: "Больше объятий, поцелуев и душевных разговоров."
      },
      support: {
        high: "Вы отлично поддерживаете друг друга во всем!",
        medium: "Хорошая взаимная поддержка, будьте еще внимательнее.",
        low: "Чаще интересуйтесь проблемами и достижениями партнера."
      },
      future_plans: {
        high: "У вас есть общие цели и планы - это прекрасно!",
        medium: "Есть планы на будущее, обсуждайте их чаще.",
        low: "Время поговорить о ваших мечтах и планах вместе."
      },
      conflict_resolution: {
        high: "Отлично решаете конфликты конструктивно!",
        medium: "Неплохо справляетесь с разногласиями.",
        low: "Изучите техники мирного решения конфликтов."
      },
      personal_growth: {
        high: "Вы помогаете друг другу расти и развиваться!",
        medium: "Поддерживаете развитие партнера, это важно.",
        low: "Больше интересуйтесь увлечениями и целями партнера."
      },
      fun_together: {
        high: "Вы знаете, как весело проводить время! Так держать!",
        medium: "Умеете развлекаться, попробуйте новые активности.",
        low: "Добавьте больше веселья и спонтанности в отношения."
      }
    };

    const level = strength >= 80 ? 'high' : strength >= 60 ? 'medium' : 'low';
    return insights[nodeId]?.[level] || "Развивайте этот аспект отношений.";
  }

  // Генерация рекомендаций
  generateRecommendations(nodes) {
    const recommendations = [];
    
    // Находим самые слабые узлы
    const weakNodes = nodes
      .filter(node => node.id !== 'couple')
      .sort((a, b) => a.strength - b.strength)
      .slice(0, 3);

    weakNodes.forEach(node => {
      switch(node.id) {
        case 'communication':
          recommendations.push({
            title: "Улучшите общение",
            description: "Проводите 10 минут в день, просто разговаривая друг с другом без телефонов",
            priority: "high"
          });
          break;
        case 'trust':
          recommendations.push({
            title: "Укрепите доверие",
            description: "Будьте более открытыми о своих чувствах и переживаниях",
            priority: "high"
          });
          break;
        case 'shared_time':
          recommendations.push({
            title: "Больше времени вместе",
            description: "Запланируйте регулярные свидания или совместные активности",
            priority: "medium"
          });
          break;
        default:
          recommendations.push({
            title: `Работайте над: ${node.label}`,
            description: node.insights,
            priority: "medium"
          });
      }
    });

    return recommendations.slice(0, 3); // Возвращаем топ-3 рекомендации
  }

  // Получение связанных узлов
  getConnectedNodes(nodeId, connections) {
    return connections
      .filter(conn => conn.from === nodeId || conn.to === nodeId)
      .map(conn => conn.from === nodeId ? conn.to : conn.from);
  }

  // Анализ силы связи между узлами
  getConnectionStrength(nodeId1, nodeId2, connections) {
    const connection = connections.find(conn => 
      (conn.from === nodeId1 && conn.to === nodeId2) ||
      (conn.from === nodeId2 && conn.to === nodeId1)
    );
    return connection?.strength || 0;
  }
}

export default new RelationshipGraphService();

