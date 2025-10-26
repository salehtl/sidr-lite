# Family Tree Domain Rules v3 (Core Logic)

This version keeps only the hard logic the system must enforce. Everything else is secondary.

---

## 1. Data Objects

### 1.1 Person

* `id: string`

  * Required
  * Unique in the tree
  * Immutable
* `name: string`

  * Required
  * Trimmed length ≥ 2
* `gender: 'M' | 'F'`

  * Required
  * No other values allowed
* `isRoot: boolean`

  * Derived
  * `true` if this person is **not** listed as a `childId` in any ChildLink
  * `false` otherwise
  * Cannot be manually set

### 1.2 Marriage

* `id: string`

  * Required
  * Unique in the tree
  * Immutable
* `husbandId: string | null`

  * Must point to an existing Person with `gender = 'M'` if not null
  * Can be null for incomplete parent marriages (single-parent families)
* `wifeId: string | null`

  * Must point to an existing Person with `gender = 'F'` if not null
  * Can be null for incomplete parent marriages (single-parent families)
* `status: 'active' | 'divorced' | 'widowed' | 'terminated'`

  * Defaults to `active`
* `marriageDate: string | null`

  * ISO date or null
* `divorceDate: string | null`

  * ISO date or null

### 1.3 ChildLink

* `childId: string`

  * Must point to an existing Person
* `marriageId: string`

  * Must point to an existing Marriage

Meaning:

* A ChildLink says: "This child came from this marriage"
* This implies two biological parents: the marriage's husband and wife

### 1.4 Incomplete Parent Marriages

A marriage can have incomplete parent information:

* **Complete Marriage**: Both `husbandId` and `wifeId` are non-null
* **Incomplete Marriage**: Either `husbandId` or `wifeId` is null (but not both)
* **Invalid Marriage**: Both `husbandId` and `wifeId` are null (not allowed)

**Rules for Incomplete Marriages:**

1. **Single Parent Families**: Incomplete marriages are allowed when only one parent is known
2. **Child Assignment**: Children can be assigned to incomplete marriages
3. **Completion**: Incomplete marriages can be completed by adding the missing parent
4. **Validation**: Incomplete marriages with children are valid and functional

**Use Cases:**
- Single-parent families (divorced, widowed, or unknown other parent)
- Step-families where only one biological parent is known
- Adoption scenarios where only one biological parent is known

### 1.5 Tree Container

* `version: number`
* `persons: Person[]`
* `marriages: Marriage[]`
* `children: ChildLink[]`

The Tree is always validated as a whole snapshot.

---

## 2. Hard Invariants (must never break)

### 2.1 Identity and Shape

1. All IDs are present and unique (Person.id, Marriage.id)
2. Required fields are present and of correct type
3. No self-marriage (`husbandId !== wifeId`)

If any of these fail the operation is rejected.

### 2.2 Gender and Marriage Validity

1. **Complete Marriages**: Must be between exactly one male (`husbandId`) and one female (`wifeId`)
2. **Incomplete Marriages**: Can have either `husbandId` or `wifeId` as null (but not both)
3. **Gender Validation**: When both spouses are present, they must have different genders
4. **Same-gender marriages**: Not allowed for complete marriages
5. **Missing-gender or unknown-gender**: Not allowed

### 2.3 Active Marriage Limits (polygamy rules)

For `status = 'active'` only:

1. **Complete Marriages Only**: Polygamy limits apply only to complete marriages (both spouses present)
2. **Male Limit**: A male can be `husbandId` in at most 4 active complete marriages at the same time
3. **Female Limit**: A female can be `wifeId` in at most 1 active complete marriage at the same time
4. **Incomplete Marriages**: Do not count toward polygamy limits
5. **Past Marriages**: Marriages with `status = 'divorced' | 'widowed' | 'terminated'` do not count toward these limits
6. **Duplicate Prevention**: You cannot create a second `active` marriage record between the same exact two people

If any limit is exceeded the operation is rejected.

### 2.4 Parent Assignment Rules

1. Each child can have **exactly one** ChildLink in the tree

   * A Person cannot appear as `childId` in two different ChildLinks
2. **Complete Marriages**: The `marriageId` must point to a Marriage with two valid partners (one male and one female)
3. **Incomplete Marriages**: The `marriageId` can point to a Marriage with only one valid partner (single-parent families)
4. **Partner Validation**: A ChildLink cannot reference a Marriage whose existing partners do not exist
5. **Null Partner Validation**: Incomplete marriages are valid for child assignment

If any of these fail the operation is rejected.

### 2.5 Ancestry and Cycle Rules

1. No parent/child cycles

   * A person cannot become (directly or indirectly) their own ancestor or descendant
   * Before adding a ChildLink, verify that the child is not already an ancestor of either parent
