from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.core.exceptions import ConflictException, NotFoundException
from app.models.designation import Designation, DesignationStatus
from app.schemas.designation import DesignationCreate, DesignationUpdate


class DesignationService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: DesignationCreate, created_by: int) -> Designation:
        existing = self.db.query(Designation).filter(
            Designation.designation_code == data.designation_code,
            Designation.is_deleted == False,
        ).first()
        if existing:
            raise ConflictException(f"Designation code '{data.designation_code}' already exists")
        d = Designation(
            designation_code=data.designation_code.upper(),
            designation_name=data.designation_name,
            status=DesignationStatus.ACTIVE,
            created_by=created_by,
            updated_by=created_by,
        )
        self.db.add(d)
        self.db.commit()
        self.db.refresh(d)
        return d

    def update(self, id: int, data: DesignationUpdate, updated_by: int) -> Designation:
        d = self._get(id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(d, field, value)
        d.updated_by = updated_by
        self.db.commit()
        self.db.refresh(d)
        return d

    def toggle_status(self, id: int, status: DesignationStatus, updated_by: int) -> Designation:
        d = self._get(id)
        d.status = status
        d.updated_by = updated_by
        self.db.commit()
        self.db.refresh(d)
        return d

    def search(
        self,
        search: Optional[str] = None,
        status: Optional[DesignationStatus] = None,
        page: int = 1,
        page_size: int = 15,
    ) -> Tuple[List[Designation], int]:
        q = self.db.query(Designation).filter(Designation.is_deleted == False)
        if search:
            q = q.filter(Designation.designation_name.ilike(f"%{search}%"))
        if status:
            q = q.filter(Designation.status == status)
        total = q.count()
        items = q.order_by(Designation.designation_name).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_all_active(self) -> List[Designation]:
        return (
            self.db.query(Designation)
            .filter(Designation.is_deleted == False, Designation.status == DesignationStatus.ACTIVE)
            .order_by(Designation.designation_name)
            .all()
        )

    def _get(self, id: int) -> Designation:
        d = self.db.query(Designation).filter(Designation.id == id, Designation.is_deleted == False).first()
        if not d:
            raise NotFoundException("Designation not found")
        return d
