
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.profiles import router as profiles_router
from app.api.v1.endpoints.companies import router as companies_router
from app.api.v1.endpoints.company_members import router as company_members_router
from app.api.v1.endpoints.jobs import router as jobs_router
from app.api.v1.endpoints.applications import router as applications_router
from app.api.v1.endpoints.catalog import router as catalog_router
from app.api.v1.endpoints.admin import router as admin_router


app = FastAPI(
    title="CareerConnect API",
    description="Professional Job Portal REST API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Routers

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

app.include_router(
    profiles_router,
    prefix="/api/v1/profiles",
    tags=["Profiles"],
)

app.include_router(
    companies_router,
    prefix="/api/v1/companies",
    tags=["Companies"],
)

app.include_router(
    catalog_router,
    prefix="/api/v1",
    tags=["Catalog"],
)

app.include_router(
    company_members_router,
    prefix="/api/v1/companies",
    tags=["Company Members"],
)

app.include_router(
    jobs_router,
    prefix="/api/v1",
    tags=["Jobs"],
)

app.include_router(
    applications_router,
    prefix="/api/v1/applications",
    tags=["Applications"],
)

app.include_router(
    admin_router,
    prefix="/api/v1",
)


@app.get("/")
def root():
    return {
        "message": "Welcome to CareerConnect API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "application": "CareerConnect",
    }
