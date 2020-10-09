import { html, css, LitElement } from "lit-element"
import UUIDv4 from "uuid/v4"
import hotkeys from "hotkeys-js"

import { posOnGraph, relativePos } from "../graph/util.js/"
import MIME_EDITOR from "../mime-editor.js"
import MIME_KAMPO from "../mime-kampo.js"
import realize from "../realize.js"
import Command from "../command.js"
import CommandEvent from "../command-event.js"
import LOADER from "../wc-loader.js"
import editorMixin from "./util/editor-mixin.js"

import "./editor-lasso.js"
import "./graph-arrow.js"

let styles = css`
  :host {
    display: block;
    height: 100%;
  }

  .graph-editor {
    --zoom: 1;
    --center-x: 0px;
    --center-y: 0px;
    height: 100%;
    background-color: lightblue;
    overflow: hidden;
  }

  .graph-pane {
    position: relative;
    top: 0px;
    left: 0px;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 0px;
  }

  .graph-pane__layers-container {
    position: absolute;
    top: calc(50% + var(--zoom) * var(--center-y));
    left: calc(50% - var(--zoom) * var(--center-x));
    box-sizing: border-box;
    width: 0px;
    height: 0px;
    transform-origin: center;
    transform: scale(var(--zoom));
    overflow: visible;
    /* transition: transform 1s; */
    pointer-events: none;
  }
`

class GraphEditor extends editorMixin(LitElement) {
  constructor() {
    super()
    this.zoom = 1
    this.centerX = 0
    this.centerY = 0
    this.draggedData = null
    this.clippedData = null

    hotkeys("ctrl+v", { scope: "edit", element: this }, () => {
      if (document.activeElement != document.body) {
        // if any input is focused, this action is prevented
        return
      } else {
        // to prevent pasting to inputs, remove cursor
        window.getSelection().removeAllRanges()
      }

      this.pasteNodes()
    })

    hotkeys("ctrl+c", { scope: "edit", element: this }, () => {
      const selected = this.nodeLayer.selectedNodes

      if (selected.length > 0) {
        selected[0].cloneToClipboardSelected()
      }
    })

    hotkeys("ctrl+x", { scope: "edit", element: this }, () => {
      const selected = this.nodeLayer.selectedNodes

      if (selected.length > 0) {
        selected[0].cloneToClipboardSelected()

        selected[0].destroySelected()
      }
    })
  }

  render() {
    return html`
      <div
        class="graph-editor"
        style="
        --zoom: ${this.zoom};
        --center-x: ${this.center.x}px;
        --center-y: ${this.center.y}px;
      "
      >
        <div
          class="graph-pane"
          draggable="true"
          @dragenter=${this.handleDragOver}
          @dragover=${this.handleDragOver}
          @dragend=${this.handleDragEnd}
          @dragstart=${this.handleDragStart}
          @drop=${this.handleDrop}
          @click=${this.handleClick}
          @contextmenu=${this.handleContextMenu}
        >
          <div class="graph-pane__layers-container">
            <slot name="link-layer"></slot>
            <slot name="node-layer"></slot>
            <graph-link-list id="pseudo-link-container"></graph-link-list>
          </div>
        </div>
      </div>

      <span id="blank"></span>
    `
  }

  static get styles() {
    return styles
  }

  static get properties() {
    return {
      zoom: { type: Number, reflect: true },
      centerX: { type: Number, reflect: true },
      centerY: { type: Number, reflect: true },
    }
  }

  get center() {
    return {
      x: this.centerX,
      y: this.centerY,
    }
  }
  set center({ x, y }) {
    this.centerX = x
    this.centerY = y
  }

  get editor() {
    return this
  }
  get linkLayer() {
    return this.querySelector(`[slot="link-layer"]`)
  }
  get nodeLayer() {
    return this.querySelector(`[slot="node-layer"]`)
  }

  posOnGraph(relativePos) {
    return posOnGraph(this, relativePos)
  }

  relativePos(clientPos) {
    return relativePos(clientPos, this)
  }

  handleDragStart(event) {
    const pos = this.posOnGraph(this.relativePos(event))

    event.dataTransfer.setData(MIME_EDITOR, JSON.stringify({}))

    if (event.ctrlKey) {
      this.deselectNodes()

      const lasso = document.createElement("editor-lasso")
      this.shadowRoot.querySelector(".graph-pane").appendChild(lasso)

      lasso.startx = event.clientX
      lasso.starty = event.clientY

      this.draggedData = {
        type: "lasso",
        element: lasso,
      }

      const img = this.shadowRoot.querySelector("#blank")
      event.dataTransfer.setDragImage(img, 0, 0)
      event.dataTransfer.effectAllowed = "all"
    } else {
      this.draggedData = {
        type: "pane",
        from: pos,
      }
    }
  }

