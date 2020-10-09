import showDialogAsync from "./show-dialog-async.js"

export default async function promptSaveAs() {
  const { title } = await showDialogAsync("save-as-dialog")
  return title
}
