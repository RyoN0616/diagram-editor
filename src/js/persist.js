navigator.storage.persist(granted => {
  if (granted) {
    console.log("the storage are persisted")
  } else {
    alert(
      "Save-data will be removed when few storage are remaining. Please export your important data."
    )
  }
})
