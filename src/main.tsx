import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/design-tokens.css'
import './styles.css'
import './styles/clinical-shell.css'
import './styles/supporting-modules.css'
import './styles/organization-analytics.css'
import './styles/anatomy-responsive.css'
import './module-workspaces.css'
import './styles/clinical-sidebar.css'
import './styles/concept-shell.css'
import './styles/concept-modules.css'
import './styles/workspace-page-header.css'
import './styles/clareza-viva.css'
import './styles/overview-case.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
