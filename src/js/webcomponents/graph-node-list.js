import { html, css, LitElement } from "lit-element"
import LOADER from "../wc-loader.js"
import editorMixin from "./util/editor-mixin.js"

let styles = css`
  :host {
    display: block;
    position: relative;
  }

  .graph-pane__nodes-layer {
    pointer-events: none;
  }

  .graph-pane__nodes-layer > * {
    pointer-events: auto;
  }
`

class GraphNodeList extends editorMixin(LitElement) {
  constructor() {
    super()

    this.observer = new MutationObserver(mutations => {
      mutations
        .filter(x => x.removedNodes.length > 0)
        .forEach(({ removedNodes }) => {
          removedNodes.forEach(node => {
            const id = node.id
            const links = Array.from(this.parentElement.linkLayer.children)

            links
              .filter(x => x.linkFrom == id || x.linkTo == id)
              .forEach(x => {
                x.remove()
              })
          })
        })
    })
  }

  render() {
    return html`
      <div class="graph-pane__nodes-layer">
        <slot></slot>
      </div>
    `
  }

  static get styles() {
    return styles
  }

  static get properties() {
    return {}
  }

  get selectedNodes() {
    return this.querySelectorAll("[selected]")
  }

  connectedCallback() {
    super.connectedCallback()

    this.observer.observe(this, { childList: true })
  }

  toPlainObj() {
    return {
      name: "graph-node-list",
      resources: [...this.children].map(x => x.toPlainObj()),
    }
  }

  init(nodes) {
    this.slot = "node-layer"
    this.append(...nodes.map(x => LOADER.parse(x)))
  }
}

customElements.define("graph-node-list", GraphNodeList)

export default GraphNodeList
