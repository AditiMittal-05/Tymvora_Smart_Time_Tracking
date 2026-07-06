from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.core.exceptions import ConflictException, NotFoundException
from app.models.department import Department, DepartmentStatus
from app.schemas.department import DepartmentCreate, DepartmentUpdate


class DepartmentService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: DepartmentCreate, created_by: int) -> Department:
        existing = self.db.query(Department).filter(
            Department.department_code == data.department_code,
            Department.is_deleted == False,
        ).first()
        if existing:
            raise ConflictException(f"Department code '{data.department_code}' already exists")
        d = Department(
            department_code=data.department_code.upper(),
            department_name=data.department_name,
            status=DepartmentStatus.ACTIVE,
            created_by=created_by,
            updated_by=created_by,
        )
        self.db.add(d)
        self.db.commit()
        self.db.refresh(d)
        return d

    def update(self, id: int, data: DepartmentUpdate, updated_by: int) -> Department:
        d = self._get(id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(d, field, value)
        d.updated_by = updated_by
        self.db.commit()
        self.db.refresh(d)
        return d

    def toggle_status(self, id: int, status: DepartmentStatus, updated_by: int) -> Department:
        d = self._get(id)
        d.status = status
        d.updated_by = updated_by
        self.db.commit()
        self.db.refresh(d)
        return d

    def search(
        self,
        search: Optional[str] = None,
        status: Optional[DepartmentStatus] = None,
        page: int = 1,
        page_size: int = 15,
    ) -> Tuple[List[Department], int]:
        q = self.db.query(Department).filter(Department.is_deleted == False)
        if search:
            q = q.filter(Department.department_name.ilike(f"%{search}%"))
        if status:
            q = q.filter(Department.status == status)
        total = q.count()
        items = q.order_by(Department.department_name).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_all_active(self) -> List[Department]:
        return (
            self.db.query(Department)
            .filter(Department.is_deleted == False, Department.status == DepartmentStatus.ACTIVE)
            .order_by(Department.department_name)
            .all()
        )

    def _get(self, id: int) -> Department:
        d = self.db.query(Department).filter(Department.id == id, Department.is_deleted == False).first()
        if not d:
            raise NotFoundException("Department not found")
        return d
