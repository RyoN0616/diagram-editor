import { h } from "hyperapp"
import Dialog from "./dialog.js"

export default ({ title }) => (
  <Dialog
    id="export-dialog"
    dialogResolved={e => {
      const { result: submitEvent } = e.detail
      const form = submitEvent.target
      const filename = form.elements["filename"].value + ".kampo.json"

      return { filename }
    }}
  >
    <fieldset>
      <legend>Export</legend>
      <p>
        <input type="text" name="filename" value={title} />
      </p>
      <p>
        <button type="submit">download</button>
      </p>
    </fieldset>
  </Dialog>
)
