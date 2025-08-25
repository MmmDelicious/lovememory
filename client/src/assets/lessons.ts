// Export lessons data
export { allLessons, lessonsByTheme, themes } from './lessons/index';

// Animation imports
import Love from './lessons/Love.json';
import CoupleSharing from './lessons/Couple sharing and caring love.json';
import Relationship from './lessons/Relationship.json';
import LoverPeople from './lessons/Lover People Sitting on Garden Banch.json';
import TargetEvaluation from './lessons/Target Evaluation.json';
import OnlineSales from './lessons/Online Sales.json';
import DeveloperDiscussing from './lessons/Developer discussing different options.json';
import MarketResearch from './lessons/Market Research.json';
import WebsiteConstruction from './lessons/Website Construction.json';
import BusinessAnimations from './lessons/Business Animations - Flat Concept.json';

const animations: Record<string, any> = {
  'Love.json': Love,
  'Couple sharing and caring love.json': CoupleSharing,
  'Relationship.json': Relationship,
  'Lover People Sitting on Garden Banch.json': LoverPeople,
  'Target Evaluation.json': TargetEvaluation,
  'Online Sales.json': OnlineSales,
  'Developer discussing different options.json': DeveloperDiscussing,
  'Market Research.json': MarketResearch,
  'Website Construction.json': WebsiteConstruction,
  'Business Animations - Flat Concept.json': BusinessAnimations
};

export const getLessonAnimation = (filename: string) => {
  return animations[filename] || Love; // fallback to Love animation
};
