import { html, render } from "lit-html"

const prototype = Object.getPrototypeOf(html``)

// ## Usage
// standard case
//
// ```
// element.append(realize(html`...`))
// ```
// or, to ignore comments or textnodes,
//
// ```
// element.append(...realize(html`...`).children)
// ```

function realize(templateResult) {
  const template = forcePrototype(templateResult)
  const container = document.createDocumentFragment()

  render(template, container)

  return container
}

function forcePrototype(templateResult) {
  const descriptors = Object.keys(templateResult).reduce((acc, k) => {
    acc[k] = { value: templateResult[k] }
    return acc
  }, {})

  return Object.create(prototype, descriptors)
}

export default realize
