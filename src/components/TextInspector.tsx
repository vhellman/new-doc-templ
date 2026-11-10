import type { Editor } from '@tiptap/core'
import {
  Box,
  Button,
  IconButton,
  Divider,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { DataField, FieldType, TextContract, TextTemplate } from '../domain/model'
import type { InspectorTab, SelectedDocumentNode } from '../editor/selection'
import { IntegrationPanel } from './IntegrationPanel'

interface Props {
  tab: InspectorTab
  onTabChange: (tab: InspectorTab) => void
  onClose: () => void
  onRegisterFields: (schema: Record<string, FieldType>) => string | null
  editor: Editor | null
  selectedNode: SelectedDocumentNode | null
  selectedText: TextTemplate
  fields: DataField[]
  texts: TextTemplate[]
  contract: TextContract
  onUpdateField: (fieldId: string, patch: Partial<Omit<DataField, 'id'>>) => void
  onOpenText: (textId: string) => void
  onClearSelection: () => void
}

export function TextInspector({
  tab,
  onTabChange,
  onClose,
  onRegisterFields,
  editor,
  selectedNode,
  selectedText,
  fields,
  texts,
  contract,
  onUpdateField,
  onOpenText,
  onClearSelection,
}: Props) {
  return (
    <Box
      component="aside"
      sx={{
        minWidth: 0,
        bgcolor: 'background.paper',
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2, pt: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Typography variant="overline" color="text.secondary">{selectedText.name}</Typography><IconButton size="small" aria-label="Close inspector" onClick={onClose}>×</IconButton></Box>
        <Tabs
          value={tab}
          onChange={(_, value: InspectorTab) => onTabChange(value)}
          variant="fullWidth"
          sx={{ minHeight: 38, '& .MuiTab-root': { minHeight: 38, py: 0.5 } }}
        >
          <Tab value="properties" label="Properties" />
          <Tab value="integration" label="Integration" />
        </Tabs>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {tab === 'integration' ? (
          <IntegrationPanel textId={selectedText.id} contract={contract} texts={texts} fields={fields} html={selectedText.html} onRegisterFields={onRegisterFields} />
        ) : (
          <PropertiesPanel
            editor={editor}
            selectedNode={selectedNode}
            selectedText={selectedText}
            fields={fields}
            texts={texts}
            contract={contract}
            onUpdateField={onUpdateField}
            onOpenText={onOpenText}
            onClearSelection={onClearSelection}
          />
        )}
      </Box>
    </Box>
  )
}

function PropertiesPanel({
  editor,
  selectedNode,
  selectedText,
  fields,
  texts,
  contract,
  onUpdateField,
  onOpenText,
  onClearSelection,
}: Omit<Props, 'tab' | 'onTabChange' | 'onClose' | 'onRegisterFields'>) {
  if (!selectedNode) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2">Text properties</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Select a variable or shared text in the editor to configure it here.
        </Typography>

        <Stack spacing={1} sx={{ mt: 2 }}>
          <InfoRow label="Data fields" value={String(contract.requirements.length)} />
          <InfoRow label="Shared texts" value={String(contract.referencedTextIds.length)} />
          <InfoRow label="Validation" value={contract.errors.length === 0 ? 'No issues' : `${contract.errors.length} issue(s)`} />
        </Stack>

        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Tip: type <strong>$</strong> for variables or <strong>#</strong> on an empty line for shared text.
        </Typography>
      </Box>
    )
  }

  if (selectedNode.kind === 'variable') {
    const fieldId = String(selectedNode.attrs.fieldId ?? '')
    const field = fields.find((candidate) => candidate.id === fieldId)

    if (!field) {
      return <Box sx={{ p: 2 }}><Typography color="error">This variable is not registered in the data catalogue.</Typography></Box>
    }

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary">Variable</Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>{field.label}</Typography>

        <Stack spacing={2}>
          <TextField
            label="Display name"
            size="small"
            value={field.label}
            onChange={(event) => onUpdateField(field.id, { label: event.target.value })}
            helperText="Shown to case workers in the editor."
          />
          <TextField
            label="API path"
            size="small"
            value={field.path}
            onChange={(event) => onUpdateField(field.id, { path: event.target.value })}
            helperText="Auto-generated for the POC; integrating systems send data at this path."
            inputProps={{ spellCheck: false }}
          />
          <TextField
            select
            label="Type"
            size="small"
            value={field.type}
            onChange={(event) => onUpdateField(field.id, { type: event.target.value as FieldType })}
          >
            <MenuItem value="string">string</MenuItem>
            <MenuItem value="number">number</MenuItem>
            <MenuItem value="date">date</MenuItem>
            <MenuItem value="boolean">boolean</MenuItem>
          </TextField>
          <TextField
            label="Description"
            size="small"
            multiline
            minRows={3}
            value={field.description ?? ''}
            onChange={(event) => onUpdateField(field.id, { description: event.target.value })}
            placeholder="What does this value mean?"
          />
        </Stack>

        <Divider sx={{ my: 2 }} />
        <Button
          size="small"
          color="error"
          disabled={!editor}
          onClick={() => {
            if (!editor) return
            editor.chain().focus().setNodeSelection(selectedNode.pos).deleteSelection().run()
            onClearSelection()
          }}
        >
          Remove from text
        </Button>
      </Box>
    )
  }

  const textId = String(selectedNode.attrs.textId ?? '')
  const referencedText = texts.find((candidate) => candidate.id === textId)
  const conditionFieldId = selectedNode.attrs.conditionFieldId ? String(selectedNode.attrs.conditionFieldId) : ''
  const conditional = Boolean(conditionFieldId)
  const expected = selectedNode.attrs.conditionExpected !== false
  const booleanFields = fields.filter((field) => field.type === 'boolean')

  function updateReference(attrs: Record<string, unknown>) {
    if (!editor || !selectedNode) return
    editor
      .chain()
      .focus()
      .setNodeSelection(selectedNode.pos)
      .updateAttributes('textReference', attrs)
      .run()
  }

  function setConditional(enabled: boolean) {
    if (!enabled) {
      updateReference({
        conditionFieldId: null,
        conditionLabel: null,
        conditionExpected: true,
      })
      return
    }

    const field = booleanFields[0]
    if (!field) return
    updateReference({
      conditionFieldId: field.id,
      conditionLabel: field.label,
      conditionExpected: true,
    })
  }

  function setConditionField(fieldId: string) {
    const field = booleanFields.find((candidate) => candidate.id === fieldId)
    if (!field) return
    updateReference({
      conditionFieldId: field.id,
      conditionLabel: field.label,
    })
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">Shared text</Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>{referencedText?.name ?? textId}</Typography>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>Include</Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={conditional ? 'conditional' : 'always'}
        onChange={(_, value) => value && setConditional(value === 'conditional')}
      >
        <ToggleButton value="always">Always</ToggleButton>
        <ToggleButton value="conditional">When…</ToggleButton>
      </ToggleButtonGroup>

      {conditional && (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <TextField
            select
            size="small"
            fullWidth
            label="Boolean variable"
            value={conditionFieldId}
            onChange={(event) => setConditionField(event.target.value)}
          >
            {booleanFields.map((field) => <MenuItem key={field.id} value={field.id}>{field.label}</MenuItem>)}
          </TextField>
          <TextField
            select
            size="small"
            fullWidth
            label="Required value"
            value={expected ? 'true' : 'false'}
            onChange={(event) => updateReference({ conditionExpected: event.target.value === 'true' })}
          >
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </TextField>
        </Stack>
      )}

      {conditional && booleanFields.length === 0 && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          Create a boolean variable first.
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />
      <Stack spacing={1} alignItems="flex-start">
        <Button size="small" onClick={() => onOpenText(textId)}>Open shared text</Button>
        <Button
          size="small"
          color="error"
          disabled={!editor}
          onClick={() => {
            if (!editor) return
            editor.chain().focus().setNodeSelection(selectedNode.pos).deleteSelection().run()
            onClearSelection()
          }}
        >
          Remove reference
        </Button>
      </Stack>
    </Box>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Box>
  )
}
