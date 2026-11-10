import type { FieldRequirement, TextContract } from '../domain/model'

function setAtPath(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split('.')
  let cursor = target

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    if (isLast) {
      cursor[segment] = value
      return
    }

    const existing = cursor[segment]
    if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
      cursor[segment] = {}
    }
    cursor = cursor[segment] as Record<string, unknown>
  })
}

function exampleValue(requirement: FieldRequirement) {
  switch (requirement.field.type) {
    case 'boolean':
      return true
    case 'number':
      return 1200
    case 'date':
      return '2026-09-05'
    case 'string':
    default:
      if (requirement.field.path.toLowerCase().includes('name')) return 'Anna Andersson'
      return 'Example value'
  }
}

export function buildExamplePayload(contract: TextContract) {
  const result: Record<string, unknown> = {}

  for (const requirement of contract.requirements) {
    setAtPath(result, requirement.field.path, exampleValue(requirement))
  }

  // Make conditional examples activate their branches where possible.
  for (const requirement of contract.requirements) {
    for (const conditionPath of requirement.requiredWhen) {
      for (const condition of conditionPath) {
        setAtPath(result, condition.path, condition.expected)
      }
    }
  }

  return result
}
