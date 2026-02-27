from supabase import create_client, Client
from core.config import get_settings


_supabase_client: Client | None = None


def _init_supabase() -> Client:
    """Lazily initialise and cache the Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )
    return _supabase_client


def get_supabase() -> Client:
    """FastAPI dependency – returns the Supabase client.

    Usage:
        @router.get("/example")
        def example(db: Client = Depends(get_supabase)):
            ...
    """
    return _init_supabase()
