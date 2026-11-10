import type { DataField, TextTemplate } from '../domain/model'

const ordinary = new Set(['p','h1','h2','h3','h4','h5','h6','strong','em','s','code','blockquote','ul','ol','li','br'])
export function parseFragment(html: string): HTMLElement {
  return new DOMParser().parseFromString(`<main>${html}</main>`, 'text/html').querySelector('main')!
}

/** Only this tiny HTML dialect is persisted. Editor presentation attributes are removed. */
export function canonicalizeHtml(html: string): string {
  const root = parseFragment(html)
  const output = document.createElement('main')
  function copy(node: Node, parent: Node) {
    if (node.nodeType === Node.TEXT_NODE) { parent.appendChild(document.createTextNode(node.textContent ?? '')); return }
    if (!(node instanceof Element)) return
    const tag = node.tagName.toLowerCase()
    if (tag === 'doc-variable') {
      const id = node.getAttribute('field-id')
      if (id) { const el = document.createElement(tag); el.setAttribute('field-id', id); parent.appendChild(el) }
      return
    }
    if (tag === 'doc-text-ref') {
      const id = node.getAttribute('text-id')
      if (id) {
        const el = document.createElement(tag); el.setAttribute('text-id', id)
        const condition = node.getAttribute('condition-field-id')
        if (condition) { el.setAttribute('condition-field-id', condition); el.setAttribute('expected-value', String(node.getAttribute('expected-value') !== 'false')) }
        parent.appendChild(el)
      }
      return
    }
    const destination = ordinary.has(tag) ? document.createElement(tag) : parent
    if (destination !== parent) parent.appendChild(destination)
    node.childNodes.forEach(child => copy(child, destination))
  }
  root.childNodes.forEach(child => copy(child, output))
  return output.innerHTML || '<p></p>'
}

/** Labels are editor hints; the catalogue is their source of truth. */
export function toEditorHtml(html: string, fields: DataField[], texts: TextTemplate[]): string {
  const root = parseFragment(html)
  root.querySelectorAll('doc-variable').forEach(node => {
    const field = fields.find(item => item.id === node.getAttribute('field-id'))
    node.setAttribute('data-label', field?.label ?? 'Unknown variable')
  })
  root.querySelectorAll('doc-text-ref').forEach(node => {
    const text = texts.find(item => item.id === node.getAttribute('text-id'))
    const condition = fields.find(item => item.id === node.getAttribute('condition-field-id'))
    node.setAttribute('data-label', text?.name ?? 'Missing shared text')
    if (condition) node.setAttribute('data-condition-label', condition.label)
  })
  return root.innerHTML
}
