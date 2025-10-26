# Family Tree Domain Rules v3 - Implementation Guide

This document provides comprehensive documentation for the v3 domain rules implementation, including validation logic, execution model, and usage examples.

## Overview

The v3 domain rules implement a simplified, hardened validation system with two levels:
1. **Hard Invariants** (Section 2) - Must never break, reject operations
2. **Warning-Level Checks** (Section 5) - Flag issues but allow save

All operations follow the atomic validation execution model (Section 7): clone → mutate → validate → commit.

## Core Validation System

### Hard Invariants (Section 2)

The system enforces five categories of hard invariants that must never be violated:

#### 2.1 Identity and Shape Invariants

**Purpose**: Ensure data integrity and uniqueness

**Rules**:
- All Person IDs must be unique and non-empty
- All Marriage IDs must be unique and non-empty  
- Person names must be at least 2 characters (trimmed)
- Person gender must be 'M' or 'F' only
- No self-marriage (husbandId !== wifeId)

**Implementation**: `validateIdentityAndShape()`

```typescript
// Example violations:
// - Duplicate person ID: "person-123"
// - Person person-123 name must be at least 2 characters
// - Person person-123 gender must be M or F
// - Self-marriage not allowed: marriage-456
```

#### 2.2 Gender and Marriage Validity

**Purpose**: Enforce gender-based marriage rules

**Rules**:
- Marriage must be between one male (M) and one female (F)
- Husband must have gender 'M'
- Wife must have gender 'F'

**Implementation**: `validateGenderAndMarriage()`

```typescript
// Example violations:
// - Husband person-123 must have gender M
// - Wife person-456 must have gender F
```

#### 2.3 Active Marriage Limits (Polygamy Rules)

**Purpose**: Enforce polygamy constraints

**Rules**:
- Husband can have at most 4 active marriages
- Wife can have at most 1 active marriage
- No duplicate active marriages between same two persons
- Historical marriages (divorced, widowed, terminated) don't count

**Implementation**: `validatePolygamyLimits()`

```typescript
// Example violations:
// - Husband person-123 has 5 active marriages (max 4)
// - Wife person-456 has 2 active marriages (max 1)
// - Duplicate active marriage between person-123 and person-456
```

#### 2.4 Parent Assignment Rules

**Purpose**: Ensure proper parent-child relationships

**Rules**:
- Each child can have exactly one ChildLink
- All ChildLink references must be valid
- Marriage must have two valid partners

**Implementation**: `validateParentAssignment()`

```typescript
// Example violations:
// - Child person-123 has 2 ChildLinks (max 1)
// - Child person-123 not found
// - Marriage marriage-456 not found
// - Marriage marriage-456 has invalid partners
```

#### 2.5 Ancestry and Cycle Rules

**Purpose**: Prevent invalid family relationships

**Rules**:
- No marriage between direct ancestors and descendants
- No cycles in parent-child relationships
- Maintain acyclic family tree structure

**Implementation**: `validateAncestryRules()`

```typescript
// Example violations:
// - Cannot marry direct ancestor or descendant: person-123 and person-456
// - Cycle detected: person-123 → person-456 → person-789 → person-123
```

### Warning-Level Checks (Section 5)

These checks flag data quality issues but don't block operations:

#### 5.1 Multiple Root Persons

**Trigger**: More than one person with `isRoot: true`
**Warning**: "Multiple root persons detected: 3"
**Action**: Allow save, surface for review

#### 5.2 Isolated Persons

**Trigger**: Person with no parents, no spouse, no children, not root
**Warning**: "2 isolated persons detected"
**Action**: Allow save, surface for cleanup

#### 5.3 Orphaned Children

**Trigger**: Children who become roots due to parent deletion
**Warning**: "3 children promoted to root"
**Action**: Allow save, surface for review

## Validation Execution Model (Section 7)

All operations follow the same atomic flow:

```typescript
// 1. Clone current Tree state
const clonedTree = structuredClone(currentTree)

// 2. Apply the proposed change to the clone
const mutatedTree = mutation(clonedTree)

// 3. Recalculate derived values (isRoot, statuses)
const treeWithDerivedValues = recalculateAllRoots(mutatedTree)

// 4. Run all Hard Invariants
const errors = validateHardInvariants(treeWithDerivedValues)

// 5. If any Hard Invariant fails, reject and return errors
if (errors.length > 0) {
  throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`)
}

// 6. If Hard Invariants pass, store the new Tree and surface any Warnings
const warnings = checkWarnings(treeWithDerivedValues)
```

## Usage Examples

### Creating a Person

```typescript
import { validateAndCommit } from './store/validationExecutor'

