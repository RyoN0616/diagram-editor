import { html, css, LitElement } from "lit-element"
import Command from "../command.js"
import CommandEvent from "../command-event.js"
import editorMixin from "./util/editor-mixin.js"

const styles = css`
  :host {
    display: block;
  }

  .graph-node__note {
    min-height: 1.6em;
    width: 100%;
    overflow-wrap: break-word;
    text-align: center;
    background-color: whitesmoke;
  }
`

class GraphContentNote extends editorMixin(LitElement) {
  constructor() {
    super()
    this.content = ""
  }

  render() {
    return html`
      <div
        id="note-content"
        class="graph-node__note"
        contenteditable="true"
        @blur=${this.finishContentEdit}
        @paste=${pastePlainText}
      ></div>
    `
  }

  static get styles() {
    return styles
  }

  static get properties() {
    return {
      content: { type: String, reflect: true },
    }
  }

  get contentElement() {
    return this.shadowRoot.getElementById("note-content")
  }

  updated() {
    this.contentElement.innerText = this.content
  }

  finishContentEdit(_e) {
    const prev = this.content
    const next = this.shadowRoot.getElementById("note-content").innerText

    if (prev != next) {
      this.dispatchEvent(new CommandEvent(this.createEditCommand(prev, next)))
    }
  }

  focus() {
    if (this.contentElement != null) {
      this.contentElement.focus()
    } else {
      this.updateComplete.then(() => this.contentElement.focus())
    }
  }

  contextMenuItems() {
    return html``
  }

  createEditCommand(prev, next) {
    const up = () => {
      this.content = next
    }

    const down = () => {
      this.content = prev
    }

    return new Command(up, down)
  }

  toPlainObj() {
    return {
      name: "graph-content-note",
      resources: {
        content: this.content,
      },
    }
  }

  init(data) {
    this.content = data.content
  }
}

function pastePlainText(e) {
  e.preventDefault()

  const text = e.clipboardData.getData("text/plain")

  let selection
  if (this.shadowRoot.getSelection != null) {
    // for Chrome
    selection = this.shadowRoot.getSelection()
  } else {
    // for FireFox
    selection = window.getSelection()
    if (selection.anchorNode != e.target) return
  }

  if (selection.rangeCount != 0) {
    selection.deleteFromDocument()

    const range = selection.getRangeAt(0)
    range.insertNode(document.createTextNode(text))
  }
}

customElements.define("graph-content-note", GraphContentNote)
export default GraphContentNote
