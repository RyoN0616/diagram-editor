import { h, app } from "hyperapp"
import hotkeys from "hotkeys-js"

import initShortcuts from "./shortcuts/shortcuts.js"

import "./persist.js"
import { open } from "./store.js"
import promptSaveAs from "./prompt-save-as.js"

import "./webcomponents/graph-editor.js"
import "./webcomponents/graph-node-list.js"
import "./webcomponents/graph-node.js"
import "./webcomponents/graph-content-note.js"
import "./webcomponents/graph-content-pattern.js"
import "./webcomponents/graph-link-list.js"
import "./webcomponents/graph-link.js"
import "./webcomponents/graph-contextmenu-item.js"
import "./webcomponents/graph-contextmenu.js"

import Menu from "./hyperapp/menu/menu.js"

import ImportDialog from "./hyperapp/dialogs/import-dialog.js"
import ExportDialog from "./hyperapp/dialogs/export-dialog.js"
import SaveAsDialog from "./hyperapp/dialogs/save-as-dialog.js"
import LoadDialog from "./hyperapp/dialogs/load-dialog.js"

const view = (s, a) => (
  <div class="content" key="main-view">
    <div class="editor-container">
      <graph-editor id="graph-editor" oncommand={commandHandler(s, a)}>
        <graph-node-list slot="node-layer" />
        <graph-link-list slot="link-layer" />
      </graph-editor>

      <div style="position: absolute; right: 0; bottom: 0;">
        <button onclick={() => a.undo()} disabled={s.commands.length == 0}>
          {"<"}
        </button>
        <button onclick={() => a.redo()} disabled={s.next.length == 0}>
          {">"}
        </button>
      </div>
    </div>

    <Menu />

    <LoadDialog saveData={s.saveData} />
    <ImportDialog />
    <SaveAsDialog title={s.title} />
    <ExportDialog title={s.title} />
  </div>
)

function commandHandler(_s, a) {
  return function({ detail: { command } }) {
    a.addCommand(command)
  }
}

const state = {
  commands: [],
  next: [],
  db: null,
  title: null,
  saveData: null,
  menuPath: [],
}

const actions = {
  addCommand: command => ({ commands }) => {
    command.up()

    return {
      commands: [...commands, command],
      next: [],
    }
  },

  redo: () => ({ commands, next }) => {
    if (next.length == 0) {
      return
    }

    const redoStack = [...next]
    const command = redoStack.pop()
    command.up()
    return {
      commands: [...commands, command],
      next: redoStack,
    }
  },

  undo: () => ({ commands, next }) => {
    if (commands.length == 0) {
      return
    }

    const undoStack = [...commands]
    const command = undoStack.pop()
    command.down()
    return {
      commands: undoStack,
      next: [...next, command],
    }
  },

  export: ({ name }) => {
    const json = document.getElementById("graph-editor").serialize()
    const a = document.createElement("a")
    a.download = name
    a.href = URL.createObjectURL(new Blob([json]))

    // for firefox
    document.body.append(a)

    a.click()

    a.remove()
  },

  import: ({ json }) => (_state, actions) => {
    const data = JSON.parse(json)
    actions.load({ data })
  },

  load: ({ data }) => (state, actions) => {
    const newEditor = document.createElement(data.name)
    newEditor.init(data.resources)

    const editor = document.getElementById("graph-editor")
    newEditor.id = editor.id
    newEditor.addEventListener("command", commandHandler(state, actions))
    editor.replaceWith(newEditor)

    return { commands: [], next: [] }
  },

  setDb: ({ db }) => ({ db }),

  setTitle: ({ title }) => ({ title }),

  save: ({ data }) => ({ title, db }) => {
    const task = (async () => {
      await db.put("saveData", {
        title: title || (await promptSaveAs()),
        data,
        updatedAt: new Date(),
      })
    })()
    return task
  },

  saveData: ({ saveData }) => ({ saveData }),

  setMenuPath: ({ menuPath }) => ({ menuPath }),

  closeMenu: () => ({ menuPath: [] }),
}

const application = app(state, actions, view, document.body)

open().then(db => application.setDb({ db }))

initShortcuts({ app: application })

hotkeys.setScope("edit")
