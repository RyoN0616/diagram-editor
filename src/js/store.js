import { openDB, deleteDB } from "idb"

const dbName = "DiagramEditorData"
const version = 1

function upgrade(db, oldVer, newVer, _transaction) {
  // schema
  // | title: String | data: Objecgt | createdAt: Date | updatedAt: Date |
  console.log(`update running ${oldVer} to ${newVer}`)
  const saveData = db.createObjectStore("saveData", { keyPath: "title" })
  saveData.createIndex("updatedAt", "updatedAt", { unique: false })
}

export async function open() {
  console.log("currently, the DB is reseted per reload")
  await deleteDB(dbName)
  const db = await openDB(dbName, version, { upgrade })
  return db
}
