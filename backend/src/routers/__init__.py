from fastapi import APIRouter
from .auth import router as auth_router
from .research import router as research_router
from .ai import router as ai_router
from .ai_config import router as ai_config_router
from .paper_search import router as paper_search_router
from .paper_search_progress import router as paper_search_progress_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(research_router)
api_router.include_router(ai_router)
api_router.include_router(ai_config_router)
api_router.include_router(paper_search_router)
api_router.include_router(paper_search_progress_router)