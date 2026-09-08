import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './styles/clinical-shell.css'
import './styles/supporting-modules.css'
import './styles/organization-analytics.css'
import './styles/anatomy-responsive.css'
import './styles/interaction-polish.css'
import './module-workspaces.css'
import './team-invitations.css'
import './experience-surfaces.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
