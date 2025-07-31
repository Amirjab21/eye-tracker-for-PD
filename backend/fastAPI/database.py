import asyncpg
import os

PORT = os.getenv("PORT", 5434)
HOST = os.getenv("HOST", "localhost")


async def connect_to_db():
    return await asyncpg.create_pool(
        user="gaze",
        password="password",
        database="gaze_data",
        host=HOST,
        port=PORT,  # Use the port you mapped in docker-compose
    )
