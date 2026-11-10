import { useEffect, useMemo, useRef } from 'react'
import {
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from '@mui/material'
import type { AutocompleteItem, AutocompleteState } from '../editor/autocomplete'

interface Props {
  state: AutocompleteState
  items: AutocompleteItem[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onSelect: (item: AutocompleteItem) => void
  onClose: () => void
}

export function AutocompleteMenu({
  state,
  items,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  onClose,
}: Props) {
  const itemRefs = useRef<Array<HTMLLIElement | null>>([])
  const virtualAnchor = useMemo(
    () => ({ getBoundingClientRect: () => new DOMRect(state.left, state.top, 0, 0) }),
    [state.left, state.top],
  )

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  return (
    <Popper
      open
      anchorEl={virtualAnchor}
      placement="bottom-start"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      modifiers={[{ name: 'preventOverflow', options: { padding: 12 } }]}
    >
      <Paper
        elevation={8}
        sx={{
          width: 400,
          maxWidth: 'calc(100vw - 24px)',
          overflow: 'hidden',
          borderRadius: 2,
        }}
        onMouseDown={(event) => event.preventDefault()}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            px: 1.5,
            py: 1.25,
          }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.1 }}>
              {state.kind === 'variable' ? 'Variable' : 'Shared text'}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 0.25 }}>
              {state.kind === 'variable' ? 'Find or create data' : 'Find reusable text'}
            </Typography>
          </Box>
          <IconButton size="small" aria-label="Close autocomplete" onClick={onClose}>
            ×
          </IconButton>
        </Box>
        <Divider />

        <MenuList dense sx={{ maxHeight: 340, overflow: 'auto', py: 0.5 }}>
          {items.map((item, index) => {
            if (item.kind === 'create-field') {
              return (
                <MenuItem
                  key={`create-field-${item.label}`}
                  ref={(element) => { itemRefs.current[index] = element }}
                  selected={index === activeIndex}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  onClick={() => onSelect(item)}
                  sx={{ color: 'primary.main' }}
                >
                  <ListItemText
                    primary={item.label ? `Create “${item.label}”` : "Create variable…"}
                    secondary="A data path will be generated automatically"
                    slotProps={{
                      primary: { variant: 'body2', fontWeight: 700 },
                      secondary: { fontSize: 11 },
                    }}
                  />
                </MenuItem>
              )
            }

            if (item.kind === 'variable') {
              return (
                <MenuItem
                  key={item.field.id}
                  ref={(element) => { itemRefs.current[index] = element }}
                  selected={index === activeIndex}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  onClick={() => onSelect(item)}
                  sx={{ gap: 1.5 }}
                >
                  <ListItemText
                    primary={item.field.label}
                    secondary={item.field.path}
                    slotProps={{
                      primary: { variant: 'body2', fontWeight: 600 },
                      secondary: { sx: { fontFamily: 'monospace', fontSize: 11 } },
                    }}
                  />
                  <Chip
                    label={item.field.type}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: 10 }}
                  />
                </MenuItem>
              )
            }

            return (
              <MenuItem
                key={item.text.id}
                ref={(element) => { itemRefs.current[index] = element }}
                selected={index === activeIndex}
                onMouseEnter={() => onActiveIndexChange(index)}
                onClick={() => onSelect(item)}
              >
                <ListItemText
                  primary={item.text.name}
                  secondary={item.text.id}
                  slotProps={{
                    primary: { variant: 'body2', fontWeight: 600 },
                    secondary: { sx: { fontFamily: 'monospace', fontSize: 11 } },
                  }}
                />
                <Typography color="text.secondary" aria-hidden>
                  ↳
                </Typography>
              </MenuItem>
            )
          })}

          {items.length === 0 && (
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {emptyStateText(state)}
              </Typography>
            </Box>
          )}
        </MenuList>

        <Divider />
        <Box sx={{ px: 1.5, py: 0.75, display: 'flex', gap: 1.25 }}>
          <Typography variant="caption" color="text.secondary">↑↓ navigate</Typography>
          <Typography variant="caption" color="text.secondary">Enter select</Typography>
          <Typography variant="caption" color="text.secondary">Esc close</Typography>
        </Box>
      </Paper>
    </Popper>
  )
}

function emptyStateText(state: AutocompleteState) {
  if (state.kind === 'reference') {
    return state.query.trim().length === 0
      ? 'Type to search existing shared texts.'
      : 'No matching shared texts.'
  }

  if (state.query.trim().length < 2) {
    return state.manual
      ? 'Type to search variables.'
      : 'Keep typing to search or create a variable.'
  }

  return 'No matches.'
}
