from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List
import uuid
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_db
from io import StringIO
import csv
from fastapi.responses import StreamingResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.on_event("startup")
async def startup_event():
    app.state.db = await connect_to_db()


@app.on_event("shutdown")
async def shutdown_event():
    await app.state.db.close()


class Measurement(BaseModel):
    user_id: uuid.UUID
    session_id: uuid.UUID
    timestamp_ms: int
    gaze_x: float
    sampling_rate: int
    calibration_params: List[float]
    device: str


class MeasurementBatch(BaseModel):
    measurements: List[Measurement]


@app.post("/api/upload")
async def upload(request: Request):
    data = await request.json()
    data = data["measurement_batch"]
    records = [
        (
            row["user_id"],
            row["session_id"],
            row["timestamp_ms"],
            row.get("gaze_x"),
            row.get("sampling_rate"),
            row.get("calibration_params"),
            row.get("device"),
        )
        for row in data
    ]
    try:
        async with app.state.db.acquire() as conn:
            await conn.copy_records_to_table(
                "gaze_data",
                records=records,
                columns=[
                    "user_id",
                    "session_id",
                    "timestamp_ms",
                    "gaze_x",
                    "sampling_rate",
                    "calibration_params",
                    "device",
                ],
            )
    except Exception as e:
        print(f"Error: {e}")
        return {"status": "error", "message": str(e)}

    return {"status": "ok"}


@app.get("/api/download")
async def download_data(session_id: uuid.UUID, as_json: bool = False):
    try:
        async with app.state.db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT user_id, session_id, timestamp_ms, gaze_x, sampling_rate, calibration_params, device
                FROM gaze_data
                WHERE session_id = $1
                """,
                session_id,
            )

            if not rows:
                raise HTTPException(
                    status_code=404, detail="Data not found for the given session_id"
                )

            if as_json:
                # Convert rows to list of dicts
                data = [dict(row) for row in rows]
                return {"data": data}

            # Create a CSV from the rows
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(
                [
                    "user_id",
                    "session_id",
                    "timestamp_ms",
                    "gaze_x",
                    "sampling_rate",
                    "calibration_params",
                    "device",
                ]
            )
            for row in rows:
                writer.writerow(row)

            output.seek(0)

            return StreamingResponse(
                output,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename={session_id}.csv"
                },
            )
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.get("/api/get_session_ids")
async def get_session_ids():
    print("get_session_ids")
    try:
        async with app.state.db.acquire() as conn:
            rows = await conn.fetch("SELECT DISTINCT session_id FROM gaze_data")
            session_ids = [str(row["session_id"]) for row in rows]
        return {"session_ids": session_ids}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
