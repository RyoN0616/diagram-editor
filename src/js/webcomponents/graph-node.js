import { html, css, LitElement } from "lit-element"
import { posOnGraph, relativePos } from "../graph/util.js"
import MIME_EDITOR from "../mime-editor.js"
import Command from "../command.js"
import CommandEvent from "../command-event.js"
import LOADER from "../wc-loader.js"
import realize from "../realize.js"
import editorMixin from "./util/editor-mixin.js"

let styles = css`
  :host {
    display: block;
    position: absolute;
    top: calc(50% - var(--pos-y));
    left: calc(50% + var(--pos-x));
    transform: translate(-50%, -50%);
    will-change: transform;
    --node-border: solid 1px;
  }

  :host([selected]) {
    --node-border: solid 2px;
  }

  .graph-node {
    --pos-x: 0px;
    --pos-y: 0px;

    width: 150px;
    background-color: beige;
    border: var(--node-border);

    box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.15);
  }

  .graph-node:hover {
    box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 0.15);
    z-index: 1;
  }

  #blank {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
  }
`

class GraphNode extends editorMixin(LitElement) {
  render() {
    this.style["--pos-x"] = `${this.posx}px`
    this.style["--pos-y"] = `${this.posy}px`

    return html`
      <style>
        :host {
          --pos-x: ${this.posx}px;
          --pos-y: ${this.posy}px;
        }
      </style>
      <div class="graph-node" @contextmenu=${this.openContextMenu}>
        <slot></slot>
      </div>
      <span id="blank"></span>
    `
  }

  static get styles() {
    return styles
  }

  static get properties() {
    return {
      id: { type: String, reflect: true },
      posx: { type: Number, reflect: true },
      posy: { type: Number, reflect: true },
      selected: { type: Boolean, reflect: true },
    }
  }

  connectedCallback() {
    super.connectedCallback()

    this.setAttribute("draggable", "true")
    this.addEventListener("dragover", e => e.preventDefault())
    this.addEventListener("dragenter", e => e.preventDefault())
    this.addEventListener("dragstart", this.handleDragStart)
    this.addEventListener("drop", this.handleDrop)
    this.addEventListener("click", this.handleClick)
  }

  posOnGraph(relativePos) {
    return posOnGraph(this.editor, relativePos)
  }

  relativePos(clientPos) {
    return relativePos(clientPos, this)
  }

  handleDragStart(event) {
    if (event.ctrlKey) {
      this.dragStartLink(event)
    } else if (this.selected) {
      this.dragStartMoveSelected(event)
    } else {
      this.dragStartMove(event)
    }
  }

  dragStartMove(event) {
    this.dragStartCommon(event)

    const pos = this.posOnGraph(this.relativePos(event))
    const originalPos = { x: this.posx, y: this.posy }

    this.editor.draggedData = {
      type: "node",
      element: this,
      pos,
      originalPos,
    }
  }

  dragStartMoveSelected(event) {
    this.dragStartCommon(event)

    const pos = this.posOnGraph(this.relativePos(event))

    const elements = Array.from(this.editor.nodeLayer.selectedNodes)
    const originalPosMap = new Map(
      elements.map(node => {
        return [node, { x: node.posx, y: node.posy }]
      })
    )

    this.editor.draggedData = {
      type: "move-selected",
      element: this,
      pos,
      originalPosMap,
    }
  }

  dragStartLink(event) {
    this.dragStartCommon(event)

    const arrow = this.editor.createPseudoArrow({
      x: this.posx,
      y: this.posy,
    })

    this.editor.draggedData = {
      type: "node-link",
      id: this.id,
      element: this,
      arrow,
    }
  }

  dragStartCommon(event) {
    event.stopPropagation()

    event.dataTransfer.setData(MIME_EDITOR, JSON.stringify({}))

    const img = this.shadowRoot.querySelector("#blank")
    event.dataTransfer.setDragImage(img, 0, 0)

    event.dataTransfer.effectAllowed = "all"
  }

  handleDrop(event) {
    const json = event.dataTransfer.getData(MIME_EDITOR)
    if (json == "") {
      return
    }

    const draggedData = this.editor.draggedData

    switch (draggedData.type) {
      case "node-link": {
        if (draggedData.id == this.id) {
          break
        }
        event.stopPropagation()
        this.editor.deselectNodes()
        this.editor.link(draggedData.id, this.id)
        draggedData.arrow.remove()
      }
    }
  }

