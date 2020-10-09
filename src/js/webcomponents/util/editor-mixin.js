function mix(baseClass) {
  return class extends baseClass {
    get editor() {
      return this.closest("graph-editor")
    }
  }
}

export default mix
