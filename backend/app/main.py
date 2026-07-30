from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.core.errors import AppError
from app.routers import appointments, auth, dashboard, patients, reports, sms_webhook
from app.scheduler.scheduler import start_scheduler, stop_scheduler

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.run_scheduler:
        start_scheduler()
    yield
    if settings.run_scheduler:
        stop_scheduler()


app = FastAPI(
    title="Heza API",
    description="Chronic disease follow-up and adherence support system for Rwandan health centers.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": {"en": exc.en, "rw": exc.rw}})


app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(sms_webhook.router)


@app.get("/health", tags=["meta"])
def health_check() -> dict:
    return {"status": "ok"}