  handleClick(e) {
    e.stopPropagation()
    if (!this.selected) {
      this.editor.deselectNodes()
    }
  }

  openContextMenu(event) {
    event.preventDefault()
    event.stopPropagation()

    if (this.selected) {
      const items = this.contextMenuItemsSelected()

      const template = html`
        <graph-contextmenu posx=${event.x} posy=${event.y}>
          ${items}
        </graph-contextmenu>
      `

      document.body.append(...realize(template).children)
    } else {
      const items = this.contextMenuItems()
      const specificItems = this.children[0].contextMenuItems()

      const template = html`
        <graph-contextmenu posx=${event.x} posy=${event.y}>
          ${items}
          <hr />
          ${specificItems}
        </graph-contextmenu>
      `

      document.body.append(...realize(template).children)
    }
  }

  contextMenuItems() {
    return html`
      <graph-contextmenu-item .operation=${() => this.destroy()}>
        Remove
      </graph-contextmenu-item>

      <graph-contextmenu-item
        .operation=${() => {
          this.cloneToClipboard()
        }}
      >
        Copy
      </graph-contextmenu-item>

      <graph-contextmenu-item
        .operation=${() => {
          this.cloneToClipboard()
          this.destroy()
        }}
      >
        Cut
      </graph-contextmenu-item>
    `
  }

  contextMenuItemsSelected() {
    return html`
      <graph-contextmenu-item .operation=${() => this.destroySelected()}>
        Remove
      </graph-contextmenu-item>

      <graph-contextmenu-item
        .operation=${() => {
          this.cloneToClipboardSelected()
        }}
      >
        Copy
      </graph-contextmenu-item>

      <graph-contextmenu-item
        .operation=${() => {
          this.cloneToClipboardSelected()
          this.destroySelected()
        }}
      >
        Cut
      </graph-contextmenu-item>
    `
  }

  destroy() {
    this.dispatchEvent(new CommandEvent(this.createDestroyCommand()))
  }

  destroySelected() {
    const selected = Array.from(this.editor.nodeLayer.selectedNodes)
    this.dispatchEvent(
      new CommandEvent(this.createDestroySelectedCommand(selected))
    )
  }

  cloneToClipboard() {
    const clone = this.cloneNode(true)

    this.editor.clippedData = {
      nodes: [clone],
      links: [],
    }
  }

  cloneToClipboardSelected() {
    const selected = Array.from(this.editor.nodeLayer.selectedNodes)

    const idList = selected.map(n => n.id)

    // extract inner links
    const links = Array.from(this.editor.linkLayer.children).filter(
      l => idList.includes(l.linkFrom) && idList.includes(l.linkTo)
    )

    const clone = {
      nodes: selected.map(n => n.cloneNode(true)),
      links: links.map(l => l.cloneNode(true)),
    }

    this.editor.clippedData = clone
  }

  createDestroyCommand() {
    const editor = this.editor
    const linkLayer = editor.linkLayer

    const links = [...linkLayer.children].filter(
      x => x.linkFrom == this.id || x.linkTo == this.id
    )

    const up = () => {
      this.remove()
    }

    const down = () => {
      editor.appendNode(this)
      linkLayer.append(...links)
    }

    return new Command(up, down)
  }

  createDestroySelectedCommand(selected) {
    const editor = this.editor
    const linkLayer = editor.linkLayer

    const links = selected.flatMap(node =>
      [...linkLayer.children].filter(
        x => x.linkFrom == node.id || x.linkTo == node.id
      )
    )

    const up = () => {
      selected.forEach(node => node.remove())
    }

    const down = () => {
      selected.forEach(node => editor.appendNode(node))
      linkLayer.append(...links)
    }

    return new Command(up, down)
  }

  toPlainObj() {
    return {
      name: "graph-node",
      resources: {
        id: this.id,
        posx: this.posx,
        posy: this.posy,
        content: this.firstElementChild.toPlainObj(),
      },
    }
  }

  init({ id, posx, posy, content }) {
    this.id = id
    this.posx = posx
    this.posy = posy
    this.append(LOADER.parse(content))
  }
}

customElements.define("graph-node", GraphNode)

export default GraphNode
