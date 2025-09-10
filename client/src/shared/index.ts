// Shared exports - только главные категории
export * from './components'

// Utils
export * from './utils/color'
export * from './utils/errorHandler'  
export * from './utils/lessonUtils'

// Services
export { default as api, setAuthToken, clearAuthToken } from './services/api'

// Hooks & Context
export { useToast, ToastProvider } from './hooks/useToast'
export { MascotProvider } from './mascot/context/MascotContext'

// Layouts
export { default as GameLayout } from './layout/GameLayout/GameLayout'
export { default as MainLayout } from './layout/MainLayout/MainLayout'
export { default as MobileLayout } from './layout/MobileLayout/MobileLayout'
export { default as Sidebar } from './layout/Sidebar/Sidebar'

// Mascot
export { default as FreeRoamMascot } from './mascot/FreeRoamMascot/FreeRoamMascot';
export { default as GlobalMascot } from './mascot/GlobalMascot/GlobalMascot';
export { default as InterceptedMascot } from './mascot/InterceptedMascot/InterceptedMascot';
export { default as LottieMascot } from './mascot/LottieMascot/LottieMascot';
export { default as StaticMascot } from './mascot/StaticMascot/StaticMascot';

// Effects
export { default as NatureElements } from './effects/NatureElements/NatureElements'
export { default as ScrollReveal } from './effects/ScrollReveal/ScrollReveal'
