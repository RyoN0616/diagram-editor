import { h } from "hyperapp"
import Dialog from "./dialog.js"

export default ({ saveData }) => (
  <Dialog
    id="load-dialog"
    dialogResolved={e => {
      const dialog = e.target
      const title = dialog.returnValue

      return { title }
    }}
  >
    <fieldset>
      <legend>Load</legend>
      <table class="pure-table">
        <thead>
          <tr>
            <th>title</th>
            <th>last_modified</th>
          </tr>
        </thead>
        <tbody>
          {mapHelper(saveData, record => (
            <tr key={record.title}>
              <td>{record.title}</td>
              <td>{record.updatedAt.toLocaleString()}</td>
              <td>
                <button
                  type="submit"
                  name="loading-record"
                  value={record.title}
                >
                  load
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <input type="hidden" />
    </fieldset>
  </Dialog>
)

function mapHelper(array, f) {
  if (array == null || array.length == 0) {
    return null
  } else {
    return array.map(f)
  }
}
