import asyncpg


async def connect_to_db():
    return await asyncpg.create_pool(
        user="gaze",
        password="password",
        database="gaze_data",
        host="localhost",
        port=5434,  # Use the port you mapped in docker-compose
    )
