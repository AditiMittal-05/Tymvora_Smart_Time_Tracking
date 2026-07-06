import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.database.session import get_db
from app.core.permissions import require_super_admin
from app.models.system_config import SystemConfig

router = APIRouter(prefix="/config", tags=["System Config"])

# ── helpers ──────────────────────────────────────────────────────────
def _get_list(db: Session, key: str) -> List[str]:
    row = db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
    if not row:
        return []
    try:
        return json.loads(row.config_value)
    except Exception:
        return []

def _save_list(db: Session, key: str, values: List[str], actor_id: int):
    row = db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
    payload = json.dumps(sorted(set(values)))
    if row:
        row.config_value = payload
        row.updated_by = actor_id
    else:
        row = SystemConfig(config_key=key, config_value=payload, updated_by=actor_id)
        db.add(row)
    db.commit()

class ItemBody(BaseModel):
    name: str

# ── departments ───────────────────────────────────────────────────────
@router.get("/departments", response_model=List[str])
def list_departments(db: Session = Depends(get_db), _=Depends(require_super_admin())):
    return _get_list(db, "departments")

@router.post("/departments", response_model=List[str])
def add_department(body: ItemBody, db: Session = Depends(get_db), user=Depends(require_super_admin())):
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Name cannot be empty")
    items = _get_list(db, "departments")
    if name not in items:
        items.append(name)
        _save_list(db, "departments", items, user.id)
    return sorted(items)

@router.delete("/departments/{name}", response_model=List[str])
def delete_department(name: str, db: Session = Depends(get_db), user=Depends(require_super_admin())):
    items = [i for i in _get_list(db, "departments") if i != name]
    _save_list(db, "departments", items, user.id)
    return sorted(items)

# ── designations ──────────────────────────────────────────────────────
@router.get("/designations", response_model=List[str])
def list_designations(db: Session = Depends(get_db), _=Depends(require_super_admin())):
    return _get_list(db, "designations")

@router.post("/designations", response_model=List[str])
def add_designation(body: ItemBody, db: Session = Depends(get_db), user=Depends(require_super_admin())):
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Name cannot be empty")
    items = _get_list(db, "designations")
    if name not in items:
        items.append(name)
        _save_list(db, "designations", items, user.id)
    return sorted(items)

@router.delete("/designations/{name}", response_model=List[str])
def delete_designation(name: str, db: Session = Depends(get_db), user=Depends(require_super_admin())):
    items = [i for i in _get_list(db, "designations") if i != name]
    _save_list(db, "designations", items, user.id)
    return sorted(items)


class ConfigUpdate(BaseModel):
    value: str
    description: Optional[str] = None


@router.get("")
def list_configs(_=Depends(require_super_admin()), db: Session = Depends(get_db)):
    return db.query(SystemConfig).all()


@router.put("/{key}")
def upsert_config(
    key: str,
    body: ConfigUpdate,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    cfg = db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
    if cfg:
        cfg.config_value = body.value
        if body.description:
            cfg.description = body.description
        cfg.updated_by = current_user.id
    else:
        cfg = SystemConfig(
            config_key=key,
            config_value=body.value,
            description=body.description,
            updated_by=current_user.id,
        )
        db.add(cfg)
    db.commit()
    return {"key": key, "value": body.value}
