import { html, css, LitElement } from "lit-element"
import realize from "../realize.js"
import Command from "../command.js"
import CommandEvent from "../command-event.js"
import LOADER from "../wc-loader.js"
import editorMixin from "./util/editor-mixin.js"

let styles = css`
  :host {
    display: block;
    position: relative;
  }

  .graph-pane__links-layer {
    pointer-events: none;

    position: absolute;
    top: 0px;
    left: 0px;
    width: 0px;
    height: 0px;
  }

  .graph-pane__links-layer > * {
    pointer-events: auto;
  }
`

class GraphLinkList extends editorMixin(LitElement) {
  render() {
    return html`
      <div class="graph-pane__links-layer" style="overflow: visible">
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

  link(from, to) {
    let fromId, toId
    if (typeof from === "object" && typeof to === "object") {
      fromId = from.id
      toId = to.id
    } else {
      fromId = from
      toId = to
    }

    const links = Array.from(this.children)
    if (links.find(x => x.linkFrom == fromId && x.linkTo == toId) != null) {
      return
    }

    const link = realize(html`
      <graph-link linkFrom=${fromId} linkTo=${toId}> </graph-link>
    `).firstElementChild

    this.appendChild(link)
    this.dispatchEvent(new CommandEvent(this.createLinkCommand(link)))
  }

  createLinkCommand(link) {
    const up = () => {
      this.append(link)
    }

    const down = () => {
      link.remove()
    }

    return new Command(up, down)
  }

  toPlainObj() {
    return {
      name: "graph-link-list",
      resources: [...this.children].map(x => x.toPlainObj()),
    }
  }

  init(links) {
    this.slot = "link-layer"
    this.append(...links.map(x => LOADER.parse(x)))
  }
}

customElements.define("graph-link-list", GraphLinkList)

export default GraphLinkList
