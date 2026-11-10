import React from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App'
import './styles.css'

const theme = createTheme({ palette: { primary: { main: '#315a93' }, background: { default: '#f4f6f9' } }, shape: { borderRadius: 8 }, typography: { fontFamily: 'Inter, system-ui, sans-serif' } })
createRoot(document.getElementById('root')!).render(<React.StrictMode><ThemeProvider theme={theme}><CssBaseline/><App/></ThemeProvider></React.StrictMode>)
