from typing import Optional, List
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.core.exceptions import ConflictException, NotFoundException, BusinessRuleException
from app.core.permissions import guard_super_admin_target, can_manage_role
from app.repositories.user_repository import UserRepository
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit_service import AuditService


class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)
        self.db = db

    def create(self, data: UserCreate, created_by: int, actor_role: UserRole) -> tuple[User, str]:
        if not can_manage_role(actor_role, data.role):
            raise BusinessRuleException(
                f"You do not have permission to create users with role '{data.role}'."
            )
        if self.repo.get_by_email(data.email):
            raise ConflictException(f"Email {data.email} already registered")
        if self.repo.get_by_employee_code(data.employee_code):
            raise ConflictException(f"Employee code {data.employee_code} already exists")
        user = User(
            employee_code=data.employee_code,
            full_name=data.full_name,
            email=data.email,
            password_hash=get_password_hash(data.password),
            role=data.role,
            department=data.department,
            designation=data.designation,
            phone=data.phone,
            status=UserStatus.ACTIVE,
            created_by=created_by,
            updated_by=created_by,
        )
        saved = self.repo.save(user)
        AuditService(self.db).log(
            user_id=created_by,
            entity_type="User",
            entity_id=saved.id,
            action="CREATE",
            new_values={"role": data.role.value, "email": data.email, "employee_code": data.employee_code},
        )
        return saved, data.password

    def update(self, user_id: int, data: UserUpdate, updated_by: int, actor_role: UserRole) -> User:
        user = self.repo.get(user_id)
        if not user or user.is_deleted:
            raise NotFoundException("User not found")
        guard_super_admin_target(user)
        if data.email and data.email != user.email:
            if self.repo.get_by_email(data.email):
                raise ConflictException("Email already in use")
        old = {"status": user.status.value, "email": user.email}
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(user, field, value)
        user.updated_by = updated_by
        self.db.commit()
        self.db.refresh(user)
        AuditService(self.db).log(
            user_id=updated_by,
            entity_type="User",
            entity_id=user_id,
            action="UPDATE",
            old_values=old,
            new_values=data.model_dump(exclude_none=True),
        )
        return user

    def toggle_status(self, user_id: int, status: UserStatus, updated_by: int) -> User:
        user = self.repo.get(user_id)
        if not user or user.is_deleted:
            raise NotFoundException("User not found")
        guard_super_admin_target(user)
        old_status = user.status.value
        user.status = status
        user.updated_by = updated_by
        self.db.commit()
        self.db.refresh(user)
        AuditService(self.db).log(
            user_id=updated_by,
            entity_type="User",
            entity_id=user_id,
            action="STATUS_CHANGE",
            old_values={"status": old_status},
            new_values={"status": status.value},
        )
        return user

    def _would_create_cycle(self, user_id: int, new_manager_id: int) -> bool:
        """Walk up the manager chain from new_manager_id; if we reach user_id it's a cycle."""
        visited = set()
        current_id = new_manager_id
        while current_id is not None:
            if current_id == user_id:
                return True
            if current_id in visited:
                break
            visited.add(current_id)
            node = self.repo.get(current_id)
            current_id = node.manager_id if node else None
        return False

    def set_manager(self, user_id: int, manager_id: Optional[int], updated_by: int) -> User:
        user = self.repo.get(user_id)
        if not user or user.is_deleted:
            raise NotFoundException("User not found")
        guard_super_admin_target(user)
        if manager_id is not None:
            if manager_id == user_id:
                raise BusinessRuleException("An employee cannot be their own manager.")
            manager = self.repo.get(manager_id)
            if not manager or manager.is_deleted:
                raise NotFoundException("Manager not found")
            if self._would_create_cycle(user_id, manager_id):
                raise BusinessRuleException(
                    f"Cannot assign this manager — it would create a reporting loop "
                    f"({user.full_name} is already in {manager.full_name}'s reporting chain)."
                )
            # Auto-grant approver access to the new manager if not already set
            if not manager.can_approve_timesheets:
                manager.can_approve_timesheets = True
                manager.updated_by = updated_by
        user.manager_id = manager_id
        user.updated_by = updated_by
        self.db.commit()
        self.db.refresh(user)
        AuditService(self.db).log(
            user_id=updated_by, entity_type="User", entity_id=user_id,
            action="SET_MANAGER", new_values={"manager_id": manager_id},
        )
        return user

    def toggle_approver(self, user_id: int, can_approve: bool, updated_by: int) -> User:
        user = self.repo.get(user_id)
        if not user or user.is_deleted:
            raise NotFoundException("User not found")
        guard_super_admin_target(user)
        user.can_approve_timesheets = can_approve
        user.updated_by = updated_by
        self.db.commit()
        self.db.refresh(user)
        AuditService(self.db).log(
            user_id=updated_by, entity_type="User", entity_id=user_id,
            action="TOGGLE_APPROVER", new_values={"can_approve_timesheets": can_approve},
        )
        return user

    def get_detail(self, user_id: int) -> User:
        user = self.repo.get(user_id)
        if not user or user.is_deleted:
            raise NotFoundException("User not found")
        return user

    def search(self, search: str = None, role: UserRole = None, status: UserStatus = None,
               page: int = 1, page_size: int = 20, exclude_super_admin: bool = False):
        return self.repo.search(search, role, status, page, page_size,
                                exclude_super_admin=exclude_super_admin)

    def get_dropdown(self):
        return self.repo.get_all_active_employees()

    def get_approvers(self) -> List[User]:
        return self.repo.get_approvers()

    def get_org_tree(self) -> List[User]:
        return self.repo.get_org_tree()

    def assign_projects(self, user_id: int, project_ids: List[int], updated_by: int) -> User:
        from app.models.project import Project
        user = self.get_detail(user_id)
        projects = self.db.query(Project).filter(Project.id.in_(project_ids), Project.is_deleted == False).all()
        user.assigned_projects = projects
        user.updated_by = updated_by
        self.db.commit()
        self.db.refresh(user)
        return user
