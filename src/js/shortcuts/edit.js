import hotkeys from "hotkeys-js"

function initialize({ app }) {
  hotkeys("ctrl+z", "edit", () => {
    app.undo()
  })

  hotkeys("ctrl+y", "edit", () => {
    app.redo()
  })

  hotkeys("ctrl+v", "edit", () => {
    const editor = document.getElementById("graph-editor")

    if (document.activeElement != document.body) {
      // if any input is focused, this action is prevented
      return
    } else {
      // to prevent pasting to inputs, remove cursor
      window.getSelection().removeAllRanges()
    }

    editor.pasteNodes()
  })

  hotkeys("ctrl+c", "edit", () => {
    const editor = document.getElementById("graph-editor")

    const selected = editor.nodeLayer.selectedNodes

    if (selected.length > 0) {
      selected[0].cloneToClipboardSelected()
    }
  })

  hotkeys("ctrl+x", "edit", () => {
    const editor = document.getElementById("graph-editor")

    const selected = editor.nodeLayer.selectedNodes

    if (selected.length > 0) {
      selected[0].cloneToClipboardSelected()

      selected[0].destroySelected()
    }
  })
}

export default initialize
