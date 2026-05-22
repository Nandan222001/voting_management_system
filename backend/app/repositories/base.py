"""
Generic base repository.

Dependency Inversion Principle: Higher-level services depend on this
abstraction rather than on concrete SQLAlchemy calls.  Concrete repositories
extend ``BaseRepository`` and may override or add methods without touching
service code (Open/Closed Principle).

Multi-tenancy: Tenant-scoped query helpers (``get_by_id_and_tenant``,
``get_all_by_tenant``, ``count_by_tenant``) are provided for models that
carry a ``tenant_id`` column.  Models without that column are handled
gracefully — the tenant filter is simply skipped.
"""

from typing import Any, Generic, Optional, Type, TypeVar

from sqlalchemy.orm import Session

# T is bound to any SQLAlchemy declarative model.
T = TypeVar("T")



class BaseRepository(Generic[T]):
    """
    A generic CRUD repository that wraps a SQLAlchemy ``Session``.

    Type parameter ``T`` is the SQLAlchemy ORM model class managed by this
    repository.

    Subclasses should supply the concrete model class via the ``model``
    class attribute::

        class UserRepository(BaseRepository[User]):
            model = User
    """

    model: Type[T]

    def __init__(self, db: Session) -> None:
        """
        Args:
            db: An active SQLAlchemy ``Session``.  The repository does **not**
                own the session lifetime — callers are responsible for
                commit / rollback / close.
        """
        self.db = db

    # ------------------------------------------------------------------
    # Read helpers
    # ------------------------------------------------------------------

    def get_by_id(self, id: Any) -> Optional[T]:
        """
        Fetch a single record by primary key.

        Args:
            id: Primary key value.

        Returns:
            The ORM instance, or ``None`` if not found.
        """
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[T]:
        """
        Fetch a paginated slice of all records.

        Args:
            skip:  Number of rows to skip (offset).
            limit: Maximum number of rows to return.

        Returns:
            A list of ORM instances.
        """
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def count(self) -> int:
        """
        Return the total number of records in the table.

        Returns:
            Row count as an integer.
        """
        return self.db.query(self.model).count()

    # ------------------------------------------------------------------
    # Tenant-scoped read helpers
    # ------------------------------------------------------------------

    def get_by_id_and_tenant(self, id: Any, tenant_id: int) -> Optional[T]:
        """
        Fetch a single record by primary key **and** tenant_id.

        This prevents cross-tenant data leakage: if the record exists but
        belongs to a different tenant, ``None`` is returned.

        If the model has no ``tenant_id`` column the tenant filter is skipped
        and the method behaves identically to :meth:`get_by_id`.

        Args:
            id:        Primary key value.
            tenant_id: The tenant scope to restrict the query to.

        Returns:
            The ORM instance, or ``None`` if not found / wrong tenant.
        """
        query = self.db.query(self.model).filter(self.model.id == id)
        if hasattr(self.model, "tenant_id"):
            query = query.filter(self.model.tenant_id == tenant_id)
        return query.first()

    def get_all_by_tenant(
        self,
        tenant_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[T]:
        """
        Fetch a paginated slice of records belonging to *tenant_id*.

        If the model has no ``tenant_id`` column the method falls back to the
        global :meth:`get_all`.

        Args:
            tenant_id: The tenant scope to restrict the query to.
            skip:      Number of rows to skip (offset).
            limit:     Maximum number of rows to return.

        Returns:
            A list of ORM instances scoped to the given tenant.
        """
        if not hasattr(self.model, "tenant_id"):
            return self.get_all(skip=skip, limit=limit)
        return (
            self.db.query(self.model)
            .filter(self.model.tenant_id == tenant_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_tenant(self, tenant_id: int) -> int:
        """
        Count records belonging to *tenant_id*.

        If the model has no ``tenant_id`` column the method falls back to the
        global :meth:`count`.

        Args:
            tenant_id: The tenant scope to count within.

        Returns:
            Row count as an integer.
        """
        if not hasattr(self.model, "tenant_id"):
            return self.count()
        return (
            self.db.query(self.model)
            .filter(self.model.tenant_id == tenant_id)
            .count()
        )

    # ------------------------------------------------------------------
    # Write helpers
    # ------------------------------------------------------------------

    def create(self, obj_in: Any) -> T:
        """
        Persist a new record.

        Args:
            obj_in: Either a Pydantic schema instance (with a
                    ``model_dump()`` method) or a plain ``dict``.

        Returns:
            The freshly-created and refreshed ORM instance.
        """
        if hasattr(obj_in, "model_dump"):
            data = obj_in.model_dump()
        elif isinstance(obj_in, dict):
            data = obj_in
        else:
            raise TypeError(
                f"create() expects a Pydantic model or dict, got {type(obj_in)}"
            )

        db_obj: T = self.model(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: T, obj_in: Any) -> T:
        """
        Apply a partial update to an existing record.

        Args:
            db_obj: The ORM instance to update.
            obj_in: A Pydantic schema (``model_dump(exclude_unset=True)``
                    is used) or a plain ``dict`` containing only the fields
                    that should change.

        Returns:
            The updated and refreshed ORM instance.
        """
        if hasattr(obj_in, "model_dump"):
            update_data: dict = obj_in.model_dump(exclude_unset=True)
        elif isinstance(obj_in, dict):
            update_data = obj_in
        else:
            raise TypeError(
                f"update() expects a Pydantic model or dict, got {type(obj_in)}"
            )

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, id: Any) -> bool:
        """
        Delete a record by primary key.

        Args:
            id: Primary key value.

        Returns:
            ``True`` if a record was found and deleted, ``False`` otherwise.
        """
        db_obj = self.get_by_id(id)
        if db_obj is None:
            return False
        self.db.delete(db_obj)
        self.db.commit()
        return True
