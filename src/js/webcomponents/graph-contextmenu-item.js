import { html, css, LitElement } from "lit-element"
import editorMixin from "./util/editor-mixin.js"

const styles = css`
  li {
    list-style-type: none;
    padding: 0.1em 1em;
  }

  li:hover {
    background-color: #e0e0e0;
  }
`

class GraphContextMenuItem extends editorMixin(LitElement) {
  render() {
    return html`
      <li @click=${this.handleClick}>
        <slot></slot>
      </li>
    `
  }

  static get styles() {
    return styles
  }

  handleClick() {
    this.closest("graph-contextmenu").do(this.operation())
  }
}

customElements.define("graph-contextmenu-item", GraphContextMenuItem)
export default GraphContextMenuItem
