import type { Editor } from '@tiptap/core'
import type { DataField, TextTemplate } from '../domain/model'

export type AutocompleteKind = 'variable' | 'reference'

export interface AutocompleteState {
  kind: AutocompleteKind
  query: string
  from: number
  to: number
  left: number
  top: number
  manual?: boolean
}

export type AutocompleteItem =
  | { kind: 'variable'; field: DataField }
  | { kind: 'reference'; text: TextTemplate }
  | { kind: 'create-field'; label: string }

export function detectAutocomplete(editor: Editor): AutocompleteState | null {
  const { selection } = editor.state
  if (!selection.empty) return null

  const { $from } = selection
  if (!$from.parent.isTextblock) return null

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\0', '\0')
  const match = textBefore.match(/(?:^|\s)([$#])([^$#\n]*)$/)
  if (!match) return null

  const trigger = match[1]
  const rawQuery = match[2] ?? ''

  // Text references are block nodes, so # is only valid as the first
  // meaningful content in the current paragraph.
  if (trigger === '#') {
    const triggerIndex = textBefore.lastIndexOf('#')
    if (textBefore.slice(0, triggerIndex).trim().length > 0) return null
  }

  const from = selection.from - rawQuery.length - 1
  const coords = editor.view.coordsAtPos(from)

  return {
    kind: trigger === '$' ? 'variable' : 'reference',
    query: rawQuery.trimStart(),
    from,
    to: selection.from,
    left: coords.left,
    top: coords.bottom + 6,
  }
}

export function manualAutocomplete(editor: Editor, kind: AutocompleteKind): AutocompleteState {
  const { from, to } = editor.state.selection
  const coords = editor.view.coordsAtPos(from)

  return {
    kind,
    query: '',
    from,
    to,
    left: coords.left,
    top: coords.bottom + 6,
    manual: true,
  }
}

export function getAutocompleteItems(
  state: AutocompleteState,
  fields: DataField[],
  texts: TextTemplate[],
  selectedTextId: string,
): AutocompleteItem[] {
  const needle = state.query.trim().toLowerCase()

  if (state.kind === 'variable') {
    const matches = fields
      .filter((field) =>
        field.label.toLowerCase().includes(needle)
        || field.path.toLowerCase().includes(needle),
      )
      .slice(0, 8)
      .map((field): AutocompleteItem => ({ kind: 'variable', field }))

    matches.push({ kind: 'create-field', label: state.query.trim() })

    return matches
  }

  return texts
    .filter((text) => text.id !== selectedTextId)
    .filter((text) =>
      text.name.toLowerCase().includes(needle)
      || text.id.toLowerCase().includes(needle),
    )
    .slice(0, 8)
    .map((text): AutocompleteItem => ({ kind: 'reference', text }))
}
