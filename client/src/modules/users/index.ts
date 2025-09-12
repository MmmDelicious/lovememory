// Users module exports
export { default as ProfilePage } from './pages/ProfilePage/ProfilePage';
export { default as OnboardingInterestsPage } from './pages/OnboardingInterestsPage/OnboardingInterestsPage';

// New architecture exports
export * from './modules'; './pages/OnboardingInterestsPage/OnboardingInterestsPage'

export { default as InterestSelector } from './components/InterestSelector/InterestSelector'
export { default as GenderSelector } from './components/GenderSelector/GenderSelector'

export { usePairing } from './hooks/usePairing'
