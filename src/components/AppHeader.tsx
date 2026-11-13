import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'

interface Props {
  onPreview?: () => void
}

export function AppHeader({ onPreview }: Props) {
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar
        sx={{
          minHeight: '68px !important',
          px: 3,
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'grey.900',
              color: 'common.white',
              fontWeight: 800,
            }}
          >
            D
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.1 }}>
              Document platform
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Authoring POC
            </Typography>
          </Box>
        </Stack>

        <Stack component="nav" aria-label="Workspace" direction="row" spacing={1}>
          <Button component={Link} to="/texts" activeProps={{ 'aria-current': 'page' }} sx={{ '&[aria-current="page"]': { bgcolor: 'action.selected' } }}>Texts</Button>
          <Button component={Link} to="/layouts" activeProps={{ 'aria-current': 'page' }} sx={{ '&[aria-current="page"]': { bgcolor: 'action.selected' } }}>Layouts</Button>
        </Stack>

        {onPreview && <Button variant="contained" size="small" onClick={onPreview}>
          Preview
        </Button>}
      </Toolbar>
    </AppBar>
  )
}
