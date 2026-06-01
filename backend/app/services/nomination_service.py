from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.election import ElectionStatus
from app.models.nomination import Nomination, NominationStatus
from app.models.user import User, UserRole
from app.repositories.candidate_committee_repository import CandidateCommitteeRepository
from app.repositories.election_repository import ElectionRepository
from app.repositories.nomination_repository import NominationRepository
from app.schemas.nomination import NominationCreate, NominationUpdate


class NominationService:
    """Business rules for mobile nomination submissions."""

    def submit_nomination(
        self,
        db: Session,
        data: NominationCreate,
        user: User,
    ) -> Nomination:
        election_repo = ElectionRepository(db)
        election = election_repo.get_by_id(data.election_id)

        if election is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={data.election_id} not found.",
            )

        if user.tenant_id is None or election.tenant_id != user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={data.election_id} not found.",
            )

        if election.status in (ElectionStatus.closed, ElectionStatus.cancelled):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot submit nominations for an election in "
                    f"'{election.status.value}' status."
                ),
            )

        if data.committee_id is not None:
            committee = CandidateCommitteeRepository(db).get_by_id(data.committee_id)
            if committee is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Candidate committee with id={data.committee_id} not found.",
                )
            if committee.tenant_id != election.tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The selected committee does not belong to this organization.",
                )

        nomination_repo = NominationRepository(db)
        existing = nomination_repo.get_by_election_and_user(data.election_id, user.id)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted a nomination for this election.",
            )

        nomination_data = data.model_dump()
        nomination_data["user_id"] = user.id
        nomination_data["tenant_id"] = election.tenant_id
        nomination_data["status"] = NominationStatus.pending

        return nomination_repo.create(nomination_data)

    def list_nominations(
        self,
        db: Session,
        current_user: User,
        skip: int = 0,
        limit: int = 20,
        election_id: int | None = None,
        user_id: int | None = None,
        status_filter: NominationStatus | None = None,
    ) -> tuple[list[Nomination], int]:
        repo = NominationRepository(db)
        tenant_id = None if current_user.role == UserRole.superadmin else current_user.tenant_id
        items = repo.list_filtered(
            skip=skip,
            limit=limit,
            tenant_id=tenant_id,
            election_id=election_id,
            user_id=user_id,
            status_filter=status_filter,
        )
        total = repo.count_filtered(
            tenant_id=tenant_id,
            election_id=election_id,
            user_id=user_id,
            status_filter=status_filter,
        )
        return items, total

    def list_my_nominations(
        self,
        db: Session,
        current_user: User,
        skip: int = 0,
        limit: int = 20,
        election_id: int | None = None,
        status_filter: NominationStatus | None = None,
    ) -> tuple[list[Nomination], int]:
        repo = NominationRepository(db)
        items = repo.list_filtered(
            skip=skip,
            limit=limit,
            tenant_id=current_user.tenant_id,
            election_id=election_id,
            user_id=current_user.id,
            status_filter=status_filter,
        )
        total = repo.count_filtered(
            tenant_id=current_user.tenant_id,
            election_id=election_id,
            user_id=current_user.id,
            status_filter=status_filter,
        )
        return items, total

    def get_nomination(
        self,
        db: Session,
        nomination_id: int,
        current_user: User,
        admin_only: bool = False,
    ) -> Nomination:
        nomination = NominationRepository(db).get_by_id(nomination_id)
        if nomination is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Nomination with id={nomination_id} not found.",
            )

        is_admin = current_user.role in (UserRole.admin, UserRole.superadmin)
        same_tenant = (
            current_user.role == UserRole.superadmin
            or nomination.tenant_id == current_user.tenant_id
        )
        owns_nomination = nomination.user_id == current_user.id

        if admin_only:
            if not is_admin or not same_tenant:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        elif not ((is_admin and same_tenant) or owns_nomination):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        return nomination

    def update_nomination(
        self,
        db: Session,
        nomination_id: int,
        data: NominationUpdate,
        current_user: User,
    ) -> Nomination:
        nomination = self.get_nomination(db, nomination_id, current_user)
        is_admin = current_user.role in (UserRole.admin, UserRole.superadmin)

        if not is_admin and nomination.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        if nomination.status != NominationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending nominations can be updated.",
            )

        update_data = data.model_dump(exclude_unset=True)
        if "committee_id" in update_data and update_data["committee_id"] is not None:
            committee = CandidateCommitteeRepository(db).get_by_id(update_data["committee_id"])
            if committee is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Candidate committee with id={update_data['committee_id']} not found.",
                )
            if committee.tenant_id != nomination.tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The selected committee does not belong to this organization.",
                )

        return NominationRepository(db).update(nomination, update_data)

    def set_status(
        self,
        db: Session,
        nomination_id: int,
        next_status: NominationStatus,
        current_user: User,
    ) -> Nomination:
        nomination = self.get_nomination(
            db,
            nomination_id,
            current_user,
            admin_only=True,
        )
        return NominationRepository(db).update(nomination, {"status": next_status})

    def delete_nomination(
        self,
        db: Session,
        nomination_id: int,
        current_user: User,
    ) -> None:
        nomination = self.get_nomination(db, nomination_id, current_user)
        is_admin = current_user.role in (UserRole.admin, UserRole.superadmin)

        if not is_admin and nomination.status != NominationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending nominations can be deleted by the applicant.",
            )

        db.delete(nomination)
        db.commit()


nomination_service = NominationService()
