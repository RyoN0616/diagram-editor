export default function asyncModal(dialog) {
  return new Promise((resolve, reject) => {
    dialog.executor = { resolve, reject }
    dialog.showModal()
  })
}
