# Family Tree PWA — Source of Truth (Draft v0.2)

## 1) Charter

**Purpose.** Privacy‑first family tree builder for regional relationship complexity. **Goals.** Offline‑first. Fast. Simple data model. Open source. **Non‑negotiables.** Privacy, fluid UX (RTL), open source. **Out of scope (MVP).** Accounts, server DB, real‑time collaboration, GEDCOM import, Drive sync.

## 2) Users & Jobs

**Primary user.** Family member documenting lineage with an elder. **Jobs.** Capture names quickly. Model polygamy, cousin marriages, remarriage. Visualize lineage. Export JSON.

## 3) Domain Model & Rules

**Entities.** Person, Marriage, ChildLink, Root (Person with no parents). **Cardinality.**

- Man: 0–4 active marriages.
- Woman: 0–1 active marriage.
- Child: exactly one ChildLink → one Marriage. **Integrity.**
- No duplicate Marriage between same two persons.
- Divorce/Death update status only.
- Siblings inferred from shared Marriage.
- Cousin marriages allowed; cycles supported.

## 4) Data Model (JSON v1)

```json
{
  "version": 1,
  "persons": [
    { "id": "p_…", "name": "…", "gender": "M|F|U", "isRoot": false }
  ],
  "marriages": [
    { "id": "m_…", "husbandId": "p_…", "wifeId": "p_…", "status": "active|divorced|widowed", "marriageDate": null, "divorceDate": null }
  ],
  "children": [
    { "childId": "p_…", "marriageId": "m_…" }
  ]
}
```

**IDs.** `crypto.randomUUID()`; fallback to base36 nanoid.\
**Indices (in‑memory).** personById, marriagesByHusband, childrenByMarriage.\
**Migrations.** Increment `version`; apply transforms on import.

## 5) Operations & Validation

**CreatePerson(name, gender).** Adds Person. If first person → `isRoot=true`. **CreateMarriage(husbandId, wifeId).** Validates: man ≤4 active, woman ≤1 active, no duplicate pair. **AddChild(marriageId, childId?).** If `childId` missing create Person(gender=U). Validates one ChildLink per child. **SetStatus(marriageId, status).** Mutates status only. **SetRoot(personId).** Makes exactly one root. **Delete guards.**

- Person with links → block or require cascade wizard.
- Marriage with children → block deletion.

Validation order on every mutation: shape → referential → rule set (polygamy, duplicates) → write.

## 6) UX Principles

**Modes.** Quick Entry, Canvas, Table.\
**Zero required metadata.** Name only during live capture.\
**Bottom‑up or top‑down.** App accepts both.\
**Marriage‑first children.** Adding a child always targets a specific Marriage.\
**Keyboard‑first.** Enter to confirm; shortcuts for Add Wife, Add Child, Jump to Eldest.\
**RTL/LTR.** Toggle at any time; Arabic names supported.

## 7) Navigation & Screens (TanStack Router)

`/` Welcome → start/import.\
`/tree` Canvas (React Flow) + inspector.\
`/person/:id` Focused person view.\
`/marriage/:id` Focused marriage view.\
`/import` File picker.\
`/settings` Privacy, RTL, export, advanced.

## 8) Canvas Behavior (React Flow)

**Nodes.** Person nodes; Marriage nodes (dot).\
**Edges.** Person→Marriage, Marriage→Child.\
**Layout.** Shallow topological layout from current focus; expand on demand.\
**Selection.** Click person → inspector with marriages and children. Click marriage → children list + actions.\
**Zoom/Pan.** Smooth. FitView on load.\
**Large trees.** Virtualize subtrees; collapse branches.

## 9) Quick Entry Flow

- If no root: first name creates male root (editable).
- If marriage selected: new child (gender U).
- If man selected: quick add wife.
- Else: prompt to select a marriage for child creation.
- Autosave each keystroke (debounced 300 ms).

## 10) Storage, Privacy, Offline

**Local‑first.** `localStorage` + manual export `.json`.\
**No server by default.** App works fully offline.\
**PWA.** Service Worker + App Shell cache (workbox).\
**Optional future.** Encrypted file export (password‑based), Drive picker.

## 11) Performance Targets

Time‑to‑interactive ≤ 1s on mid device.\
Bundle ≤ 250 KB gzip (MVP).\
Operations O(1) pointer lookups via maps.\
React Flow nodes on screen ≤ 500; beyond that, subtree collapsing.

## 12) Accessibility & i18n

WCAG 2.2 AA. Focus order, roles, labels.\
Keyboard shortcuts documented.\
Arabic/English UI copy.\
BiDi input safe.

## 13) Tech Stack

React 18+, TanStack Router, React Flow, Tailwind, shadcn/ui.\
State: local reducers or Zustand.\
Build: Vite.\
Tests: Vitest + Playwright.\
Formatting: Prettier, ESLint.

## 14) File Format & Interop

Single JSON file as above.\
Future: GEDCOM import/export adapter.\
Versioned schema with migration map.

## 15) Errors & Messaging

Non‑blocking toasts for validation errors.\
Inline hints when an action needs a selected marriage.\
Undo/redo stack (20 steps) optional in v0.3.

## 16) Security

No network by default.\
No analytics.\
CSP: default‑src 'self'.\
Crypto APIs used only client‑side.

## 17) Roadmap

**v0.2 (this draft).** Quick Entry, Canvas, JSON import/export, RTL, validators.\
**v0.3.** Collapsible subtrees, undo/redo, encrypted export.\
**v0.4.** GEDCOM import/export, Drive sync, merge duplicates.

## 18) Glossary

**Person.** Individual node.\
**Marriage.** Husband‑wife relation.\
**ChildLink.** Edge Marriage→Child.\
**Root.** Person without parents.\
**Active marriage.** Status=active.

## 19) Acceptance Criteria (MVP v0.2)

- Create root, add ≥2 wives, add children to each.
- Prevent 5th active wife.
- Prevent two marriages with same pair.
- Child belongs to exactly one marriage.
- Canvas renders and navigates without errors offline.
- JSON export/import preserves IDs and statuses.

