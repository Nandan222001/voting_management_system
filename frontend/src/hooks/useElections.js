import { useSelector, useDispatch } from 'react-redux'
import {
  fetchElections,
  fetchElectionById,
  createElection,
  updateElection,
  deleteElection,
  activateElection,
  closeElection,
  fetchElectionStats,
  selectElections,
  selectCurrentElection,
  selectElectionTotal,
  selectElectionLoading,
  selectElectionActionLoading,
  selectElectionStats,
  clearCurrentElection,
} from '../store/slices/electionSlice'

/**
 * Custom hook for election state and actions.
 * Returns all election data from Redux and action dispatchers.
 */
export default function useElections() {
  const dispatch = useDispatch()

  const elections = useSelector(selectElections)
  const currentElection = useSelector(selectCurrentElection)
  const total = useSelector(selectElectionTotal)
  const loading = useSelector(selectElectionLoading)
  const actionLoading = useSelector(selectElectionActionLoading)
  const stats = useSelector(selectElectionStats)

  const loadElections = (params) => dispatch(fetchElections(params))
  const loadElectionById = (id) => dispatch(fetchElectionById(id))
  const createNewElection = (data) => dispatch(createElection(data))
  const editElection = (id, data) => dispatch(updateElection({ id, data }))
  const removeElection = (id) => dispatch(deleteElection(id))
  const activate = (id) => dispatch(activateElection(id))
  const close = (id) => dispatch(closeElection(id))
  const loadStats = () => dispatch(fetchElectionStats())
  const clearElection = () => dispatch(clearCurrentElection())

  return {
    elections,
    currentElection,
    total,
    loading,
    actionLoading,
    stats,
    loadElections,
    loadElectionById,
    createNewElection,
    editElection,
    removeElection,
    activate,
    close,
    loadStats,
    clearElection,
  }
}
