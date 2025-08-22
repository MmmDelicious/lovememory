import BusinessAnimations from './Business Animations - Flat Concept.json';
import CoupleSharing from './Couple sharing and caring love.json';
import DeveloperDiscussing from './Developer discussing different options.json';
import Love from './Love.json';
import LoverPeople from './Lover People Sitting on Garden Banch.json';
import MarketResearch from './Market Research.json';
import OnlineSales from './Online Sales.json';
import Relationship from './Relationship.json';
import TargetEvaluation from './Target Evaluation.json';
import WebsiteConstruction from './Website Construction.json';
export const lessonAnimations = {
  'Business Animations - Flat Concept.json': BusinessAnimations,
  'Couple sharing and caring love.json': CoupleSharing,
  'Developer discussing different options.json': DeveloperDiscussing,
  'Love.json': Love,
  'Lover People Sitting on Garden Banch.json': LoverPeople,
  'Market Research.json': MarketResearch,
  'Online Sales.json': OnlineSales,
  'Relationship.json': Relationship,
  'Target Evaluation.json': TargetEvaluation,
  'Website Construction.json': WebsiteConstruction,
};
export const getLessonAnimation = (filename: string) => {
  return lessonAnimations[filename as keyof typeof lessonAnimations] || null;
};
export default lessonAnimations;

