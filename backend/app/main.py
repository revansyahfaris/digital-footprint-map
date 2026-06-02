from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.models import user, footprint
from app.routers import user as user_router
from app.routers import auth as auth_router
from app.routers import scan as scan_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(user_router.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api")
app.include_router(scan_router.router, prefix="/api")

@app.get("/api/status")
def read_status():
    return {"message": "Koneksi berhasil!"}