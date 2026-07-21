# Task: Interconnect Voter Counts & Multiple Member Voting with Mobile App

## Context

The backend already has these fields in the `Election` model:
- `voting_type`: `SINGLE_CANDIDATE` (default) or `MULTIPLE_MEMBER`
- `votes_allowed_per_voter`: Integer (default=1, controls how many votes each voter can cast)

## Problem

The mobile app (`VotingScreen.tsx`) and backend vote service still only support single-candidate voting:
1. **VotingScreen.tsx** uses `selectedCandidateId: number | null` — only one selection
2. **VoteService.cast_vote()** checks `vote_repo.has_user_voted()` — prevents second vote even when election allows multiple
3. **electionService.castVote()** sends only `{ election_id, candidate_id }` — no batch support

## Changes Required

### 1. Backend: Update `VoteService.cast_vote()` in `backend/app/services/vote_service.py`

**Current behavior (lines 150-155):**
```python
# 4. Duplicate vote check.
if vote_repo.has_user_voted(user_id, election_id):
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="You have already cast your vote in this election.",
    )
```

**Required change:**
- When `election.voting_type == MULTIPLE_MEMBER`:
  - Check `vote_repo.get_user_vote_count_in_election(user_id, election_id)` 
  - If count >= `election.votes_allowed_per_voter`, block with "You have already cast all your allowed votes"
  - If count < `election.votes_allowed_per_voter`, allow the vote
- When `election.voting_type == SINGLE_CANDIDATE`:
  - Keep existing behavior (block if already voted)

### 2. Backend: Add method to `VoteRepository` in `backend/app/repositories/vote_repository.py`

Add method:
```python
def get_user_vote_count_in_election(self, user_id: int, election_id: int) -> int:
    return (
        self.db.query(func.count(Vote.id))
        .filter(Vote.user_id == user_id, Vote.election_id == election_id)
        .scalar()
    ) or 0
```

### 3. Backend: Add batch vote endpoint in `backend/app/controllers/vote_controller.py`

Add a new endpoint `POST /voting/submit-batch` that accepts:
```json
{
  "election_id": 1,
  "candidate_ids": [1, 3, 5]
}
```
This should validate:
- candidate_ids count <= election.votes_allowed_per_voter
- No duplicate candidate_ids
- Each candidate belongs to the election
- All existing vote checks per candidate

### 4. Mobile: Update `mobile/src/services/electionService.ts`

- Add method `castVoteBatch(electionId: number, candidateIds: number[])`
- Add method `getElectionDetails(id: number)` (already exists, ensure it returns `voting_type` and `votes_allowed_per_voter`)

### 5. Mobile: Update `mobile/src/screens/VotingScreen.tsx`

**Key changes needed:**

a) **State management:**
   - Change `selectedCandidateId: number | null` → `selectedCandidateIds: number[]`
   - Add `allowedVotes: number` (from `election.votes_allowed_per_voter`)
   - Add `votingType: 'SINGLE_CANDIDATE' | 'MULTIPLE_MEMBER'` (from `election.voting_type`)

b) **Candidate selection logic (around line 893-906):**
   - For `SINGLE_CANDIDATE`: toggle single selection (current behavior)
   - For `MULTIPLE_MEMBER`: toggle multi-selection, max = `votes_allowed_per_voter`
   - Show a count badge: "X of Y votes selected"

c) **Candidate card UI (around line 897-980):**
   - Show a checkmark icon for selected candidates
   - Disable selection when count reaches limit (unless deselecting)
   - Show remaining votes indicator in the header "You can vote for up to Y candidates"

d) **handleCastVote() (line 406-430):**
   - For SINGLE_CANDIDATE: call `castVote(electionId, candidateId)` as before
   - For MULTIPLE_MEMBER: call `castVoteBatch(electionId, candidateIds)`

e) **Success modal (line 1035-1076):**
   - Update message for multi-member: "Your votes have been securely recorded"

### 6. Mobile: Show `voting_type` info on election list cards (around line 612-681)

Add voting type badge on election cards showing "Single Candidate" or "Multi-Member (X votes)"

### 7. API: Update `GET /elections/{id}` response

Ensure the election detail API returns `voting_type` and `votes_allowed_per_voter` fields so the mobile app can read them.

## Database / Model Verification

The `Election` model in `backend/app/models/election.py` already has:
```python
voting_type = Column(Enum(VotingType))
votes_allowed_per_voter = Column(Integer, default=1)
```

The latest migration `backend/migrations/versions/6af289881267_add_voting_type_and_votes_allowed_to_.py` already adds these columns.

## Testing Flow

1. Create an election with `voting_type=MULTIPLE_MEMBER` and `votes_allowed_per_voter=3`
2. Login as a voter on the mobile app
3. Open the election detail
4. **Expected**: See "You can vote for up to 3 candidates" at the top of the candidate list
5. Select 3 candidates → Cast button becomes active
6. Attempt to select 4th candidate → UI prevents selection or shows warning
7. Submit → All 3 votes recorded
8. Try to vote again → "You have already cast all your allowed votes"
9. For SINGLE_CANDIDATE elections, behavior should remain unchanged (single selection only)

## Files to Modify

| File | Change |
|------|--------|
| `backend/app/repositories/vote_repository.py` | Add `get_user_vote_count_in_election()` |
| `backend/app/services/vote_service.py` | Update `cast_vote()` to check `votes_allowed_per_voter` |
| `backend/app/controllers/vote_controller.py` | Add batch submit endpoint |
| `backend/app/schemas/vote.py` | Add batch vote schema |
| `mobile/src/services/electionService.ts` | Add `castVoteBatch()` |
| `mobile/src/screens/VotingScreen.tsx` | Multi-candidate selection, batch voting, UI updates |