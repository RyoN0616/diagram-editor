import { h } from "hyperapp"
import Dialog from "./dialog.js"

export default () => (
  <Dialog
    id="import-dialog"
    dialogResolved={e => {
      const { executor, result: submitEvent } = e.detail
      const form = submitEvent.target
      const file = form.elements["file"].files[0]

      if (file == null) {
        executor.reject("no file selected")
      } else {
        executor.resolve({ file })
      }
    }}
  >
    <fieldset>
      <legend>Import</legend>
      <p>
        <input name="file" type="file" />
      </p>
      <p>
        <button typep="submit">import</button>
      </p>
    </fieldset>
  </Dialog>
)
