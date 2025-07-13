import asyncpg
from typing import Optional
from app.config import DATABASE_URL, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD

_pool: Optional[asyncpg.Pool] = None

async def init_db():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=DATABASE_HOST,
            port=DATABASE_PORT,
            database=DATABASE_NAME,
            user=DATABASE_USER,
            password=DATABASE_PASSWORD,
            min_size=5,
            max_size=20
        )

async def get_db_pool() -> asyncpg.Pool:
    if _pool is None:
        await init_db()
    return _pool

async def close_db():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None