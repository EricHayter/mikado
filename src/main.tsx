import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider
      theme={{
        primaryColor: 'blue',
        fontFamily: '"Cascadia Mono", "JetBrains Mono", "Menlo", "Monaco", "Consolas", monospace',
        headings: {
          fontFamily: '"Cascadia Mono", "JetBrains Mono", "Menlo", "Monaco", "Consolas", monospace',
        },
        colors: {
          // Custom color palette for Mikado status
          mikado: [
            '#f0fdf4', // lightest - done background
            '#d1fae5',
            '#a7f3d0',
            '#6ee7b7',
            '#34d399',
            '#10b981',
            '#059669',
            '#047857',
            '#065f46',
            '#064e3b', // darkest
          ],
        },
      }}
    >
      <App />
    </MantineProvider>
  </StrictMode>,
)
