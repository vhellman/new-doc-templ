export type InspectorTab = 'properties' | 'integration'

export type SelectedDocumentNode =
  | { kind: 'variable'; pos: number; attrs: Record<string, unknown> }
  | { kind: 'reference'; pos: number; attrs: Record<string, unknown> }
