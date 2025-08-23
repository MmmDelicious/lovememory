import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Star, Trophy, Book, Heart } from 'lucide-react';
import styles from './LessonPath.module.css';
interface LessonPathProps {
  completedLessons: string[];
  currentLesson: string;
  totalLessons: number;
  streakDays: number;
  viewMode?: 'my' | 'pair';
  onLessonSelect?: (lessonId: string) => void;
}
interface PathNode {
  id: string;
  type: 'completed' | 'current' | 'locked' | 'milestone';
  position: { x: number; y: number };
  title: string;
  theme: string;
  difficulty: number;
}
const LessonPath: React.FC<LessonPathProps> = ({
  completedLessons,
  currentLesson,
  totalLessons,
  streakDays,
  viewMode = 'my',
  onLessonSelect
}) => {
  const [pathNodes, setPathNodes] = useState<PathNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  useEffect(() => {
    generatePath();
  }, [completedLessons, currentLesson, totalLessons]);
  const generatePath = () => {
    const nodes: PathNode[] = [];
    const pathWidth = 800;
    const pathHeight = 1200;
    const nodeCount = Math.min(totalLessons, 30); // Показываем до 30 уроков
    for (let i = 0; i < nodeCount; i++) {
      const progress = i / (nodeCount - 1);
      const baseY = progress * pathHeight;
      const amplitude = 200; // Амплитуда извилистости
      const frequency = 3; // Количество изгибов
      const offsetX = Math.sin(progress * frequency * Math.PI) * amplitude;
      const x = pathWidth / 2 + offsetX;
      const y = baseY + 50;
      let type: PathNode['type'] = 'locked';
      if (completedLessons.includes(`lesson_${i + 1}`)) {
        type = 'completed';
      } else if (`lesson_${i + 1}` === currentLesson) {
        type = 'current';
      } else if (i % 10 === 9) { // Каждый 10-й урок - milestone
        type = 'milestone';
      }
      const themes = ['words_of_affirmation', 'quality_time', 'physical_touch', 'acts_of_service', 'receiving_gifts'];
      const theme = themes[i % themes.length];
      nodes.push({
        id: `lesson_${i + 1}`,
        type,
        position: { x, y },
        title: `Урок ${i + 1}`,
        theme,
        difficulty: Math.floor(i / 5) + 1 // Сложность растет каждые 5 уроков
      });
    }
    setPathNodes(nodes);
  };
  const getNodeIcon = (node: PathNode) => {
    switch (node.type) {
      case 'completed':
        return <CheckCircle2 size={20} />;
      case 'current':
        return <Star size={20} />;
      case 'milestone':
        return <Trophy size={20} />;
      default:
        return <Lock size={20} />;
    }
  };
  const getThemeColor = (theme: string) => {
    const themeColors = {
      words_of_affirmation: '#4A7C59',
      quality_time: '#8B4513',
      physical_touch: '#D4AF37',
      acts_of_service: '#2F5233',
      receiving_gifts: '#CD853F'
    };
    return themeColors[theme as keyof typeof themeColors] || '#4A7C59';
  };
  const drawPath = () => {
    let pathString = '';
    pathNodes.forEach((node, index) => {
      if (index === 0) {
        pathString += `M ${node.position.x} ${node.position.y}`;
      } else {
        const prevNode = pathNodes[index - 1];
        const cpx1 = prevNode.position.x;
        const cpy1 = prevNode.position.y + 40;
        const cpx2 = node.position.x;
        const cpy2 = node.position.y - 40;
        pathString += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${node.position.x} ${node.position.y}`;
      }
    });
    return pathString;
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <Book size={24} />
            <div>
              <div className={styles.statValue}>{completedLessons.length}</div>
              <div className={styles.statLabel}>Пройдено</div>
            </div>
          </div>
          <div className={styles.stat}>
            <Heart size={24} />
            <div>
              <div className={styles.statValue}>{streakDays}</div>
              <div className={styles.statLabel}>Дней подряд</div>
            </div>
          </div>
          <div className={styles.stat}>
            <Trophy size={24} />
            <div>
              <div className={styles.statValue}>{Math.floor(completedLessons.length / 10)}</div>
              <div className={styles.statLabel}>Достижений</div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.pathContainer}>
        <svg 
          width="800" 
          height="1200" 
          viewBox="0 0 800 1200"
          className={styles.pathSvg}
        >
          {}
          <path
            d={drawPath()}
            fill="none"
            stroke="var(--lesson-brown-light)"
            strokeWidth="60"
            strokeLinecap="round"
            className={styles.roadBackground}
          />
          {}
          <path
            d={drawPath()}
            fill="none"
            stroke="var(--lesson-gold)"
            strokeWidth="40"
            strokeLinecap="round"
            className={styles.roadMain}
          />
          {}
          <motion.path
            d={drawPath()}
            fill="none"
            stroke="var(--lesson-green-medium)"
            strokeWidth="20"
            strokeLinecap="round"
            className={styles.roadProgress}
            initial={{ pathLength: 0 }}
            animate={{ 
              pathLength: completedLessons.length / totalLessons 
            }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          {}
          {pathNodes.map((node, index) => (
            <g key={node.id}>
              {}
              <circle
                cx={node.position.x + 2}
                cy={node.position.y + 2}
                r="20"
                fill="rgba(0, 0, 0, 0.2)"
              />
              {}
              <motion.circle
                cx={node.position.x}
                cy={node.position.y}
                r="18"
                fill={getThemeColor(node.theme)}
                stroke="white"
                strokeWidth="3"
                className={styles.pathNode}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onLessonSelect?.(node.id)}
                style={{ cursor: node.type !== 'locked' ? 'pointer' : 'default' }}
              />
              {}
              <foreignObject
                x={node.position.x - 10}
                y={node.position.y - 10}
                width="20"
                height="20"
                style={{ pointerEvents: 'none' }}
              >
                <div className={styles.nodeIcon} style={{ color: 'white' }}>
                  {getNodeIcon(node)}
                </div>
              </foreignObject>
              {}
              <text
                x={node.position.x}
                y={node.position.y + 35}
                textAnchor="middle"
                className={styles.nodeNumber}
                fill="var(--lesson-green-dark)"
                fontSize="12"
                fontWeight="600"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
        {}
        {hoveredNode && (
          <motion.div
            className={styles.tooltip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {(() => {
              const node = pathNodes.find(n => n.id === hoveredNode);
              if (!node) return null;
              return (
                <div>
                  <div className={styles.tooltipTitle}>{node.title}</div>
                  <div className={styles.tooltipTheme}>
                    Тема: {node.theme.replace('_', ' ')}
                  </div>
                  <div className={styles.tooltipDifficulty}>
                    Сложность: {'★'.repeat(node.difficulty)}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>
    </div>
  );
};
export default LessonPath;

