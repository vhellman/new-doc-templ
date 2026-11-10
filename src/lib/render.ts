import type { DataField, TextTemplate } from '../domain/model'
import { getAtPath } from './data'
import { parseFragment } from './html'

const ordinary = new Set(['p','h1','h2','h3','h4','h5','h6','strong','em','s','code','blockquote','ul','ol','li','br'])
export function renderText(rootTextId: string, texts: TextTemplate[], fields: DataField[], data: unknown): string {
  const textMap = new Map(texts.map(t => [t.id, t]))
  const fieldMap = new Map(fields.map(f => [f.id, f]))
  const output = document.createElement('main')
  function error(message: string, parent: Node) {
    const el = document.createElement('span'); el.className = 'render-error'; el.textContent = `[${message}]`; parent.appendChild(el)
  }
  function renderNode(node: Node, parent: Node, stack: string[]) {
    if (node.nodeType === Node.TEXT_NODE) { parent.appendChild(document.createTextNode(node.textContent ?? '')); return }
    if (!(node instanceof Element)) return
    if (node.localName === 'doc-variable') {
      const field = fieldMap.get(node.getAttribute('field-id') ?? '')
      if (!field) { error('Unknown variable', parent); return }
      const value = getAtPath(data, field.path)
      if (value === undefined || value === null || value === '') { error(`Missing ${field.path}`, parent); return }
      parent.appendChild(document.createTextNode(String(value)))
      return
    }
    if (node.localName === 'doc-text-ref') {
      const conditionId = node.getAttribute('condition-field-id')
      if (conditionId) {
        const condition = fieldMap.get(conditionId)
        if (!condition) { error('Unknown condition', parent); return }
        const expected = node.getAttribute('expected-value') === 'true'
        if (getAtPath(data, condition.path) !== expected) return
      }
      renderById(node.getAttribute('text-id') ?? '', parent, stack)
      return
    }
    const destination = ordinary.has(node.localName) ? document.createElement(node.localName) : parent
    if (destination !== parent) parent.appendChild(destination)
    node.childNodes.forEach(child => renderNode(child, destination, stack))
  }
  function renderById(id: string, parent: Node, stack: string[]) {
    if (stack.includes(id)) { error('Circular text reference', parent); return }
    const text = textMap.get(id)
    if (!text) { error(`Missing text: ${id}`, parent); return }
    const fragment = parseFragment(text.html)
    fragment.childNodes.forEach(child => renderNode(child, parent, [...stack, id]))
  }
  renderById(rootTextId, output, [])
  return output.innerHTML
}
