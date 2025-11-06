import { openDB, type IDBPDatabase } from 'idb'
import type { TreeNode, TreeEdge } from '../types'

const DB_NAME = 'sidr-family-tree'
const DB_VERSION = 1
const STORE_TREES = 'trees'
const STORE_NODES = 'nodes'
const STORE_EDGES = 'edges'

let dbInstance: IDBPDatabase | null = null

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_TREES)) {
        db.createObjectStore(STORE_TREES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_NODES)) {
        db.createObjectStore(STORE_NODES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_EDGES)) {
        db.createObjectStore(STORE_EDGES, { keyPath: 'id' })
      }
    }
  })

  return dbInstance
}

export async function saveTree(nodes: TreeNode[], edges: TreeEdge[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([STORE_NODES, STORE_EDGES], 'readwrite')

  // Clear existing data
  await tx.objectStore(STORE_NODES).clear()
  await tx.objectStore(STORE_EDGES).clear()

  // Save nodes
  for (const node of nodes) {
    await tx.objectStore(STORE_NODES).put(node)
  }

  // Save edges
  for (const edge of edges) {
    await tx.objectStore(STORE_EDGES).put(edge)
  }

  // Update tree metadata
  const treeMeta = {
    id: 'current',
    updatedAt: Date.now(),
    nodeCount: nodes.length,
    edgeCount: edges.length
  }
  const metaTx = db.transaction(STORE_TREES, 'readwrite')
  await metaTx.objectStore(STORE_TREES).put(treeMeta)

  await tx.done
  await metaTx.done
}

export async function loadTree(): Promise<{ nodes: TreeNode[]; edges: TreeEdge[] } | null> {
  const db = await getDB()
  const tx = db.transaction([STORE_NODES, STORE_EDGES], 'readonly')

  const nodes = await tx.objectStore(STORE_NODES).getAll()
  const edges = await tx.objectStore(STORE_EDGES).getAll()

  await tx.done

  if (nodes.length === 0 && edges.length === 0) return null

  return { nodes, edges }
}

export async function clearTree(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([STORE_NODES, STORE_EDGES, STORE_TREES], 'readwrite')
  await tx.objectStore(STORE_NODES).clear()
  await tx.objectStore(STORE_EDGES).clear()
  await tx.objectStore(STORE_TREES).clear()
  await tx.done
}

