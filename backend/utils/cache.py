import json
import os

import env_loader  # noqa: F401
from redis import Redis

_redis_client = Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)


def cache_get_json(key: str):
    value = _redis_client.get(key)
    if not value:
        return None
    return json.loads(value)


def cache_set_json(key: str, value, ttl_seconds: int = 120):
    _redis_client.setex(key, ttl_seconds, json.dumps(value))


def cache_delete_prefix(prefix: str):
    keys = _redis_client.keys(f"{prefix}*")
    if keys:
        _redis_client.delete(*keys)
