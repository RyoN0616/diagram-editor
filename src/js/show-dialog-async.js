export default async function showDialogAsync(id) {
  const dialog = document.getElementById(id)
  let submitf, cancelf

  const result = await new Promise((resolve, reject) => {
    dialog.executor = { resolve, reject }

    let submitf = e => resolve(e)
    let cancelf = _e => {
      const error = new Error(`dialog '${id}' canceled`)
      error.name = "DialogCancelError"
      reject(error)
    }

    dialog.addEventListener("submit", submitf)
    dialog.addEventListener("cancel", cancelf)

    dialog.showModal()
  }).finally(() => {
    dialog.removeEventListener("submit", submitf)
    dialog.removeEventListener("cancel", cancelf)
  })

  return await new Promise((resolve, reject) => {
    const dialogResolvedEvent = new CustomEvent("dialogresolved", {
      detail: { executor: { resolve, reject }, result },
    })

    dialog.dispatchEvent(dialogResolvedEvent)
  })
}
