import { h } from "hyperapp"
import dialogPolyfill from "dialog-polyfill"

export default ({ id, dialogResolved }, children) => (
  <dialog
    id={id}
    oncreate={dialogPolyfill.registerDialog}
    ondialogresolved={async e => {
      const result = dialogResolved ? await dialogResolved(e) : e.detail.result

      e.detail.executor.resolve(result)
    }}
  >
    <form method="dialog">{children}</form>
  </dialog>
)