const resultData = validateAndCommit(
  currentTree,
  (tree) => {
    const newPerson: Person = {
      id: generateId(),
      name: 'John Doe',
      gender: 'M',
      isRoot: false // Will be recalculated
    }
    return {
      ...tree,
      persons: [...tree.persons, newPerson]
    }
  },
  (warnings) => {
    if (warnings.multipleRoots) {
      console.warn(`Multiple root persons detected: ${warnings.rootCount}`)
    }
  }
)
```

### Creating a Marriage

```typescript
const resultData = validateAndCommit(
  currentTree,
  (tree) => {
    const newMarriage: Marriage = {
      id: generateId(),
      husbandId: 'person-123',
      wifeId: 'person-456',
      status: 'active',
      marriageDate: null,
      divorceDate: null
    }
    return {
      ...tree,
      marriages: [...tree.marriages, newMarriage]
    }
  }
)
```

### Deleting a Person with Force Flags

```typescript
const resultData = validateAndCommit(
  currentTree,
  (tree) => {
    // Remove person
    const persons = tree.persons.filter(p => p.id !== personId)
    
    // Update marriage statuses
    const marriages = tree.marriages.map(marriage => {
      if (marriage.husbandId === personId || marriage.wifeId === personId) {
        const hasChildren = tree.children.some(c => c.marriageId === marriage.id)
        if (hasChildren && forceOrphan) {
          return { ...marriage, status: 'terminated' }
        }
        return { ...marriage, status: 'terminated' }
      }
      return marriage
    })
    
    return { ...tree, persons, marriages }
  },
  (warnings) => {
    if (warnings.orphanedChildren.length > 0) {
      console.warn(`${warnings.orphanedChildren.length} children promoted to root`)
    }
  }
)
```

## Error Handling

### Critical Errors (Block Operations)

```typescript
try {
  const result = validateAndCommit(currentTree, mutation)
} catch (error) {
  // Handle critical validation errors
  console.error('Operation rejected:', error.message)
  // Show user-friendly error message
}
```

### Warnings (Allow Operations)

```typescript
const result = validateAndCommit(
  currentTree,
  mutation,
  (warnings) => {
    // Handle warnings
    if (warnings.multipleRoots) {
      showWarning('Multiple family trees detected')
    }
    if (warnings.isolatedPersons.length > 0) {
      showWarning(`${warnings.isolatedPersons.length} isolated persons`)
    }
  }
)
```

## Migration from v2

The v3 system is backward compatible with v2 data:

- No schema changes required
- Existing validation is stricter or equal, never looser
- All v2 operations continue to work
- New validation provides better error messages

### Gradual Migration

1. **Phase 1**: Deploy v3 alongside v2 (feature flag)
2. **Phase 2**: Run both validations in parallel, log discrepancies
3. **Phase 3**: Switch to v3 validation once verified
4. **Phase 4**: Remove v2 validation code

## Testing

### Unit Tests

```typescript
describe('Section 2.1: Identity and Shape', () => {
  it('should reject duplicate person IDs', () => {
    const data = {
      persons: [
        { id: 'person-1', name: 'John', gender: 'M', isRoot: true },
        { id: 'person-1', name: 'Jane', gender: 'F', isRoot: true } // Duplicate ID
      ],
      marriages: [],
      children: []
    }
    
    const errors = validateIdentityAndShape(data)
    expect(errors).toContainEqual({
      field: 'person.id',
      message: 'Duplicate person ID: person-1'
    })
  })
})
```

### Integration Tests

```typescript
describe('Validation Execution Model', () => {
  it('should follow clone-mutate-validate-commit flow', () => {
    const result = executeValidation(
      currentTree,
      (tree) => ({ ...tree, persons: [...tree.persons, newPerson] })
    )
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
```

## Performance Considerations

- **Validation**: O(n) where n is the number of entities
- **Memory**: Uses structuredClone for safe mutations
- **Caching**: Validation results are not cached (always fresh)
- **Batching**: Multiple operations should be batched into single validation

## Best Practices

1. **Always use validateAndCommit** for operations that modify data
2. **Handle warnings appropriately** - log them, show to users
3. **Test edge cases** - empty trees, single persons, complex relationships
4. **Monitor performance** - large family trees may need optimization
5. **Document custom validation** - if extending the system

## Troubleshooting

### Common Issues

1. **"Validation failed" errors**: Check hard invariants, usually data integrity issues
2. **Performance issues**: Consider batching operations or optimizing large trees
3. **Warning spam**: Implement proper warning handling and user feedback
4. **Migration issues**: Ensure backward compatibility with existing data

### Debug Mode

```typescript
// Enable detailed validation logging
const result = executeValidation(currentTree, mutation)
console.log('Validation result:', result)
console.log('Errors:', result.errors)
console.log('Warnings:', result.warnings)
```

## Future Extensions

The v3 system is designed to be extensible:

1. **Custom validators**: Add new hard invariants by extending `validateHardInvariants`
2. **Custom warnings**: Add new warning types by extending `checkWarnings`
3. **Custom execution**: Override `validateAndCommit` for specialized flows
4. **Custom error handling**: Implement domain-specific error recovery

## Conclusion

The v3 domain rules provide a robust, maintainable validation system that ensures data integrity while providing flexibility for complex family tree scenarios. The atomic execution model guarantees consistency, and the two-level error system provides appropriate feedback for different types of issues.
