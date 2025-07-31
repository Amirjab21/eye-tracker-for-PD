# Gaze PWA Monorepo

This project is a monorepo containing a full-stack web application for gaze tracking and analysis. It uses Docker Compose to orchestrate all services for local development and deployment.

---

## Services Overview

### 1. **frontend**

- **Location:** `./frontend`
- **Description:** React-based Progressive Web App (PWA) for gaze data collection, calibration, and visualization. Uses Vite for development and hot reloading.
- **Dev Port:** [http://localhost:5173](http://localhost:5173)

### 2. **fastapi**

- **Location:** `./backend/fastAPI`
- **Description:** FastAPI backend for receiving, storing, and serving gaze data. Connects to TimescaleDB for storage and Kafka for messaging.
- **Port:** [http://localhost:8000](http://localhost:8000)

### 3. **timescaledb**

- **Description:** PostgreSQL-compatible time-series database for storing gaze and processed data. Initialized with `init.sql` for schema and user setup.
- **Port:** 5434 (host) → 5432 (container)

### 4. **kafka**

- **Description:** Message broker for streaming and processing gaze data in real time.
- **Port:** 9092

### 5. **processing-service**

- **Location:** `./backend/processing-service`
- **Description:** Python service for consuming gaze data from Kafka, performing processing/analysis, and writing results back to TimescaleDB.
- **Port:** 8001

---

## Prerequisites

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/) installed

---

## Setup & Running the App

1. **Clone the repository:**

   ```sh
   git clone <your-repo-url>
   cd gaze-pwa
   ```

2. **Start all services with Docker Compose:**

   ```sh
   docker-compose up --build
   ```

   - The first run may take a few minutes to build images and initialize the database.

3. **Access the app:**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API (FastAPI):** [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

---

## Environment Variables

- The frontend uses `VITE_BACKEND_URL` to know where to send API requests. This is set in `docker-compose.yml` for Docker, or in `.env` for local dev.
- The backend services use environment variables for database and Kafka connection details (see `docker-compose.yml`).

---

## Troubleshooting

- **Database errors:** If you change the database schema or user, you may need to remove the Docker volume to re-initialize:
  ```sh
  docker-compose down
  docker volume rm gaze-pwa_timescale_data
  docker-compose up --build
  ```
- **Frontend not hot reloading:** Ensure you are running the Vite dev server (not Nginx) and that the volume mount is set up in `docker-compose.yml`.
- **API requests fail with `net::ERR_NAME_NOT_RESOLVED`:** Make sure your frontend is configured to use `http://localhost:8000` for API calls, not the Docker service name.

---

## Stopping the App

To stop all services:

```sh
docker-compose down
```

---

## Directory Structure

```
gaze-pwa/
  backend/
    fastAPI/           # FastAPI backend
    processing-service/# Data processing service
    init.sql           # Database schema and user setup
  frontend/            # React PWA frontend
  docker-compose.yml   # Orchestration config
```

---

## Contact

For questions or issues, please open an issue in this repository.
