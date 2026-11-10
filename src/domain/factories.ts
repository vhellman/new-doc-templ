import type { DataField, TextTemplate } from './model'
import { TEAM_ID } from './seed'

export const createEmptyTextDocument = () => '<p></p>'

export function createDataField(label: string, fields: DataField[]): DataField {
  return {
    id: `field-${crypto.randomUUID()}`,
    teamId: TEAM_ID,
    label,
    path: generateFieldPath(label, fields),
    type: 'string',
    description: '',
  }
}

export function createTextTemplate(name: string, texts: TextTemplate[]): TextTemplate {
  return {
    id: generateTextId(name, texts),
    teamId: TEAM_ID,
    name,
    html: createEmptyTextDocument(),
  }
}

function generateFieldPath(label: string, fields: DataField[]) {
  const base = `custom.${toCamelCase(label)}`
  const existingPaths = new Set(fields.map((field) => field.path))

  if (!existingPaths.has(base)) return base

  let suffix = 2
  while (existingPaths.has(`${base}${suffix}`)) suffix += 1
  return `${base}${suffix}`
}

function generateTextId(name: string, texts: TextTemplate[]) {
  const base = slugify(name)
  const existingIds = new Set(texts.map((text) => text.id))

  if (!existingIds.has(base)) return base

  let suffix = 2
  while (existingIds.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

function toCamelCase(value: string) {
  const words = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return 'value'

  const [first, ...rest] = words
  return first.toLowerCase()
    + rest
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'untitled-text'
}
