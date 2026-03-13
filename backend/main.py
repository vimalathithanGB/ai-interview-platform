from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.resume_routes import router as resume_router
from routes.interview_routes import router as interview_router
from database.database import engine, Base
import database.models  # noqa: F401 — ensure all models are registered

# Create any missing tables (safe: never drops existing data)
Base.metadata.create_all(bind=engine)


app = FastAPI(title="AI Interview Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI Interview Platform Running"}


app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(resume_router)
app.include_router(interview_router)
# trigger reload
