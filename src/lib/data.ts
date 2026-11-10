export function getAtPath(data: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[segment]
  }, data)
}

export function setAtPath(source: Record<string, unknown>, path: string, value: unknown) {
  const result = structuredClone(source)
  const segments = path.split('.')
  let cursor: Record<string, unknown> = result

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = value
      return
    }
    const existing = cursor[segment]
    if (!existing || typeof existing !== 'object' || Array.isArray(existing)) cursor[segment] = {}
    cursor = cursor[segment] as Record<string, unknown>
  })

  return result
}
