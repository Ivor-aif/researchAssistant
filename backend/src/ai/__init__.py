# AI模块初始化
from .innovation_extraction import InnovationExtraction

# 条件导入数据库相关的AI服务
try:
    from .vision_api import VisionAPI
    from .paper_recommendation import PaperRecommendation
    from .research_analysis import ResearchAnalysis
    __all__ = ['VisionAPI', 'PaperRecommendation', 'ResearchAnalysis', 'InnovationExtraction']
except ImportError:
    __all__ = ['InnovationExtraction']