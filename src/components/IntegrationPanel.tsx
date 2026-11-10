import { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { DataField, TextContract, TextTemplate } from '../domain/model'
import { buildExamplePayload } from '../lib/payload'
import { isAlwaysRequired, toDeveloperContract } from '../lib/contract'
import { renderText } from '../lib/render'

interface Props {
  textId: string
  contract: TextContract
  texts: TextTemplate[]
  fields: DataField[]
  html: string
  onRegisterFields: (schema: Record<string, DataField['type']>) => string | null
}

export function IntegrationPanel({ textId, contract, texts, fields, html, onRegisterFields }: Props) {
  const developerContract = useMemo(() => toDeveloperContract(contract), [contract])
  const examplePayload = useMemo(() => buildExamplePayload(contract), [contract])
  const [payloadText, setPayloadText] = useState(() => JSON.stringify({ data: examplePayload }, null, 2))
  const [renderedHtml, setRenderedHtml] = useState('')
  const [error, setError] = useState('')
  const [schemaText, setSchemaText] = useState('{\n  "claim.decisionDate": "date"\n}')
  const [schemaMessage, setSchemaMessage] = useState('')

  useEffect(() => {
    const next = JSON.stringify({ data: examplePayload }, null, 2)
    setPayloadText(next)
    try {
      setRenderedHtml(renderText(textId, texts, fields, examplePayload))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not render')
    }
  }, [textId, examplePayload, texts, fields])

  function tryRender() {
    try {
      const request = JSON.parse(payloadText)
      if (!request || typeof request.data !== 'object' || Array.isArray(request.data)) throw new Error('Request must contain a data object.')
      setRenderedHtml(renderText(textId, texts, fields, request.data))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Invalid JSON')
    }
  }

  function registerSchema() {
    try {
      const schema = JSON.parse(schemaText)
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error('Use a JSON object of path: type.')
      const result = onRegisterFields(schema)
      setSchemaMessage(result ?? 'Fields added to the team catalogue.')
    } catch (reason) { setSchemaMessage(reason instanceof Error ? reason.message : 'Invalid schema') }
  }

  const always = contract.requirements.filter(isAlwaysRequired)
  const conditional = contract.requirements.filter((item) => !isAlwaysRequired(item))

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Everything here is derived from this text and its nested shared texts.
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Required data</Typography>
      <Stack divider={<Divider flexItem />}>
        {always.map(({ field }) => (
          <Box key={field.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, py: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, overflowWrap: 'anywhere' }}>{field.path}</Typography>
              <Typography variant="caption" color="text.secondary">{field.label}</Typography>
            </Box>
            <Chip label={field.type} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} />
          </Box>
        ))}

        {conditional.map((requirement) => (
          <Box key={requirement.field.id} sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, overflowWrap: 'anywhere' }}>{requirement.field.path}</Typography>
                <Typography variant="caption" color="text.secondary">{requirement.field.label}</Typography>
              </Box>
              <Chip label={requirement.field.type} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} />
            </Box>
            <Stack spacing={0.5} sx={{ mt: 0.75 }}>
              {requirement.requiredWhen.map((conditions, index) => (
                <Chip
                  key={index}
                  size="small"
                  label={`when ${conditions.map((condition) => `${condition.path} = ${condition.expected}`).join(' AND ')}`}
                  sx={{ alignSelf: 'flex-start', maxWidth: '100%', bgcolor: 'warning.50', color: 'warning.900', fontSize: 10, '& .MuiChip-label': { whiteSpace: 'normal' } }}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>

      {contract.requirements.length === 0 && (
        <Typography variant="body2" color="text.secondary">This text does not require any data.</Typography>
      )}

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2">Example render request</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>POST /texts/{textId}/render</Typography>
      <Paper variant="outlined" component="pre" sx={{ p: 1.5, overflow: 'auto', bgcolor: 'grey.50', fontSize: 11, lineHeight: 1.5 }}>{JSON.stringify({ data: examplePayload }, null, 2)}</Paper>
      <Accordion disableGutters elevation={0} variant="outlined" sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<span>⌄</span>}><Typography variant="subtitle2">Register team data fields</Typography></AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Developers can add fields before authors use them. Existing fields are matched by path and type.</Typography>
          <TextField fullWidth multiline minRows={4} label="Path and type schema" value={schemaText} onChange={event => setSchemaText(event.target.value)} slotProps={{ htmlInput: { spellCheck: false } }} sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12 } }} />
          <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={registerSchema}>Register fields</Button>
          {schemaMessage && <Alert severity={schemaMessage.startsWith('Fields added') ? 'success' : 'error'} sx={{ mt: 1 }}>{schemaMessage}</Alert>}
        </AccordionDetails>
      </Accordion>
      <Accordion disableGutters elevation={0} variant="outlined" sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<span>⌄</span>}><Typography variant="subtitle2">Template HTML</Typography></AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}><Box component="pre" sx={{ p: 1.5, m: 0, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 11 }}>{html}</Box></AccordionDetails>
      </Accordion>
      <Accordion disableGutters elevation={0} variant="outlined" sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<span>⌄</span>}>
          <Typography variant="subtitle2">Raw contract</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Box component="pre" sx={{ m: 0, p: 1.5, maxHeight: 320, overflow: 'auto', bgcolor: 'grey.50', fontSize: 10 }}>
            {JSON.stringify(developerContract, null, 2)}
          </Box>
        </AccordionDetails>
      </Accordion>
      <Accordion disableGutters elevation={0} variant="outlined" sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<span>⌄</span>}><Typography variant="subtitle2">Try integration</Typography></AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth multiline minRows={9} value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
            slotProps={{ htmlInput: { spellCheck: false } }}
            sx={{ '& .MuiInputBase-root': { bgcolor: '#15181d', color: '#dbe2ea', fontFamily: 'monospace', fontSize: 11, alignItems: 'flex-start' } }}
          />
          <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={tryRender}>Render request</Button>
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Result</Typography>
          <Paper variant="outlined" className="drawer-document-preview" sx={{ minHeight: 120, p: 1.5 }} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
