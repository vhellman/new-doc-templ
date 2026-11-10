import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { DataField, FieldRequirement, TextContract, TextTemplate } from '../domain/model'
import { buildExamplePayload } from '../lib/payload'
import { getAtPath, setAtPath } from '../lib/data'
import { renderText } from '../lib/render'
import { isAlwaysRequired } from '../lib/contract'

interface Props {
  textId: string
  contract: TextContract
  texts: TextTemplate[]
  fields: DataField[]
  onClose: () => void
}

function isActive(requirement: FieldRequirement, data: Record<string, unknown>) {
  if (isAlwaysRequired(requirement)) return true
  return requirement.requiredWhen.some((conditions) =>
    conditions.every((condition) => getAtPath(data, condition.path) === condition.expected),
  )
}

export function PreviewModal({ textId, contract, texts, fields, onClose }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(() => buildExamplePayload(contract))

  useEffect(() => {
    setData(buildExamplePayload(contract))
  }, [textId, contract])

  const activeRequirements = useMemo(
    () => contract.requirements.filter((requirement) => isActive(requirement, data)),
    [contract, data],
  )
  const html = useMemo(() => renderText(textId, texts, fields, data), [textId, texts, fields, data])

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: { height: '90vh' } }}>
      <DialogTitle sx={{ pr: 7, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="overline" color="text.secondary">Case worker preview</Typography>
        <Typography variant="h6">Test the text with example data</Typography>
        <IconButton onClick={onClose} aria-label="Close preview" sx={{ position: 'absolute', right: 14, top: 14 }}>×</IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '360px minmax(0, 1fr)' }, overflowY: { xs: 'auto', md: 'hidden' } }}>
        <Box sx={{ overflow: 'auto', p: 2.5, borderRight: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This form is generated from the text's derived data requirements. Change booleans to test conditional shared texts.
          </Typography>
          <Stack spacing={2}>
            {activeRequirements.map((requirement) => {
              const { field } = requirement
              const current = getAtPath(data, field.path)

              if (field.type === 'boolean') {
                return (
                  <TextField
                    key={field.id}
                    select
                    fullWidth
                    size="small"
                    label={field.label}
                    value={String(Boolean(current))}
                    onChange={(event) => setData(setAtPath(data, field.path, event.target.value === 'true'))}
                    helperText={field.path}
                    FormHelperTextProps={{ sx: { fontFamily: 'monospace', fontSize: 10 } }}
                  >
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </TextField>
                )
              }

              return (
                <TextField
                  key={field.id}
                  fullWidth
                  size="small"
                  label={field.label}
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                  value={String(current ?? '')}
                  onChange={(event) =>
                    setData(setAtPath(data, field.path, field.type === 'number' ? Number(event.target.value) : event.target.value))
                  }
                  helperText={field.path}
                  slotProps={{
                    inputLabel: field.type === 'date' ? { shrink: true } : undefined,
                    formHelperText: { sx: { fontFamily: 'monospace', fontSize: 10 } },
                  }}
                />
              )
            })}
          </Stack>
        </Box>

        <Box sx={{ overflow: 'auto', p: 3, bgcolor: 'grey.100' }}>
          <Typography variant="overline" color="text.secondary">Rendered document</Typography>
          <Paper
            elevation={2}
            className="document-sheet"
            sx={{ maxWidth: 720, minHeight: 560, mx: 'auto', mt: 1, p: 6 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  )
}
