from fastapi import FastAPI
import asyncio
from aiokafka import AIOKafkaConsumer
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
import os

app = FastAPI()
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = "processing"


async def create_topic():
    admin = AIOKafkaAdminClient(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
    await admin.start()
    try:
        topics = await admin.list_topics()
        if KAFKA_TOPIC not in topics:
            await admin.create_topics(
                [NewTopic(name=KAFKA_TOPIC, num_partitions=1, replication_factor=1)]
            )
            print(f"Created topic: {KAFKA_TOPIC}")
        else:
            print(f"Topic '{KAFKA_TOPIC}' already exists.")
    finally:
        await admin.close()


async def consume():
    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="processing-group",
    )
    await consumer.start()
    try:
        async for msg in consumer:
            print(f"Received: {msg.value.decode()}")
    finally:
        await consumer.stop()


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(create_topic())
    asyncio.create_task(consume())


@app.get("/")
def read_root():
    return {"message": "Processing service is running."}
