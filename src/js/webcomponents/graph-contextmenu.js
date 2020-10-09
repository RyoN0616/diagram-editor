import { html, css, LitElement } from "lit-element"
import editorMixin from "./util/editor-mixin.js"

const styles = css`
  :host {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
  }

  ::slotted(*) {
    background-color: red;
  }

  #graph-contextmenu {
    border: solid 1px;
    min-width: 120px;
    max-width: 200px;
    background-color: whitesmoke;
    word-wrap: break-all;
    box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.15);
  }

  #graph-contextmenu:hover {
    box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 0.15);
    z-index: 1;
  }

  ul {
    padding: 0.1em;
    margin: 0.5em 0;
  }
`

class GraphContextMenu extends editorMixin(LitElement) {
  render() {
    return html`
      <div id="graph-contextmenu" @blur=${this.handleBlur} tabindex="-1">
        <ul>
          <slot></slot>
        </ul>
      </div>
    `
  }

  static get styles() {
    return styles
  }

  static get properties() {
    return {
      posx: { type: Number, reflex: true },
      posy: { type: Number, reflex: true },
    }
  }

  connectedCallback() {
    super.connectedCallback()

    this.updateComplete.then(() => {
      const menu = this.shadowRoot.getElementById("graph-contextmenu")

      menu.addEventListener("blur", this.handleBlur)
      menu.focus()

      this.style.top = `${xOrReflexed(
        this.posy,
        this.clientHeight,
        window.innerHeight
      )}px`
      this.style.left = `${xOrReflexed(
        this.posx,
        this.clientWidth,
        window.innerWidth
      )}px`
    })
  }

  blur() {
    this.remove()
  }

  handleBlur(_e) {
    this.remove()
  }

  do() {
    this.remove()
  }
}

function xOrReflexed(x, span, limit) {
  return x + span < limit ? x : x - span
}

customElements.define("graph-contextmenu", GraphContextMenu)

export default GraphContextMenu
