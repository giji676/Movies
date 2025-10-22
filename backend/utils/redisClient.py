import redis
from django.conf import settings

redis_client = redis.Redis(
    host='localhost',  # use 'localhost' if not in Docker
    port=6379,
    db=0,
    decode_responses=True  # store strings not bytes
)
