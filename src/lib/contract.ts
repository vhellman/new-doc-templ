import type { Condition, DataField, FieldRequirement, TextContract, TextTemplate } from '../domain/model'
import { parseFragment } from './html'

const conditionKey = (path: Condition[]) => path.map(c => `${c.fieldId}=${c.expected}`).sort().join('&')
export function analyzeText(rootTextId: string, texts: TextTemplate[], fields: DataField[]): TextContract {
  const textMap = new Map(texts.map(t => [t.id, t]))
  const fieldMap = new Map(fields.map(f => [f.id, f]))
  const requirements = new Map<string, FieldRequirement>()
  const references = new Set<string>()
  const errors = new Set<string>()
  const paths = new Set<string>()
  for (const field of fields) {
    if (paths.has(field.path)) errors.add(`Duplicate data path: ${field.path}`)
    paths.add(field.path)
    if (!/^[A-Za-z][\w]*(\.[A-Za-z][\w]*)+$/.test(field.path)) errors.add(`Invalid data path: ${field.path}`)
  }
  function requireField(id: string | null, conditions: Condition[]) {
    const field = id ? fieldMap.get(id) : undefined
    if (!field) { errors.add(`Unknown data field: ${id || '(missing field-id)'}`); return undefined }
    const existing = requirements.get(id!) ?? { field, requiredWhen: [] }
    if (!existing.requiredWhen.some(path => conditionKey(path) === conditionKey(conditions))) existing.requiredWhen.push(conditions)
    requirements.set(id!, existing)
    return field
  }
  function walkText(id: string, conditions: Condition[], stack: string[]) {
    const text = textMap.get(id)
    if (!text) { errors.add(`Referenced text does not exist: ${id}`); return }
    if (stack.includes(id)) { errors.add(`Circular text reference: ${[...stack, id].join(' → ')}`); return }
    const root = parseFragment(text.html)
    function walk(node: Node, when: Condition[]) {
      if (!(node instanceof Element)) return
      if (node.localName === 'doc-variable') {
        requireField(node.getAttribute('field-id'), when)
        return
      }
      if (node.localName === 'doc-text-ref') {
        const target = node.getAttribute('text-id')
        if (!target) { errors.add('A text reference is missing text-id.'); return }
        references.add(target)
        const conditionId = node.getAttribute('condition-field-id')
        let next = when
        if (conditionId) {
          const field = requireField(conditionId, when)
          if (!field) return
          if (field.type !== 'boolean') { errors.add(`Conditional field "${field.path}" must be boolean.`); return }
          const expectedValue = node.getAttribute('expected-value')
          if (expectedValue !== 'true' && expectedValue !== 'false') { errors.add(`Invalid expected value on reference to ${target}.`); return }
          const expected = expectedValue === 'true'
          if (when.some(c => c.fieldId === field.id && c.expected !== expected)) return
          next = [...when, { fieldId: field.id, path: field.path, label: field.label, expected }]
        }
        walkText(target, next, [...stack, id])
        return
      }
      node.childNodes.forEach(child => walk(child, when))
    }
    root.childNodes.forEach(child => walk(child, conditions))
  }
  if (!textMap.has(rootTextId)) errors.add(`Text does not exist: ${rootTextId}`)
  else walkText(rootTextId, [], [])
  return { textId: rootTextId, requirements: [...requirements.values()].sort((a,b) => a.field.path.localeCompare(b.field.path)), referencedTextIds: [...references], errors: [...errors] }
}
export const isAlwaysRequired = (requirement: FieldRequirement) => requirement.requiredWhen.some(path => path.length === 0)
export function toDeveloperContract(contract: TextContract) {
  return { textId: contract.textId, fields: contract.requirements.map(requirement => ({
    path: requirement.field.path, type: requirement.field.type, required: isAlwaysRequired(requirement),
    ...(isAlwaysRequired(requirement) ? {} : { requiredWhen: requirement.requiredWhen.map(path => path.map(c => ({ path: c.path, equals: c.expected }))) }),
  })) }
}
