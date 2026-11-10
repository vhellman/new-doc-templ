import { Node } from '@tiptap/core'
export const TextReferenceNode = Node.create({
  name: 'textReference', group: 'block', atom: true, selectable: true,
  addAttributes() { return {
    textId: { default: null, parseHTML: element => element.getAttribute('text-id'), renderHTML: attrs => ({ 'text-id': attrs.textId }) },
    label: { default: null, parseHTML: element => element.getAttribute('data-label'), renderHTML: attrs => ({ 'data-label': attrs.label ?? 'Shared text' }) },
    conditionFieldId: { default: null, parseHTML: element => element.getAttribute('condition-field-id'), renderHTML: attrs => attrs.conditionFieldId ? ({ 'condition-field-id': attrs.conditionFieldId }) : {} },
    conditionLabel: { default: null, parseHTML: element => element.getAttribute('data-condition-label'), renderHTML: attrs => attrs.conditionLabel ? ({ 'data-condition-label': attrs.conditionLabel }) : {} },
    conditionExpected: { default: true, parseHTML: element => element.getAttribute('expected-value') !== 'false', renderHTML: attrs => attrs.conditionFieldId ? ({ 'expected-value': String(attrs.conditionExpected) }) : {} },
  } },
  parseHTML() { return [{ tag: 'doc-text-ref' }] },
  renderHTML({ HTMLAttributes }) { return ['doc-text-ref', { ...HTMLAttributes, class: 'reference-node', contenteditable: 'false' }] },
})