  handleDragOver(event) {
    event.preventDefault()

    if (![...event.dataTransfer.types].includes(MIME_EDITOR)) {
      return
    }
    if (this.draggedData == null) {
      return
    }

    const pos = this.posOnGraph(this.relativePos(event))
    switch (this.draggedData.type) {
      case "node": {
        event.dataTransfer.dropEffect = "move"

        const { element, pos: mod } = this.draggedData

        const next = {
          x: this.center.x + pos.x - mod.x,
          y: this.center.y + pos.y - mod.y,
        }

        element.posx = next.x
        element.posy = next.y

        break
      }

      case "move-selected": {
        event.dataTransfer.dropEffect = "move"

        const data = this.draggedData
        const selected = data.originalPosMap.keys()

        const delta = {
          x: this.center.x + pos.x - data.pos.x - data.element.posx,
          y: this.center.y + pos.y - data.pos.y - data.element.posy,
        }

        for (const node of selected) {
          node.posx = node.posx + delta.x
          node.posy = node.posy + delta.y
        }

        break
      }

      case "node-link": {
        const { arrow } = this.draggedData
        const pos = this.posOnGraph(this.relativePos(event))

        arrow.endx = pos.x
        arrow.endy = pos.y

        break
      }

      case "lasso": {
        const { element } = this.draggedData

        element.endx = event.clientX
        element.endy = event.clientY

        break
      }
    }
  }

  handleDragEnd(event) {
    event.preventDefault()

    if (this.draggedData == null) {
      return
    }

    switch (this.draggedData.type) {
      case "node": {
        const { element, originalPos } = this.draggedData
        element.posx = originalPos.x
        element.posy = originalPos.y

        break
      }
      case "node-link": {
        const { arrow } = this.draggedData
        arrow.remove()

        break
      }

      case "lasso": {
        const { element } = this.draggedData
        element.remove()

        break
      }
    }

    this.draggedData = null
  }

  handleDrop(event) {
    event.preventDefault()

    const pos = this.posOnGraph(this.relativePos(event))

    const editorPayload = event.dataTransfer.getData(MIME_EDITOR)
    if (editorPayload) {
      this.dropInEditor(this.draggedData, pos)
    }

    const kampoPayload = event.dataTransfer.getData(MIME_KAMPO)
    if (kampoPayload) {
      this.dropKampo(JSON.parse(kampoPayload), pos)
    }

    this.draggedData = null
  }

  dropInEditor(data, pos) {
    switch (data.type) {
      case "pane": {
        this.center = {
          x: this.center.x - (pos.x - data.from.x),
          y: this.center.y - (pos.y - data.from.y),
        }
        break
      }
      case "node": {
        let node = data.element

        const prev = data.originalPos
        const next = {
          x: this.center.x + pos.x - data.pos.x,
          y: this.center.y + pos.y - data.pos.y,
        }

        this.dispatchEvent(
          new CommandEvent(this.createNodeMoveCommand(node, prev, next))
        )

        break
      }

      case "move-selected": {
        const { element, pos: mod, originalPosMap } = data

        const delta = {
          x: this.center.x + pos.x - mod.x - originalPosMap.get(element).x,
          y: this.center.y + pos.y - mod.y - originalPosMap.get(element).y,
        }

        this.dispatchEvent(
          new CommandEvent(
            this.createMoveSelectedCommand(originalPosMap, delta)
          )
        )

        break
      }

      case "node-link": {
        const { arrow } = this.draggedData
        arrow.remove()

        break
      }

      case "lasso": {
        const { element } = this.draggedData

        const start = this.posOnGraph(
          this.relativePos({ clientX: element.startx, clientY: element.starty })
        )
        const end = this.posOnGraph(
          this.relativePos({ clientX: element.endx, clientY: element.endy })
        )

        const min = {
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
        }
        const max = {
          x: Math.max(start.x, end.x),
          y: Math.max(start.y, end.y),
        }

        const nodes = Array.from(this.nodeLayer.children)

        const selected = nodes.filter(node => {
          const stateX = min.x <= node.posx && node.posx <= max.x
          const stateY = min.y <= node.posy && node.posy <= max.y
          return stateX && stateY
        })

        selected.forEach(node => {
          node.selected = true
        })

        element.remove()

        break
      }
    }
  }

