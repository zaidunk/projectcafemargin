from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.database import get_db
from app.models.action_plan import ActionPlan, KPITarget
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/kpi", tags=["kpi"])


class ActionPlanCreate(BaseModel):
    action_text: str
    status: str = "todo"
    due_date: Optional[date] = None
    assignee: Optional[str] = None


class ActionPlanUpdate(BaseModel):
    action_text: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    assignee: Optional[str] = None


class KPITargetCreate(BaseModel):
    metric_name: str
    target_value: float
    actual_value: Optional[float] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None


class KPITargetUpdate(BaseModel):
    metric_name: Optional[str] = None
    target_value: Optional[float] = None
    actual_value: Optional[float] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None


@router.get("/action-plans")
def list_action_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plans = db.query(ActionPlan).filter(ActionPlan.cafe_id == current_user.cafe_id).order_by(ActionPlan.due_date).all()
    return [
        {
            "id": p.id,
            "action_text": p.action_text,
            "status": p.status,
            "due_date": str(p.due_date) if p.due_date else None,
            "assignee": p.assignee,
            "created_at": str(p.created_at),
        }
        for p in plans
    ]


@router.post("/action-plans")
def create_action_plan(body: ActionPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ("superadmin", "cafe_owner"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    plan = ActionPlan(cafe_id=current_user.cafe_id, **body.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"id": plan.id}


@router.put("/action-plans/{plan_id}")
def update_action_plan(plan_id: int, body: ActionPlanUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(ActionPlan).filter(ActionPlan.id == plan_id, ActionPlan.cafe_id == current_user.cafe_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Action plan tidak ditemukan")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(plan, k, v)
    db.commit()
    return {"id": plan.id, "status": plan.status}


@router.delete("/action-plans/{plan_id}")
def delete_action_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ("superadmin", "cafe_owner"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    plan = db.query(ActionPlan).filter(ActionPlan.id == plan_id, ActionPlan.cafe_id == current_user.cafe_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Action plan tidak ditemukan")
    db.delete(plan)
    db.commit()
    return {"message": "Deleted"}


@router.get("/targets")
def list_kpi_targets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    targets = db.query(KPITarget).filter(KPITarget.cafe_id == current_user.cafe_id).all()
    return [
        {
            "id": t.id,
            "metric_name": t.metric_name,
            "target_value": t.target_value,
            "actual_value": t.actual_value,
            "period_start": str(t.period_start) if t.period_start else None,
            "period_end": str(t.period_end) if t.period_end else None,
            "achievement_pct": (t.actual_value / t.target_value * 100) if t.target_value and t.actual_value else None,
        }
        for t in targets
    ]


@router.post("/targets")
def create_kpi_target(body: KPITargetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ("superadmin", "cafe_owner"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    target = KPITarget(cafe_id=current_user.cafe_id, **body.model_dump())
    db.add(target)
    db.commit()
    db.refresh(target)
    return {"id": target.id}


@router.put("/targets/{target_id}")
def update_kpi_target(target_id: int, body: KPITargetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target = db.query(KPITarget).filter(KPITarget.id == target_id, KPITarget.cafe_id == current_user.cafe_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="KPI target tidak ditemukan")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(target, k, v)
    db.commit()
    return {"id": target.id}
