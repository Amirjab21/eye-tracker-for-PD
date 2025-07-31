import asyncpg
import os

DB_HOST = os.getenv("DB_HOST", "timescaledb")
DB_PORT = int(os.getenv("DB_PORT", 5432))
DB_USER = os.getenv("DB_USER", "gaze")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = os.getenv("DB_NAME", "gaze_data")


async def validate(data):
    return True


def detect_velocity_anomalies(samples, threshold=1000):
    anomalies = set()
    for i in range(1, len(samples)):
        dt = (samples[i]["timestamp_ms"] - samples[i - 1]["timestamp_ms"]) / 1000  # s
        dx = samples[i]["gaze_x"] - samples[i - 1]["gaze_x"]
        velocity = dx / dt if dt != 0 else 0
        if abs(velocity) > threshold:
            anomalies.add(i)
    return anomalies


def calculate_velocity_and_anomalies(
    data, threshold=1000
):  # this threshold is arbritary - could decide it on the data after we collect some.
    processed = []
    anomalies = detect_velocity_anomalies(data, threshold)
    for i in range(1, len(data)):
        prev = data[i - 1]
        curr = data[i]
        time_diff = (curr["timestamp_ms"] - prev["timestamp_ms"]) / 1000  # seconds
        velocity = (
            (curr["gaze_x"] - prev["gaze_x"]) / time_diff if time_diff != 0 else 0
        )
        is_anomaly = i in anomalies
        processed.append({**curr, "velocity": velocity, "is_anomaly": is_anomaly})
    return processed


def calculate_velocity(data):
    # Assumes data is a list of dicts with 'timestamp_ms' and 'gaze_x'
    processed = []
    for i in range(1, len(data)):
        prev = data[i - 1]
        curr = data[i]
        time_diff = (curr["timestamp_ms"] - prev["timestamp_ms"]) / 1000  # seconds
        if time_diff == 0:
            velocity = 0
        else:
            velocity = (curr["gaze_x"] - prev["gaze_x"]) / time_diff
        processed.append({**curr, "velocity": velocity})
    return processed


async def insert_processed(records):
    conn = await asyncpg.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD, database=DB_NAME
    )
    try:
        await conn.executemany(
            """
            INSERT INTO processed (user_id, session_id, timestamp_ms, gaze_x, sampling_rate, calibration_params, device, velocity, is_anomaly)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """,
            [
                (
                    r["user_id"],
                    r["session_id"],
                    r["timestamp_ms"],
                    r.get("gaze_x"),
                    r.get("sampling_rate"),
                    r.get("calibration_params"),
                    r.get("device"),
                    r["velocity"],
                    r["is_anomaly"],
                )
                for r in records
            ],
        )
    finally:
        await conn.close()
