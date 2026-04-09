from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import Cafe, User, Transaction, MenuItem, ActionPlan, KPITarget  # noqa: ensure all models are registered
from app.routers import auth, transactions, analytics, menu, kpi, reports, settings, admin, advanced

app = FastAPI(
    title="CafeMargin Analytics API",
    description="Strategic Data Analytics Platform for Cafes — PT Xolvon Kehidupan Cerdas Abadi",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all tables
Base.metadata.create_all(bind=engine)

# Register routers
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(menu.router)
app.include_router(kpi.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(admin.router)
app.include_router(advanced.router)


@app.get("/")
def root():
    return {
        "app": "CafeMargin Analytics API",
        "version": "1.0.0",
        "company": "PT Xolvon Kehidupan Cerdas Abadi",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