  dropKampo(payload, pos) {
    if (payload.type == "searched") {
      let pattern = payload.item

      const fragment = realize(
        this.nodeTemplate(
          { pos },
          html`
            <graph-content-pattern .patternData=${pattern}>
            </graph-content-pattern>
          `
        )
      )

      const node = fragment.children[0]
      this.dispatchEvent(new CommandEvent(this.createAppendNodeCommand(node)))
    }

    this.draggedData = null
  }

  handleClick(event) {
    event.preventDefault()

    this.deselectNodes()

    if (!event.ctrlKey) {
      return
    }

    const pos = this.posOnGraph(this.relativePos(event))

    const fragment = realize(
      this.nodeTemplate(
        { pos },
        html`
          <graph-content-note .x=${0}></graph-content-note>
        `
      )
    )

    const node = fragment.children[0]
    this.dispatchEvent(new CommandEvent(this.createAppendNodeCommand(node)))

    node.firstElementChild.focus()
  }

  handleContextMenu(event) {
    event.preventDefault()

    const template = html`
      <graph-contextmenu posx=${event.x} posy=${event.y}>
        <graph-contextmenu-item
          .operation=${() => {
            this.pasteNodes()
          }}
        >
          Paste
        </graph-contextmenu-item>
      </graph-contextmenu>
    `

    document.body.append(...realize(template).children)
  }

  appendNode(node) {
    this.nodeLayer.appendChild(node)
  }

  deselectNodes() {
    Array.from(this.nodeLayer.selectedNodes).forEach(node => {
      node.selected = false
    })
  }

  link(from, to) {
    this.linkLayer.link(from, to)
  }

  pasteNodes() {
    this.deselectNodes()

    this.dispatchEvent(
      new CommandEvent(this.createPasteCommand(this.clippedData))
    )
  }

  createPseudoArrow({ x, y }) {
    const arrow = document.createElement("graph-arrow")
    this.shadowRoot
      .querySelector("[id=pseudo-link-container]")
      .appendChild(arrow)

    arrow.pseudo = true
    arrow.startx = x
    arrow.starty = y
    arrow.endx = x
    arrow.endy = y

    return arrow
  }

  nodeTemplate({ id, pos: { x, y } = {} }, children) {
    return html`
      <graph-node id=${id || UUIDv4()} posx=${x || 0} posy=${y || 0}>
        ${children}
      </graph-node>
    `
  }

  createAppendNodeCommand(node) {
    const up = () => {
      this.appendNode(node)
    }
    const down = () => {
      node.remove()
    }

    return new Command(up, down)
  }

  createNodeMoveCommand(node, prev, next) {
    const up = () => {
      node.posx = next.x
      node.posy = next.y
    }
    const down = () => {
      node.posx = prev.x
      node.posy = prev.y
    }

    return new Command(up, down)
  }

  createMoveSelectedCommand(originalPosMap, delta) {
    const up = () => {
      for (const node of originalPosMap.keys()) {
        node.posx = originalPosMap.get(node).x + delta.x
        node.posy = originalPosMap.get(node).y + delta.y
      }
    }
    const down = () => {
      for (const node of originalPosMap.keys()) {
        node.posx = originalPosMap.get(node).x
        node.posy = originalPosMap.get(node).y
      }
    }

    return new Command(up, down)
  }

  createPasteCommand({ nodes, links }) {
    // for mutliple actions, duplicate (cloned) elements
    const clone = {
      nodes: nodes.map(n => n.cloneNode(true)),
      links: links.map(n => n.cloneNode(true)),
    }

    for (const node of clone.nodes) {
      // move nodes a little
      node.posx = node.posx + 10
      node.posy = node.posy - 10

      // publish new id and replace old one
      const oldId = node.id
      node.id = UUIDv4()
      for (const link of clone.links) {
        if (link.linkTo == oldId) {
          link.linkTo = node.id
        }
        if (link.linkFrom == oldId) {
          link.linkFrom = node.id
        }
      }
    }

    const up = () => {
      for (const node of clone.nodes) {
        this.nodeLayer.appendChild(node)
      }
      for (const link of clone.links) {
        this.linkLayer.appendChild(link)
      }
    }

    const down = () => {
      for (const node of clone.nodes) {
        node.remove()
      }
      for (const link of clone.createPasteCommandlinks) {
        link.remove()
      }
    }

    return new Command(up, down)
  }

  toPlainObj() {
    return {
      name: "graph-editor",
      resources: {
        nodes: this.nodeLayer.toPlainObj(),
        links: this.linkLayer.toPlainObj(),
      },
    }
  }

  serialize() {
    return JSON.stringify(this.toPlainObj())
  }

  init({ nodes, links }) {
    this.append(LOADER.parse(nodes), LOADER.parse(links))
  }
}

customElements.define("graph-editor", GraphEditor)

export default GraphEditor
