import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import type { TextTemplate } from '../domain/model'

interface Props {
  texts: TextTemplate[]
  selectedTextId: string
  onSelectText: (textId: string) => void
  onAddText: () => void
}

export function TextNavigation({
  texts,
  selectedTextId,
  onSelectText,
  onAddText,
}: Props) {
  return (
    <Box
      component="aside"
      sx={{
        overflow: 'auto',
        bgcolor: '#20242a',
        color: 'common.white',
        p: 1.5,
        maxHeight: { xs: 190, md: 'none' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 1,
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: 'grey.500', lineHeight: 1 }}>
            Workspace
          </Typography>
          <Typography variant="subtitle2">Texts</Typography>
        </Box>

        <IconButton
          size="small"
          onClick={onAddText}
          aria-label="Add text"
          sx={{
            color: 'common.white',
            border: '1px solid',
            borderColor: 'grey.700',
            borderRadius: 1.5,
          }}
        >
          +
        </IconButton>
      </Box>

      <List dense disablePadding>
        {texts.map((text) => (
          <ListItemButton
            key={text.id}
            selected={text.id === selectedTextId}
            onClick={() => onSelectText(text.id)}
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              color: 'grey.300',
              '&:hover': { bgcolor: '#292e35' },
              '&.Mui-selected': { bgcolor: '#353a43', color: 'common.white' },
              '&.Mui-selected:hover': { bgcolor: '#3d434d' },
            }}
          >
            <ListItemText
              primary={text.name}
              secondary={text.id}
              slotProps={{
                primary: { sx: { fontSize: 13, fontWeight: 600 } },
                secondary: {
                  sx: {
                    color: 'grey.500',
                    fontSize: 10,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}
