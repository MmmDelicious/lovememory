/**
 * App-specific typed hooks for Redux
 * Re-export from the existing store hooks for now
 */

// Re-export existing hooks temporarily during migration
export { useAppSelector, useAppDispatch, useAuthActions } from '../../store/hooks'

// Later these will be replaced with typed hooks for the new store structure
