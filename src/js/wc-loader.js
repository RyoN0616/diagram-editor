const LOADER = {
  parse({ name, resources }) {
    const element = document.createElement(name)
    element.init(resources)
    return element
  },
}

export default LOADER
