import { Box, Typography } from '@mui/material'
import { AppHeader } from '../components/AppHeader'

export function LayoutsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppHeader />
      <Box component="main" sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>Layouts</Typography>
        <Typography color="text.secondary">Layout authoring is not available yet.</Typography>
      </Box>
    </Box>
  )
}