2. No ancestor-descendant marriage

   * You cannot marry a person to their direct ancestor or direct descendant (parent, grandparent, child, grandchild, etc.)

If any of these fail the operation is rejected.

### 2.6 Root Logic

1. `isRoot` is computed, not edited
2. A person is root if they have zero ChildLinks pointing to them as `childId`
3. There can be more than one root person, but see Warnings section

### 2.7 Deletion Safety

Deletion of a Person triggers impact analysis.

1. Orphan rule:

   * You cannot delete a person if that deletion would leave a child with zero recorded parents unless a `forceOrphan = true` flag is passed
   * If allowed, that child becomes a new root (`isRoot = true`)

2. Root rule:

   * You cannot delete a root person unless `forceRootDelete = true`

3. Marriage history rule:

   * Marriages that have children are never hard-deleted
   * Instead their status may update to `widowed` or `terminated`

If a required force flag is missing the operation is rejected.

---

## 3. Marriage Status Lifecycle

`status` is one of:

* `active`
* `divorced`
* `widowed`
* `terminated`

Allowed transitions on an existing Marriage record:

1. `active` → `divorced` (may set `divorceDate`)
2. `active` → `widowed`
3. `active` → `terminated`

Not allowed:

* Changing a non-`active` marriage back to `active`
* Editing history in a way that hides children

New marriages after divorce or widowhood are always new Marriage rows, never "reactivate" of an old row.

---

## 4. Operations (what the system must check)

### 4.1 Create Person

* Check `id`, `name`, `gender`
* Do not allow `gender` other than `M` or `F`
* Compute `isRoot` after all links are considered

### 4.2 Update Person

* `name` and `gender` can change
* `id` cannot change
* Recompute `isRoot`

### 4.3 Delete Person

* Run Deletion Safety (Section 2.7)
* Mark related marriages as `widowed` or `terminated` if needed
* Promote affected children to root if allowed

### 4.4 Create Marriage

* **Complete Marriage**: Check gender roles and polygamy limits (Section 2.2 and 2.3)
* **Incomplete Marriage**: Allow creation with one null spouse for single-parent families
* Check no ancestor-descendant violation (only for complete marriages)
* Set `status = 'active'`

### 4.5 Update Marriage Status

* Check allowed status transitions (Section 3)
* Past marriages remain in the tree for history

### 4.6 Add Child (Create ChildLink)

* Ensure the child person exists or is created now
* Ensure the marriage exists and is valid
* Ensure the child does not already have a ChildLink
* Ensure no ancestry cycle will be created
* After link is added the child is no longer root

### 4.7 Remove Child (Delete ChildLink)

* Remove the ChildLink
* Recompute `isRoot` for that child (they may become root)

### 4.8 Complete Parent Marriage

* **Purpose**: Add a second parent to an incomplete marriage
* **Validation**: Check gender compatibility (must be different from existing parent)
* **Polygamy**: Check if the new parent can be added without exceeding limits
* **Ancestry**: Check no ancestor-descendant violation
* **Result**: Marriage becomes complete with both spouses

### 4.9 Add Parent to Orphaned Child

* **Purpose**: Add a first parent to a child with no parents
* **Process**: Create incomplete marriage with the new parent
* **Validation**: Check gender and ancestry rules
* **Result**: Child is linked to incomplete marriage

### 4.10 Add Sibling

* **Purpose**: Add a sibling to an existing child
* **Process**: Add new child to the same parent marriage
* **Validation**: Check parent marriage is active and can accept more children
* **Result**: New sibling shares the same parents

---

## 5. Warning-Level Checks (allowed but flagged)

These do not block save. They surface data quality issues.

1. Multiple root persons detected in the same tree
2. A non-root person with no parents, no spouse, and no children (isolated node)
3. A child became root because a parent was deleted (forced orphan)
4. A marriage was auto-marked `widowed` or `terminated` during a deletion cascade

The record is still stored. The system just reports these cases for review.

---

## 6. Scope Limits (v3)

Current version does not model:

1. Same-sex marriage
2. Unknown/other gender values
3. Adoption or step-parenting
4. More than two biological parents per child
5. Time-based snapshots or historical timelines
6. Distinguishing "dead" vs "deleted" beyond `widowed` state

If any of these are needed they require a future version.

---

## 7. Validation Execution Model

All changes follow the same flow:

1. Clone current Tree state
2. Apply the proposed change to the clone
3. Recalculate derived values (`isRoot`, statuses)
4. Run all Hard Invariants
5. If any Hard Invariant fails, reject and return errors
6. If Hard Invariants pass, store the new Tree and surface any Warnings

This guarantees atomic updates and prevents partial invalid states.
