import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Tooltip } from '@mui/material'
import type { DataField, FieldType, TextTemplate } from './domain/model'
import { TEAM_ID, initialFields, initialTexts } from './domain/seed'
import { createTextTemplate } from './domain/factories'
import { analyzeText } from './lib/contract'
import { useTextEditor } from './editor/useTextEditor'
import type { AutocompleteState } from './editor/autocomplete'
import { AppHeader } from './components/AppHeader'
import { AutocompleteMenu } from './components/AutocompleteMenu'
import { PreviewModal } from './components/PreviewModal'
import { TextEditorWorkspace } from './components/TextEditorWorkspace'
import { TextInspector } from './components/TextInspector'
import { TextNavigation } from './components/TextNavigation'

function load<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
const types = new Set<FieldType>(['string','number','date','boolean'])
const titleFor = (path: string) => path.split('.').at(-1)!.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())

export default function App() {
  const [fields, setFields] = useState<DataField[]>(() =>
    load<Array<DataField & { availability?: string }>>('doc-poc-fields-v2', initialFields)
      .map(({ availability: _legacyStatus, ...field }) => field),
  )
  const [texts, setTexts] = useState<TextTemplate[]>(() => load('doc-poc-texts-v2', initialTexts))
  const [selectedTextId, setSelectedTextId] = useState('payment-reminder')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [newFieldName, setNewFieldName] = useState<string | null>(null)
  const [pendingInsert, setPendingInsert] = useState<AutocompleteState | null>(null)
  useEffect(() => { localStorage.setItem('doc-poc-fields-v2', JSON.stringify(fields)) }, [fields])
  useEffect(() => { localStorage.setItem('doc-poc-texts-v2', JSON.stringify(texts)) }, [texts])

  const selectedText = texts.find(text => text.id === selectedTextId) ?? texts[0]
  const contract = useMemo(() => analyzeText(selectedTextId, texts, fields), [selectedTextId, texts, fields])
  const textEditor = useTextEditor({ fields, texts, selectedTextId, setFields, setTexts })
  useEffect(() => { if (textEditor.selectedNode) setInspectorOpen(true) }, [textEditor.selectedNode])
  function renameSelectedText(name: string) { setTexts(current => current.map(text => text.id === selectedTextId ? { ...text, name } : text)) }
  function addText() { const text = createTextTemplate('Untitled text', texts); setTexts(current => [...current, text]); setSelectedTextId(text.id) }
  function registerFields(schema: Record<string, FieldType>): string | null {
    const entries = Object.entries(schema)
    if (!entries.length) return 'Add at least one path.'
    for (const [path, type] of entries) {
      if (!/^[A-Za-z][\w]*(\.[A-Za-z][\w]*)+$/.test(path)) return `Invalid API path: ${path}`
      if (!types.has(type)) return `Invalid type for ${path}. Use string, number, date, or boolean.`
      const existing = fields.find(field => field.teamId === TEAM_ID && field.path === path)
      if (existing && existing.type !== type) return `Type mismatch at ${path}: catalogue says ${existing.type}. Resolve it before registering.`
    }
    setFields(current => {
      const next = [...current]
      for (const [path, type] of entries) {
        const index = next.findIndex(field => field.teamId === TEAM_ID && field.path === path)
        if (index < 0) next.push({ id: `field-${crypto.randomUUID()}`, teamId: TEAM_ID, path, label: titleFor(path), type })
      }
      return next
    })
    return null
  }
  if (!selectedText) return null
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppHeader onPreview={() => setPreviewOpen(true)} />
      <Box component="main" sx={{ minHeight: 'calc(100vh - 68px)', display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: inspectorOpen ? '210px minmax(0, 1fr) 340px' : '210px minmax(0, 1fr)', xl: inspectorOpen ? '240px minmax(0, 1fr) 390px' : '240px minmax(0, 1fr)' }, gridTemplateRows: { xs: 'auto auto auto', md: 'auto' } }}>
        <TextNavigation texts={texts} selectedTextId={selectedTextId} onSelectText={setSelectedTextId} onAddText={addText} />
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pt: 1, gap: 1 }}>
            <Tooltip title="Integration"><IconButton aria-label="Integration" onClick={() => { textEditor.setInspectorTab('integration'); setInspectorOpen(true) }} sx={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}>&lt;/&gt;</IconButton></Tooltip>
            {!inspectorOpen && <Tooltip title="Properties"><IconButton aria-label="Properties" onClick={() => { textEditor.setInspectorTab('properties'); setInspectorOpen(true) }}>☷</IconButton></Tooltip>}
          </Box>
          <TextEditorWorkspace editor={textEditor.editor} text={selectedText} contract={contract} onRename={renameSelectedText} onInsert={textEditor.openManualInsert} />
        </Box>
        {inspectorOpen && <TextInspector tab={textEditor.inspectorTab} onTabChange={textEditor.setInspectorTab} onClose={() => setInspectorOpen(false)} editor={textEditor.editor} selectedNode={textEditor.selectedNode} selectedText={selectedText} fields={fields} texts={texts} contract={contract} onUpdateField={textEditor.updateField} onRegisterFields={registerFields} onOpenText={setSelectedTextId} onClearSelection={textEditor.clearSelectedNode} />}
      </Box>
      {textEditor.autocomplete && <AutocompleteMenu state={textEditor.autocomplete} items={textEditor.autocompleteItems} activeIndex={Math.min(textEditor.autocompleteIndex, Math.max(textEditor.autocompleteItems.length - 1, 0))} onActiveIndexChange={textEditor.setActiveAutocompleteIndex} onSelect={item => { if (item.kind === 'create-field' && !item.label) { setPendingInsert(textEditor.autocomplete); setNewFieldName(''); textEditor.closeAutocomplete() } else textEditor.chooseAutocompleteItem(item, textEditor.autocomplete); setInspectorOpen(true) }} onClose={textEditor.closeAutocomplete} />}
      <Dialog open={newFieldName !== null} onClose={() => setNewFieldName(null)} fullWidth maxWidth="xs"><DialogTitle>Create variable</DialogTitle><DialogContent><TextField autoFocus fullWidth label="Display name" value={newFieldName ?? ''} onChange={event => setNewFieldName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && newFieldName?.trim() && pendingInsert) { textEditor.createAndInsertField(newFieldName.trim(), pendingInsert); setNewFieldName(null) } }} sx={{ mt: 1 }} /></DialogContent><DialogActions><Button onClick={() => setNewFieldName(null)}>Cancel</Button><Button variant="contained" disabled={!newFieldName?.trim()} onClick={() => { if (pendingInsert && newFieldName?.trim()) textEditor.createAndInsertField(newFieldName.trim(), pendingInsert); setNewFieldName(null) }}>Create</Button></DialogActions></Dialog>
      {previewOpen && <PreviewModal textId={selectedTextId} contract={contract} texts={texts} fields={fields} onClose={() => setPreviewOpen(false)} />}
    </Box>
  )
}
