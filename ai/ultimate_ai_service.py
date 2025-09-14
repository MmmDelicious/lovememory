import json
import os
import time
import logging
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

from content_recommender import ContentBasedRecommender
from collaborative_filtering import CollaborativeFilteringRecommender
from embedding_service import EmbeddingService
from learning_to_rank_service import LearningToRankService
from llm_wrapper import LLMWrapper
from explainability_service import ExplainabilityService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI models
class RecommendationRequest(BaseModel):
    pair_id: str
    top_k: Optional[int] = 10
    user_location: Optional[Tuple[float, float]] = None
    context: Optional[Dict[str, Any]] = None
    include_scenarios: Optional[bool] = False
    include_explanations: Optional[bool] = True

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    processing_time_ms: float
    model_versions: Dict[str, str]
    scenarios: Optional[List[Dict[str, str]]] = None
    explanations: Optional[List[Dict[str, Any]]] = None

class UpdateWeightsRequest(BaseModel):
    content_weight: float
    cf_weight: float
    embedding_weight: float

class ComponentError(Exception):
    def __init__(self, component: str, error: str, critical: bool = False):
        self.component = component
        self.error = error
        self.critical = critical
        super().__init__(f"Component {component} error: {error}")

class UltimateAIService:
    def __init__(self, data_path: str = 'data/synthetic_v1'):
        self.data_path = data_path
        logger.info("Initializing Ultimate AI Service")
        
        self.content_recommender = None
        self.cf_recommender = None
        self.embedding_service = None
        self.ltr_service = None
        self.llm_wrapper = None
        self.explainer = None
        
        self.components_status = {
            'content_based': False,
            'collaborative_filtering': False,
            'embeddings': False,
            'learning_to_rank': False,
            'llm_generation': False,
            'explainability': False
        }
        
        self.fallback_weights = {
            'content_weight': 0.4,
            'cf_weight': 0.3,
            'embedding_weight': 0.3
        }
        
        self.performance_stats = {
            'total_requests': 0,
            'avg_latency_ms': 0.0,
            'cache_hits': 0,
            'model_switches': 0
        }
        
        self.recommendation_cache = {}
        self.cache_ttl_seconds = 300
        
        self._initialize_all_components()
    
    def _initialize_all_components(self):
        logger.info("Initializing AI components")
        
        try:
            self.content_recommender = ContentBasedRecommender(self.data_path)
            self.components_status['content_based'] = True
            logger.info("Content-Based system ready")
        except Exception as e:
            logger.error(f"Failed to initialize Content-Based: {e}")
            raise ComponentError("content_based", str(e), critical=True)
        
        try:
            self.cf_recommender = CollaborativeFilteringRecommender(self.data_path)
            if os.path.exists('models/cf_svd_v1.pkl'):
                self.cf_recommender.load_model('models/cf_svd_v1')
            else:
                logger.warning("CF model not found, training new model")
                self.cf_recommender.train_svd_model()
            self.components_status['collaborative_filtering'] = True
            logger.info("Collaborative Filtering ready")
        except Exception as e:
            logger.warning(f"CF not ready: {e}")
        
        try:
            self.embedding_service = EmbeddingService(self.data_path)
            if not self.embedding_service.load_embeddings():
                logger.info("Generating embeddings")
                self.embedding_service.generate_user_embeddings()
                self.embedding_service.generate_product_embeddings()
                self.embedding_service.generate_pair_embeddings()
                self.embedding_service.build_faiss_indexes()
                self.embedding_service.save_embeddings()
            self.components_status['embeddings'] = True
            logger.info("Embedding system ready")
        except Exception as e:
            logger.warning(f"Embeddings not ready: {e}")
        
        try:
            self.ltr_service = LearningToRankService(self.data_path)
            if self.ltr_service.load_model():
                self.components_status['learning_to_rank'] = True
                logger.info("Learning to Rank ready")
            else:
                logger.warning("LTR model not found, training new model")
                training_data, groups = self.ltr_service.create_training_dataset(sample_pairs=100)
                if len(training_data) > 0:
                    self.ltr_service.train_ranker_model(training_data, groups)
                    self.ltr_service.save_model()
                    self.components_status['learning_to_rank'] = True
                    logger.info("Learning to Rank trained and ready")
        except Exception as e:
            logger.warning(f"LTR not ready: {e}")
        
        try:
            self.llm_wrapper = LLMWrapper()
            self.components_status['llm_generation'] = True
            logger.info("LLM Generation ready")
        except Exception as e:
            logger.warning(f"LLM Generation not ready: {e}")
        
        try:
            if self.ltr_service:
                self.explainer = ExplainabilityService(self.ltr_service)
                self.components_status['explainability'] = True
                logger.info("Explainability ready")
        except Exception as e:
            logger.warning(f"Explainability not ready: {e}")
        
        ready_components = sum(self.components_status.values())
        logger.info(f"Ultimate AI Service ready: {ready_components}/6 components active")
        logger.info(f"Active components: {[k for k, v in self.components_status.items() if v]}")
    
    def get_ultimate_recommendations(self, pair_id: str, top_k: int = 10, 
                                   user_location: Optional[Tuple[float, float]] = None,
                                   context: Optional[Dict[str, Any]] = None,
                                   include_scenarios: bool = False,
                                   include_explanations: bool = True) -> Dict[str, Any]:
        start_time = time.time()
        
        try:
            cache_key = f"{pair_id}_{top_k}_{hash(str(user_location))}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                self.performance_stats['cache_hits'] += 1
                return cached_result
            
            logger.info(f"Generating recommendations for pair: {pair_id}")
            
            recommendations = []
            method_used = "fallback"
            
            if self.components_status['learning_to_rank'] and self.ltr_service:
                try:
                    candidates = self.ltr_service._get_candidates_for_pair(pair_id, max_candidates=top_k * 3)
                    if candidates:
                        ranked_candidates = self.ltr_service.rank_candidates(pair_id, candidates)
                        recommendations = self._format_ltr_recommendations(ranked_candidates[:top_k])
                        method_used = "learning_to_rank"
                        logger.info(f"Used Learning to Rank: {len(recommendations)} recommendations")
                except Exception as e:
                    logger.warning(f"LTR error, switching to Enhanced Hybrid: {e}")
                    self.performance_stats['model_switches'] += 1
            
            if not recommendations and all([
                self.components_status['content_based'],
                self.components_status['collaborative_filtering'], 
                self.components_status['embeddings']
            ]):
                try:
                    recommendations = self._get_enhanced_hybrid_recommendations(pair_id, top_k, user_location)
                    method_used = "enhanced_hybrid"
                    logger.info(f"Used Enhanced Hybrid: {len(recommendations)} recommendations")
                except Exception as e:
                    logger.warning(f"Enhanced Hybrid error, switching to basic: {e}")
                    self.performance_stats['model_switches'] += 1
            
            if not recommendations and self.components_status['collaborative_filtering']:
                try:
                    recommendations = self._get_basic_hybrid_recommendations(pair_id, top_k, user_location)
                    method_used = "basic_hybrid"
                    logger.info(f"Used Basic Hybrid: {len(recommendations)} recommendations")
                except Exception as e:
                    logger.warning(f"Basic Hybrid error, using Content only: {e}")
                    self.performance_stats['model_switches'] += 1
            
            if not recommendations and self.content_recommender:
                try:
                    content_recs = self.content_recommender.recommend_date(pair_id, top_k, user_location)
                    recommendations = self._format_content_recommendations(content_recs)
                    method_used = "content_only"
                    logger.info(f"Used Content-Based: {len(recommendations)} recommendations")
                except Exception as e:
                    logger.error(f"All methods unavailable: {e}")
                    recommendations = []
                    method_used = "error"
            
            if context and recommendations:
                recommendations = self._apply_context_filters(recommendations, context)
            
            scenarios = []
            if include_scenarios and recommendations and self.components_status['llm_generation']:
                scenarios = self._generate_scenarios(pair_id, recommendations[:3], context)
            
            explanations = []
            if include_explanations and recommendations and self.components_status['explainability']:
                explanations = self._generate_explanations(pair_id, recommendations)
            
            processing_time = (time.time() - start_time) * 1000
            
            result = {
                'recommendations': recommendations,
                'scenarios': scenarios if scenarios else None,
                'explanations': explanations if explanations else None,
                'metadata': {
                    'method_used': method_used,
                    'pair_id': pair_id,
                    'components_status': self.components_status,
                    'total_candidates_considered': len(recommendations),
                    'context_applied': context is not None,
                    'scenarios_generated': len(scenarios),
                    'explanations_generated': len(explanations)
                },
                'processing_time_ms': processing_time,
                'model_versions': {
                    'content_based': 'v1',
                    'collaborative_filtering': 'svd_v1',
                    'embeddings': 'sentence_transformers_v1',
                    'learning_to_rank': 'lightgbm_v1',
                    'llm_generation': 'template_v1',
                    'explainability': 'shap_v1'
                }
            }
            
            self._save_to_cache(cache_key, result)
            
            self.performance_stats['total_requests'] += 1
            self.performance_stats['avg_latency_ms'] = (
                (self.performance_stats['avg_latency_ms'] * (self.performance_stats['total_requests'] - 1) + 
                 processing_time) / self.performance_stats['total_requests']
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Critical error in Ultimate recommendations: {e}")
            return {
                'recommendations': [],
                'metadata': {'error': str(e), 'method_used': 'error'},
                'processing_time_ms': (time.time() - start_time) * 1000,
                'model_versions': {}
            }
    
    def _get_enhanced_hybrid_recommendations(self, pair_id: str, top_k: int, 
                                           user_location: Optional[Tuple[float, float]]) -> List[Dict]:
        all_candidates = {}
        
        if self.content_recommender:
            content_recs = self.content_recommender.recommend_date(pair_id, top_k * 2, user_location)
            for rec in content_recs:
                all_candidates[rec.item_id] = {
                    'item_id': rec.item_id,
                    'title': rec.title,
                    'category': rec.category,
                    'price': rec.price,
                    'location': rec.location,
                    'content_score': rec.score,
                    'cf_score': 0.0,
                    'embedding_score': 0.0,
                    'reasons': rec.reasons
                }
        
        if self.components_status['collaborative_filtering'] and self.cf_recommender:
            cf_recs = self.cf_recommender.get_pair_recommendations(pair_id, top_k * 2)
            for rec in cf_recs:
                item_id = rec['item_id']
                cf_score = rec['combined_rating'] / 10.0
                
                if item_id in all_candidates:
                    all_candidates[item_id]['cf_score'] = cf_score
                    all_candidates[item_id]['reasons'].append('Popular among similar pairs')
                else:
                    product_info = self._get_product_info(item_id)
                    all_candidates[item_id] = {
                        'item_id': item_id,
                        'title': product_info.get('title', 'Unknown'),
                        'category': product_info.get('category', 'unknown'),
                        'price': product_info.get('price', 0),
                        'location': product_info.get('location'),
                        'content_score': 0.0,
                        'cf_score': cf_score,
                        'embedding_score': 0.0,
                        'reasons': ['Popular among similar pairs']
                    }
        
        if self.components_status['embeddings'] and self.embedding_service:
            embedding_recs = self.embedding_service.find_similar_products_ann(pair_id, top_k * 2)
            for rec in embedding_recs:
                item_id = rec['item_id']
                embedding_score = rec['embedding_similarity']
                
                if item_id in all_candidates:
                    all_candidates[item_id]['embedding_score'] = embedding_score
                    all_candidates[item_id]['reasons'].append('Semantically similar')
                else:
                    all_candidates[item_id] = {
                        'item_id': item_id,
                        'title': rec['title'],
                        'category': rec['category'],
                        'price': rec['price'],
                        'location': None,
                        'content_score': 0.0,
                        'cf_score': 0.0,
                        'embedding_score': embedding_score,
                        'reasons': ['Semantically similar']
                    }
        
        for candidate in all_candidates.values():
            final_score = (
                self.fallback_weights['content_weight'] * candidate['content_score'] +
                self.fallback_weights['cf_weight'] * candidate['cf_score'] +
                self.fallback_weights['embedding_weight'] * candidate['embedding_score']
            )
            candidate['final_score'] = final_score
            candidate['method'] = 'enhanced_hybrid'
        
        sorted_candidates = sorted(all_candidates.values(), key=lambda x: x['final_score'], reverse=True)
        return sorted_candidates[:top_k]
    
    def _get_basic_hybrid_recommendations(self, pair_id: str, top_k: int, 
                                        user_location: Optional[Tuple[float, float]]) -> List[Dict]:
        all_candidates = {}
        
        if self.content_recommender:
            content_recs = self.content_recommender.recommend_date(pair_id, top_k * 2, user_location)
            for rec in content_recs:
                all_candidates[rec.item_id] = {
                    'item_id': rec.item_id,
                    'title': rec.title,
                    'category': rec.category,
                    'price': rec.price,
                    'content_score': rec.score,
                    'cf_score': 0.0,
                    'reasons': rec.reasons,
                    'method': 'basic_hybrid'
                }
        
        if self.cf_recommender:
            cf_recs = self.cf_recommender.get_pair_recommendations(pair_id, top_k * 2)
            for rec in cf_recs:
                item_id = rec['item_id']
                cf_score = rec['combined_rating'] / 10.0
                
                if item_id in all_candidates:
                    all_candidates[item_id]['cf_score'] = cf_score
                else:
                    product_info = self._get_product_info(item_id)
                    all_candidates[item_id] = {
                        'item_id': item_id,
                        'title': product_info.get('title', 'Unknown'),
                        'category': product_info.get('category', 'unknown'),
                        'price': product_info.get('price', 0),
                        'content_score': 0.0,
                        'cf_score': cf_score,
                        'reasons': ['Recommended by CF'],
                        'method': 'basic_hybrid'
                    }
        
        for candidate in all_candidates.values():
            candidate['final_score'] = (candidate['content_score'] + candidate['cf_score']) / 2.0
        
        sorted_candidates = sorted(all_candidates.values(), key=lambda x: x['final_score'], reverse=True)
        return sorted_candidates[:top_k]
    
    def _format_ltr_recommendations(self, candidates: List[Dict]) -> List[Dict]:
        for candidate in candidates:
            candidate['method'] = 'learning_to_rank'
            candidate['final_score'] = candidate.get('ltr_score', 0.0)
        return candidates
    
    def _format_content_recommendations(self, content_recs) -> List[Dict]:
        recommendations = []
        for rec in content_recs:
            recommendations.append({
                'item_id': rec.item_id,
                'title': rec.title,
                'category': rec.category,
                'price': rec.price,
                'final_score': rec.score,
                'reasons': rec.reasons,
                'method': 'content_only'
            })
        return recommendations
    
    def _get_product_info(self, item_id: str) -> Dict:
        try:
            if self.content_recommender and hasattr(self.content_recommender, 'product_catalog'):
                product = self.content_recommender.product_catalog[
                    self.content_recommender.product_catalog['id'] == item_id
                ]
                if not product.empty:
                    return product.iloc[0].to_dict()
        except Exception:
            pass
        return {}
    
    def _generate_scenarios(self, pair_id: str, recommendations: List[Dict], 
                          context: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
        scenarios = []
        
        try:
            pair_context = self._build_pair_context(pair_id, context)
            
            for rec in recommendations:
                try:
                    if self.llm_wrapper:
                        llm_response = self.llm_wrapper.generate_date_scenario(pair_context, rec)
                        scenario = {
                            'item_id': rec['item_id'],
                            'title': rec['title'],
                            'scenario': llm_response.generated_text,
                            'model_used': llm_response.model_used,
                            'cached': llm_response.cached,
                            'processing_time_ms': llm_response.processing_time_ms
                        }
                        scenarios.append(scenario)
                    else:
                        scenarios.append({
                            'item_id': rec['item_id'],
                            'title': rec['title'],
                            'scenario': f"Recommended to visit {rec['title']} for a pleasant time together.",
                            'model_used': 'fallback',
                            'cached': False,
                            'processing_time_ms': 0
                        })
                    
                except Exception as e:
                    logger.warning(f"Error generating scenario for {rec['item_id']}: {e}")
                    scenarios.append({
                        'item_id': rec['item_id'],
                        'title': rec['title'],
                        'scenario': f"Recommended to visit {rec['title']} for a pleasant time together.",
                        'model_used': 'fallback',
                        'cached': False,
                        'processing_time_ms': 0
                    })
                    
        except Exception as e:
            logger.error(f"Error generating scenarios: {e}")
        
        return scenarios
    
    def _generate_explanations(self, pair_id: str, recommendations: List[Dict]) -> List[Dict[str, Any]]:
        explanations = []
        
        try:
            if self.explainer:
                explanation_results = self.explainer.explain_batch_recommendations(pair_id, recommendations)
                
                for rec, explanation_result in zip(recommendations, explanation_results):
                    explanation = {
                        'item_id': rec['item_id'],
                        'title': rec['title'],
                        'human_explanation': explanation_result.human_friendly,
                        'top_factors': [
                            {
                                'factor': factor['explanation'],
                                'contribution': factor['contribution'],
                                'direction': factor['direction']
                            }
                            for factor in explanation_result.top_factors[:3]
                        ],
                        'confidence_score': explanation_result.confidence_score,
                        'technical_method': explanation_result.technical_details.get('method_used', 'unknown')
                    }
                    explanations.append(explanation)
                
                self.explainer.save_explanations_to_history(pair_id, recommendations, explanation_results)
            else:
                for rec in recommendations:
                    explanations.append({
                        'item_id': rec['item_id'],
                        'title': rec['title'],
                        'human_explanation': "• Matches your preferences\n• Suitable price range\n• Popular among users",
                        'top_factors': [
                            {'factor': 'common preferences', 'contribution': 0.7, 'direction': 'positive'},
                            {'factor': 'budget', 'contribution': 0.5, 'direction': 'positive'},
                            {'factor': 'popularity', 'contribution': 0.3, 'direction': 'positive'}
                        ],
                        'confidence_score': 0.6,
                        'technical_method': 'fallback'
                    })
            
        except Exception as e:
            logger.error(f"Error generating explanations: {e}")
            for rec in recommendations:
                explanations.append({
                    'item_id': rec['item_id'],
                    'title': rec['title'],
                    'human_explanation': "• Matches your preferences\n• Suitable price range\n• Popular among users",
                    'top_factors': [
                        {'factor': 'common preferences', 'contribution': 0.7, 'direction': 'positive'},
                        {'factor': 'budget', 'contribution': 0.5, 'direction': 'positive'},
                        {'factor': 'popularity', 'contribution': 0.3, 'direction': 'positive'}
                    ],
                    'confidence_score': 0.6,
                    'technical_method': 'fallback'
                })
        
        return explanations
    
    def _build_pair_context(self, pair_id: str, additional_context: Optional[Dict]) -> Dict[str, Any]:
        try:
            if not self.content_recommender:
                return self._get_default_context(additional_context)
                
            pair = self.content_recommender.pairs[self.content_recommender.pairs['id'] == pair_id].iloc[0]
            user1 = self.content_recommender.users[self.content_recommender.users['id'] == pair['user1_id']].iloc[0]
            user2 = self.content_recommender.users[self.content_recommender.users['id'] == pair['user2_id']].iloc[0]
            
            user1_interests = eval(user1['interests']) if isinstance(user1['interests'], str) else user1['interests']
            user2_interests = eval(user2['interests']) if isinstance(user2['interests'], str) else user2['interests']
            
            common_interests = set(user1_interests.keys()) & set(user2_interests.keys())
            common_interests_list = list(common_interests)[:5]
            
            user1_love_lang = eval(user1['love_languages']) if isinstance(user1['love_languages'], str) else user1['love_languages']
            user2_love_lang = eval(user2['love_languages']) if isinstance(user2['love_languages'], str) else user2['love_languages']
            
            primary_love_lang1 = max(user1_love_lang.items(), key=lambda x: x[1])[0]
            primary_love_lang2 = max(user2_love_lang.items(), key=lambda x: x[1])[0]
            
            context = {
                'common_interests': common_interests_list,
                'budget': user1['budget_preference'],
                'partner_interests': list(user2_interests.keys())[:3],
                'love_language': primary_love_lang1,
                'archetype1': user1['archetype'],
                'archetype2': user2['archetype'],
                'avg_age': (user1['age'] + user2['age']) / 2
            }
            
            if additional_context:
                context.update(additional_context)
            
            return context
            
        except Exception as e:
            logger.warning(f"Error building pair context for {pair_id}: {e}")
            return self._get_default_context(additional_context)
    
    def _get_default_context(self, additional_context: Optional[Dict]) -> Dict[str, Any]:
        context = {
            'common_interests': ['communication'],
            'budget': 'medium',
            'partner_interests': ['entertainment'],
            'love_language': 'quality_time'
        }
        if additional_context:
            context.update(additional_context)
        return context
    
    def _apply_context_filters(self, recommendations: List[Dict], context: Dict[str, Any]) -> List[Dict]:
        if 'max_price' in context:
            recommendations = [r for r in recommendations if r['price'] <= context['max_price']]
        
        if 'preferred_categories' in context:
            preferred = context['preferred_categories']
            for rec in recommendations:
                if rec['category'] in preferred:
                    rec['final_score'] *= 1.2
        
        recommendations.sort(key=lambda x: x['final_score'], reverse=True)
        return recommendations
    
    def _get_from_cache(self, cache_key: str) -> Optional[Dict]:
        if cache_key in self.recommendation_cache:
            cached_data, timestamp = self.recommendation_cache[cache_key]
            if time.time() - timestamp < self.cache_ttl_seconds:
                return cached_data
            else:
                del self.recommendation_cache[cache_key]
        return None
    
    def _save_to_cache(self, cache_key: str, data: Dict):
        self.recommendation_cache[cache_key] = (data, time.time())
        
        if len(self.recommendation_cache) > 1000:
            sorted_items = sorted(self.recommendation_cache.items(), key=lambda x: x[1][1])
            items_to_remove = sorted_items[:200]
            for key, _ in items_to_remove:
                del self.recommendation_cache[key]
    
    def get_system_status(self) -> Dict[str, Any]:
        return {
            'components_status': self.components_status,
            'performance_stats': self.performance_stats,
            'cache_size': len(self.recommendation_cache),
            'ready_components': sum(self.components_status.values()),
            'total_components': len(self.components_status),
            'system_ready': sum(self.components_status.values()) >= 2
        }
    
    def update_weights(self, content_weight: float, cf_weight: float, embedding_weight: float):
        total = content_weight + cf_weight + embedding_weight
        if abs(total - 1.0) > 0.01:
            raise ValueError("Weights must sum to 1.0")
        
        self.fallback_weights = {
            'content_weight': content_weight,
            'cf_weight': cf_weight,
            'embedding_weight': embedding_weight
        }

app = FastAPI(
    title="Ultimate LoveMemory AI Service",
    description="Production-ready AI service combining all 7 phases of recommendation system",
    version="1.0.0"
)

ultimate_service = None

@app.on_event("startup")
async def startup_event():
    global ultimate_service
    try:
        ultimate_service = UltimateAIService()
        logger.info("Ultimate AI Service started successfully")
    except Exception as e:
        logger.error(f"Failed to start Ultimate AI Service: {e}")
        raise

@app.get("/health")
async def health_check():
    if ultimate_service is None:
        raise HTTPException(status_code=503, detail="AI Service not initialized")
    
    status = ultimate_service.get_system_status()
    if not status['system_ready']:
        raise HTTPException(status_code=503, detail="System not ready")
    
    return {"status": "healthy", "components_ready": status['ready_components']}

@app.get("/health/deep")
async def deep_health_check():
    if ultimate_service is None:
        raise HTTPException(status_code=503, detail="AI Service not initialized")
    
    return ultimate_service.get_system_status()

@app.post("/api/ai/recommend/ultimate", response_model=RecommendationResponse)
async def get_ultimate_recommendations(request: RecommendationRequest):
    if ultimate_service is None:
        raise HTTPException(status_code=503, detail="AI Service not initialized")
    
    result = ultimate_service.get_ultimate_recommendations(
        pair_id=request.pair_id,
        top_k=request.top_k,
        user_location=request.user_location,
        context=request.context,
        include_scenarios=request.include_scenarios,
        include_explanations=request.include_explanations
    )
    
    return RecommendationResponse(**result)

@app.get("/api/ai/status")
async def get_system_status():
    if ultimate_service is None:
        raise HTTPException(status_code=503, detail="AI Service not initialized")
    
    return ultimate_service.get_system_status()

@app.put("/api/ai/weights")
async def update_weights(request: UpdateWeightsRequest):
    if ultimate_service is None:
        raise HTTPException(status_code=503, detail="AI Service not initialized")
    
    try:
        ultimate_service.update_weights(
            request.content_weight,
            request.cf_weight,
            request.embedding_weight
        )
        return {"status": "success", "weights": ultimate_service.fallback_weights}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/ai/feature-importance")
async def get_feature_importance():
    if ultimate_service is None:
        raise HTTPException(status_code=503, detail="AI Service not initialized")
    
    if ultimate_service.components_status['learning_to_rank'] and ultimate_service.ltr_service:
        importance = ultimate_service.ltr_service.get_feature_importance(top_k=15)
        return {"feature_importance": importance}
    else:
        raise HTTPException(status_code=404, detail="LTR model not available")

def main():
    logger.info("Starting Ultimate AI Service - Production Ready!")
    
    try:
        service = UltimateAIService()
        
        if service.content_recommender and hasattr(service.content_recommender, 'pairs'):
            test_pair_id = service.content_recommender.pairs['id'].iloc[0]
            
            logger.info(f"Testing Ultimate system for pair: {test_pair_id}")
            result = service.get_ultimate_recommendations(
                test_pair_id, 
                top_k=3, 
                include_scenarios=True, 
                include_explanations=True
            )
            
            logger.info(f"Ultimate recommendations (method: {result['metadata']['method_used']}):")
            for i, rec in enumerate(result['recommendations'], 1):
                logger.info(f"{i}. {rec['title']} - Score: {rec['final_score']:.4f} - Method: {rec['method']}")
            
            if result.get('scenarios'):
                logger.info("Generated scenarios available")
            
            if result.get('explanations'):
                logger.info("Generated explanations available")
            
            logger.info(f"Processing time: {result['processing_time_ms']:.2f}ms")
            
            status = service.get_system_status()
            logger.info(f"System status: {status['ready_components']}/{status['total_components']} components ready")
            logger.info(f"System ready: {status['system_ready']}")
            
            logger.info("Ultimate AI Service ready for production!")
        else:
            logger.warning("Content recommender not available for testing")
            
    except Exception as e:
        logger.error(f"Error in main: {e}")

if __name__ == "__main__":
    main()
