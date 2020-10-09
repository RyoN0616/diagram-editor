import { html, css, LitElement } from "lit-element"
import editorMixin from "./util/editor-mixin.js"

const styles = css`
  :host {
    display: block;
  }

  .graph-node__pattern {
    min-height: 1.8em;
    text-align: center;
    background-color: greenyellow;
  }
`

class GraphContentPattern extends editorMixin(LitElement) {
  render() {
    return html`
      <div class="graph-node__pattern">
        ${this.patternData ? this.patternData.name : "(証)"}
      </div>
    `
  }

  static get styles() {
    return styles
  }

  get patternData() {
    return this.__pattern
  }
  set patternData(value) {
    this.__pattern = value
    this.requestUpdate()
  }

  contextMenuItems() {
    return html``
  }

  toPlainObj() {
    return {
      name: "graph-content-pattern",
      resources: {
        patternData: this.patternData,
      },
    }
  }

  init({ patternData }) {
    this.patternData = patternData
  }
}

customElements.define("graph-content-pattern", GraphContentPattern)
export default GraphContentPattern
