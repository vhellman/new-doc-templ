import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Editor } from '@tiptap/core'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { NodeSelection } from '@tiptap/pm/state'
import type { DataField, TextTemplate } from '../domain/model'
import { createDataField, createEmptyTextDocument } from '../domain/factories'
import { canonicalizeHtml, toEditorHtml } from '../lib/html'
import type { InspectorTab, SelectedDocumentNode } from './selection'
import { TextReferenceNode } from './TextReferenceNode'
import { VariableNode } from './VariableNode'
import {
  detectAutocomplete,
  getAutocompleteItems,
  manualAutocomplete,
  type AutocompleteItem,
  type AutocompleteKind,
  type AutocompleteState,
} from './autocomplete'

interface UseTextEditorOptions {
  fields: DataField[]
  texts: TextTemplate[]
  selectedTextId: string
  setFields: Dispatch<SetStateAction<DataField[]>>
  setTexts: Dispatch<SetStateAction<TextTemplate[]>>
}

function sameAutocompleteContext(a: AutocompleteState | null, b: AutocompleteState | null) {
  if (!a || !b) return false

  return a.kind === b.kind
    && a.from === b.from
    && a.query === b.query
    && Boolean(a.manual) === Boolean(b.manual)
}

export function useTextEditor({
  fields,
  texts,
  selectedTextId,
  setFields,
  setTexts,
}: UseTextEditorOptions) {
  const [autocomplete, setAutocomplete] = useState<AutocompleteState | null>(null)
  const [autocompleteIndex, setAutocompleteIndex] = useState(0)
  const [selectedNode, setSelectedNode] = useState<SelectedDocumentNode | null>(null)
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('properties')

  // Tiptap creates editor event handlers once. These refs let those handlers
  // read current React state without recreating the editor instance.
  const editorRef = useRef<Editor | null>(null)
  const fieldsRef = useRef(fields)
  const textsRef = useRef(texts)
  const selectedTextIdRef = useRef(selectedTextId)
  const autocompleteRef = useRef<AutocompleteState | null>(null)
  const autocompleteIndexRef = useRef(0)
  const syncEditorUiRef = useRef<(editor: Editor) => void>(() => undefined)
  const handleEditorKeyDownRef = useRef<(event: KeyboardEvent) => boolean>(() => false)

  fieldsRef.current = fields
  textsRef.current = texts
  selectedTextIdRef.current = selectedTextId

  const autocompleteItems = useMemo(
    () => autocomplete
      ? getAutocompleteItems(autocomplete, fields, texts, selectedTextId)
      : [],
    [autocomplete, fields, texts, selectedTextId],
  )

  function setActiveAutocompleteIndex(index: number) {
    autocompleteIndexRef.current = index
    setAutocompleteIndex(index)
  }

  function setAutocompleteState(next: AutocompleteState | null, resetIndex = false) {
    autocompleteRef.current = next
    setAutocomplete(next)

    if (resetIndex || !next) setActiveAutocompleteIndex(0)
  }

  function closeAutocomplete() {
    setAutocompleteState(null)
  }

  function selectInsertedNode(
    type: 'variable' | 'textReference',
    attrKey: 'fieldId' | 'textId',
    attrValue: string,
    near: number,
  ) {
    const editor = editorRef.current
    if (!editor) return

    let bestPosition: number | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    editor.state.doc.descendants((node, position) => {
      if (node.type.name !== type || node.attrs[attrKey] !== attrValue) return

      const distance = Math.abs(position - near)
      if (distance < bestDistance) {
        bestDistance = distance
        bestPosition = position
      }
    })

    if (bestPosition !== null) {
      editor.chain().focus().setNodeSelection(bestPosition).run()
    }

    setInspectorTab('properties')
  }

  function insertVariable(field: DataField, target = autocompleteRef.current) {
    const editor = editorRef.current
    if (!editor || !target) return

    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: target.from, to: target.to },
        {
          type: 'variable',
          attrs: {
            fieldId: field.id,
            label: field.label,
          },
        },
        { updateSelection: true },
      )
      .run()

    closeAutocomplete()
    selectInsertedNode('variable', 'fieldId', field.id, target.from)
  }

  function insertReference(text: TextTemplate, target = autocompleteRef.current) {
    const editor = editorRef.current
    if (!editor || !target) return

    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: target.from, to: target.to },
        {
          type: 'textReference',
          attrs: {
            textId: text.id,
            label: text.name,
            conditionFieldId: null,
            conditionExpected: true,
          },
        },
        { updateSelection: true },
      )
      .run()

    closeAutocomplete()
    selectInsertedNode('textReference', 'textId', text.id, target.from)
  }

  function createAndInsertField(label: string, target: AutocompleteState) {
    const field = createDataField(label, fieldsRef.current)
    setFields((current) => [...current, field])
    insertVariable(field, target)
  }

  function chooseAutocompleteItem(
    item: AutocompleteItem,
    target = autocompleteRef.current,
  ) {
    if (!target) return

    if (item.kind === 'variable') insertVariable(item.field, target)
    if (item.kind === 'reference') insertReference(item.text, target)
    if (item.kind === 'create-field') createAndInsertField(item.label, target)
  }

  const editor = useEditor({
    extensions: [StarterKit, VariableNode, TextReferenceNode],
    content: toEditorHtml(texts.find((text) => text.id === selectedTextId)?.html ?? createEmptyTextDocument(), fields, texts),
    editorProps: {
      attributes: { class: 'document-editor' },
      handleKeyDown: (_view, event) => handleEditorKeyDownRef.current(event),
    },
    onUpdate: ({ editor: currentEditor }) => {
      const textId = selectedTextIdRef.current
      setTexts((current) => current.map((text) =>
        text.id === textId
          ? { ...text, html: canonicalizeHtml(currentEditor.getHTML()) }
          : text,
      ))
      syncEditorUiRef.current(currentEditor)
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      syncEditorUiRef.current(currentEditor)
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  syncEditorUiRef.current = (currentEditor) => {
    const nextAutocomplete = detectAutocomplete(currentEditor)
    const previousAutocomplete = autocompleteRef.current

    if (nextAutocomplete) {
      setAutocompleteState(
        nextAutocomplete,
        !sameAutocompleteContext(previousAutocomplete, nextAutocomplete),
      )
    } else if (previousAutocomplete && !previousAutocomplete.manual) {
      closeAutocomplete()
    }

    const { selection } = currentEditor.state
    if (selection instanceof NodeSelection) {
      if (selection.node.type.name === 'variable') {
        setSelectedNode({
          kind: 'variable',
          pos: selection.from,
          attrs: { ...selection.node.attrs },
        })
        setInspectorTab('properties')
        return
      }

      if (selection.node.type.name === 'textReference') {
        setSelectedNode({
          kind: 'reference',
          pos: selection.from,
          attrs: { ...selection.node.attrs },
        })
        setInspectorTab('properties')
        return
      }
    }

    setSelectedNode(null)
  }

  // The autocomplete popup leaves focus in Tiptap. Navigation keys therefore
  // need to be consumed by the editor while the popup is open.
  handleEditorKeyDownRef.current = (event) => {
    const state = autocompleteRef.current
    if (!state || event.isComposing) return false

    const items = getAutocompleteItems(
      state,
      fieldsRef.current,
      textsRef.current,
      selectedTextIdRef.current,
    )

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()

      if (items.length === 0) return true

      const direction = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex = (
        autocompleteIndexRef.current
        + direction
        + items.length
      ) % items.length

      setActiveAutocompleteIndex(nextIndex)
      return true
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      if (items.length === 0) return false

      event.preventDefault()
      event.stopPropagation()

      const index = Math.min(autocompleteIndexRef.current, items.length - 1)
      chooseAutocompleteItem(items[index], state)
      return true
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeAutocomplete()
      return true
    }

    return false
  }

  useEffect(() => {
    if (!editor) return

    const selectedText = textsRef.current.find((text) => text.id === selectedTextId)
    if (!selectedText) return

    editor.commands.setContent(toEditorHtml(selectedText.html, fieldsRef.current, textsRef.current), { emitUpdate: false })
    closeAutocomplete()
    setSelectedNode(null)
    setInspectorTab('properties')
  }, [editor, selectedTextId])

  function openManualInsert(kind: AutocompleteKind) {
    const currentEditor = editorRef.current
    if (!currentEditor) return

    currentEditor.commands.focus()
    setAutocompleteState(manualAutocomplete(currentEditor, kind), true)
    setSelectedNode(null)
  }

  function updateField(fieldId: string, patch: Partial<Omit<DataField, 'id'>>) {
    setFields((current) => current.map((field) =>
      field.id === fieldId ? { ...field, ...patch } : field,
    ))

    if (
      selectedNode?.kind !== 'variable'
      || String(selectedNode.attrs.fieldId ?? '') !== fieldId
      || !editorRef.current
    ) {
      return
    }

    const currentField = fieldsRef.current.find((field) => field.id === fieldId)
    if (!currentField) return
    editorRef.current.chain().focus().setNodeSelection(selectedNode.pos)
      .updateAttributes('variable', { label: { ...currentField, ...patch }.label }).run()
  }

  return {
    editor,
    selectedNode,
    inspectorTab,
    setInspectorTab,
    autocomplete,
    autocompleteItems,
    autocompleteIndex,
    setActiveAutocompleteIndex,
    closeAutocomplete,
    chooseAutocompleteItem,
    openManualInsert,
    updateField,
    createAndInsertField,
    clearSelectedNode: () => setSelectedNode(null),
  }
}
