import type { Editor } from '@tiptap/core'
import { EditorContent } from '@tiptap/react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material'
import type { TextContract, TextTemplate } from '../domain/model'
import type { AutocompleteKind } from '../editor/autocomplete'

interface Props {
  editor: Editor | null
  text: TextTemplate
  contract: TextContract
  onRename: (name: string) => void
  onInsert: (kind: AutocompleteKind) => void
}

export function TextEditorWorkspace({
  editor,
  text,
  contract,
  onRename,
  onInsert,
}: Props) {
  return (
    <Box
      component="section"
      sx={{
        minWidth: 0,
        overflow: 'auto',
        px: { xs: 2.5, xl: 4 },
        py: 3.25,
      }}
    >
      <Box sx={{ maxWidth: 930, mx: 'auto' }}>
        <EditorHeader text={text} onRename={onRename} />
        <EditorToolbar editor={editor} onInsert={onInsert} />

        <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2.5 }}>
          <EditorContent editor={editor} />
        </Paper>

        <ContractSummary contract={contract} />

        {contract.errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {contract.errors.map((error) => (
              <Typography variant="body2" key={error}>
                {error}
              </Typography>
            ))}
          </Alert>
        )}
      </Box>
    </Box>
  )
}

function EditorHeader({
  text,
  onRename,
}: {
  text: TextTemplate
  onRename: (name: string) => void
}) {
  const help = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
        Writing shortcuts
      </Typography>
      <Typography variant="body2">
        <kbd>$</kbd> find a variable, or keep typing to create one
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        <kbd>#</kbd> find an existing shared text on an empty line
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        Select inserted content to configure it in Properties.
      </Typography>
    </Box>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        mb: 2,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Text
        </Typography>
        <TextField
          variant="standard"
          fullWidth
          value={text.name}
          onChange={(event) => onRename(event.target.value)}
          slotProps={{
            input: {
              disableUnderline: true,
              sx: { fontSize: 25, fontWeight: 650 },
            },
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Compose content and data requirements together.
        </Typography>
      </Box>

      <Tooltip title={help} arrow placement="left-start">
        <IconButton
          size="small"
          aria-label="Template help"
          sx={{ border: 1, borderColor: 'divider' }}
        >
          ?
        </IconButton>
      </Tooltip>
    </Box>
  )
}

function EditorToolbar({
  editor,
  onInsert,
}: {
  editor: Editor | null
  onInsert: (kind: AutocompleteKind) => void
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      <ToggleButton
        value="bold"
        selected={Boolean(editor?.isActive('bold'))}
        size="small"
        onChange={() => editor?.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <strong>B</strong>
      </ToggleButton>
      <ToggleButton
        value="italic"
        selected={Boolean(editor?.isActive('italic'))}
        size="small"
        onChange={() => editor?.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <em>I</em>
      </ToggleButton>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Button variant="outlined" size="small" onClick={() => onInsert('variable')}>
        $ Variable
      </Button>
      <Button variant="outlined" size="small" onClick={() => onInsert('reference')}>
        # Shared text
      </Button>
    </Stack>
  )
}

function ContractSummary({ contract }: { contract: TextContract }) {
  const dataFieldLabel = `${contract.requirements.length} data field${
    contract.requirements.length === 1 ? '' : 's'
  }`
  const sharedTextLabel = `${contract.referencedTextIds.length} shared text${
    contract.referencedTextIds.length === 1 ? '' : 's'
  }`
  const issueLabel = contract.errors.length > 0
    ? `${contract.errors.length} issue${contract.errors.length === 1 ? '' : 's'}`
    : 'No issues'

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 1.25,
        px: 1.5,
        py: 1.1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        bgcolor: 'grey.50',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="overline" color="text.secondary">
          Derived automatically
        </Typography>
        <Chip size="small" label={dataFieldLabel} />
        <Chip size="small" label={sharedTextLabel} />
      </Stack>

      <Chip
        size="small"
        color={contract.errors.length > 0 ? 'error' : 'success'}
        variant="outlined"
        label={issueLabel}
      />
    </Paper>
  )
}
