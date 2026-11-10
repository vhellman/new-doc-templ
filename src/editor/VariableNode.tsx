import { Node } from '@tiptap/core'
export const VariableNode = Node.create({
  name: 'variable', group: 'inline', inline: true, atom: true, selectable: true,
  addAttributes() { return {
    fieldId: { default: null, parseHTML: element => element.getAttribute('field-id'), renderHTML: attrs => ({ 'field-id': attrs.fieldId }) },
    label: { default: null, parseHTML: element => element.getAttribute('data-label'), renderHTML: attrs => ({ 'data-label': attrs.label ?? 'Variable' }) },
  } },
  parseHTML() { return [{ tag: 'doc-variable' }] },
  renderHTML({ HTMLAttributes }) { return ['doc-variable', { ...HTMLAttributes, class: 'variable-chip', contenteditable: 'false' }] },
})
