import { h } from "hyperapp"
import Dialog from "./dialog.js"

export default ({ title }) => (
  <Dialog
    id="save-as-dialog"
    dialogResolved={e => {
      const { result: submitEvent } = e.detail
      const form = submitEvent.target
      const title = form.elements["title"].value

      return { title }
    }}
  >
    <fieldset>
      <legend>Save as</legend>
      <p>
        <input name="title" type="text" value={title} />
      </p>
      <p>
        <button type="submit">save</button>
      </p>
    </fieldset>
  </Dialog>
)
