export type FieldType = 'string' | 'number' | 'date' | 'boolean'
export interface DataField {
  id: string
  teamId: string
  path: string
  label: string
  type: FieldType
  description?: string
}
export interface TextTemplate {
  id: string
  teamId: string
  name: string
  /** Canonical authored HTML. Domain nodes reference stable IDs only. */
  html: string
}
export interface Condition {
  fieldId: string
  path: string
  label: string
  expected: boolean
}
export interface FieldRequirement {
  field: DataField
  /** Each entry is an AND-condition path. [] means always required. */
  requiredWhen: Condition[][]
}
export interface TextContract {
  textId: string
  requirements: FieldRequirement[]
  referencedTextIds: string[]
  errors: string[]
}
