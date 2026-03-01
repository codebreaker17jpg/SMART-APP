from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from routers import attendance, curriculum, ai_features, admin_users
from models.schemas import HealthResponse

# ── Bootstrap ─────────────────────────────────────────────────────────

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade backend for the SMART APP attendance system.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────

app.include_router(attendance.router)
app.include_router(curriculum.router)
app.include_router(ai_features.router)
app.include_router(admin_users.router)

# ── Root / Health ─────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Simple liveness probe."""
    return HealthResponse(status="healthy", version=settings.APP_VERSION)
