import { html, LitElement } from "lit-element"
import Command from "../command.js"
import CommandEvent from "../command-event.js"
import editorMixin from "./util/editor-mixin.js"

import "./graph-arrow.js"

class GraphLink extends editorMixin(LitElement) {
  constructor() {
    super()
    this.strokeWidth = 2
    this.pos = {
      start: { x: 0, y: 0 },
      end: { x: 0, y: 0 },
    }

    this.fromObs = this.makeObserver()
    this.toObs = this.makeObserver()
  }

  render() {
    return html`
      <graph-arrow
        startx=${this.pos.start.x}
        starty=${this.pos.start.y}
        endx=${this.pos.end.x}
        endy=${this.pos.end.y}
        @click=${e => this.handleClick(e)}
      ></graph-arrow>
    `
  }

  static get properties() {
    return {
      linkFrom: { type: String, reflect: true },
      linkTo: { type: String, reflect: true },
      strokeWidth: { type: Number, reflect: true },
    }
  }

  firstUpdated() {
    this.setPoints()

    this.fromObs.observeById(this.linkFrom)
    this.toObs.observeById(this.linkTo)
  }

  attributeChangedCallback(...args) {
    super.attributeChangedCallback(...args)

    let [attrName, _o, n] = args

    if (!this.isConnected) {
      return
    }

    const callback = obs => obs.disconnect()
    let changed = false

    if (attrName == "linkfrom") {
      this.fromObs.observeById(n, callback)
      changed = true
    }
    if (attrName == "linkto") {
      this.toObs.observeById(n, callback)
      changed = true
    }

    if (changed) {
      this.setPoints()
    }
  }

  get markerWidth() {
    return 3 * this.strokeWidth
  }

  setPoints() {
    if (this.linkFrom == null || this.linkTo == null) {
      return
    }

    const start = document.getElementById(this.linkFrom)
    const end = document.getElementById(this.linkTo)

    if (start == null || end == null) {
      return
    }

    const line = [
      { x: start.offsetLeft, y: start.offsetTop },
      { x: end.offsetLeft, y: end.offsetTop },
    ]

    const edge = getIntersectedEdge(line, getEdges(end))

    if (edge != null) {
      const pos = {
        start: {
          x: start.offsetLeft,
          y: start.offsetTop,
        },
        end: getIntersectPoint(line, edge),
      }

      const theta = Math.atan2(pos.end.y - pos.start.y, pos.end.x - pos.start.x)

      const modifier = {
        x: (this.markerWidth / 2) * this.strokeWidth * Math.cos(theta),
        y: (this.markerWidth / 2) * this.strokeWidth * Math.sin(theta),
      }

      Object.assign(pos, {
        end: {
          x: pos.end.x - modifier.x,
          y: pos.end.y - modifier.y,
        },
      })

      this.applyLinePos({
        start: { x: pos.start.x, y: -pos.start.y },
        end: { x: pos.end.x, y: -pos.end.y },
      })
      this.requestUpdate()
      this.style.setProperty("display", "block")
    } else {
      this.style.setProperty("display", "none")
    }
  }

  applyLinePos({ start, end }) {
    this.pos = { start, end }
  }

  makeObserver() {
    return new NodeMoveObserver(_mutations => {
      this.setPoints()
    })
  }

  handleClick(e) {
    e.stopPropagation()
    this.editor.deselectNodes()
    this.destroy()
  }

  destroy() {
    this.dispatchEvent(new CommandEvent(this.createDestroyCommand()))
  }

  createDestroyCommand() {
    const editor = this.editor
    const linkLayer = editor.linkLayer

    const up = () => {
      this.remove()
    }

    const down = () => {
      linkLayer.append(this)
    }

    return new Command(up, down)
  }

  toPlainObj() {
    return {
      name: "graph-link",
      resources: {
        from: this.linkFrom,
        to: this.linkTo,
        strokeWidth: this.strokeWidth,
      },
    }
  }

  init({ from, to, strokeWidth }) {
    this.linkFrom = from
    this.linkTo = to
    this.strokeWidth = strokeWidth
  }
}

class NodeMoveObserver extends MutationObserver {
  observe(target) {
    super.observe(target, {
      attributes: true,
      attributeFilter: ["posx", "posy"],
      childList: true,
      subtree: true,
    })
  }

  observeById(id, failCallback) {
    const element = document.getElementById(id)
    if (element != null) {
      this.observe(element)
      return true
    } else {
      if (failCallback) failCallback(this)
      return false
    }
  }
}

function getIntersectedEdge(line, edges) {
  if (isIntersected(line, edges.top)) {
    return edges.top
  } else if (isIntersected(line, edges.left)) {
    return edges.left
  } else if (isIntersected(line, edges.bottom)) {
    return edges.bottom
  } else if (isIntersected(line, edges.right)) {
    return edges.right
  } else {
    return null
  }
}

function isIntersected([a, b], [c, d]) {
  const ta = (c.x - d.x) * (a.y - c.y) + (c.y - d.y) * (c.x - a.x)
  const tb = (c.x - d.x) * (b.y - c.y) + (c.y - d.y) * (c.x - b.x)
  const tc = (a.x - b.x) * (c.y - a.y) + (a.y - b.y) * (a.x - c.x)
  const td = (a.x - b.x) * (d.y - a.y) + (a.y - b.y) * (a.x - d.x)

  return tc * td <= 0 && ta * tb <= 0
}

function getEdges(e) {
  return {
    top: [
      {
        x: e.offsetLeft - e.offsetWidth / 2,
        y: e.offsetTop - e.offsetHeight / 2,
      },
      {
        x: e.offsetLeft - e.offsetWidth / 2 + e.offsetWidth,
        y: e.offsetTop - e.offsetHeight / 2,
      },
    ],
    left: [
      {
        x: e.offsetLeft - e.offsetWidth / 2,
        y: e.offsetTop - e.offsetHeight / 2,
      },
      {
        x: e.offsetLeft - e.offsetWidth / 2,
        y: e.offsetTop - e.offsetHeight / 2 + e.offsetHeight,
      },
    ],
    bottom: [
      {
        x: e.offsetLeft - e.offsetWidth / 2,
        y: e.offsetTop - e.offsetHeight / 2 + e.offsetHeight,
      },
      {
        x: e.offsetLeft - e.offsetWidth / 2 + e.offsetWidth,
        y: e.offsetTop - e.offsetHeight / 2 + e.offsetHeight,
      },
    ],
    right: [
      {
        x: e.offsetLeft - e.offsetWidth / 2 + e.offsetWidth,
        y: e.offsetTop - e.offsetHeight / 2,
      },
      {
        x: e.offsetLeft - e.offsetWidth / 2 + e.offsetWidth,
        y: e.offsetTop - e.offsetHeight / 2 + e.offsetHeight,
      },
    ],
  }
}

function getIntersectPoint([a, b], [c, d]) {
  const vca = { x: a.x - c.x, y: a.y - c.y }
  const vab = { x: b.x - a.x, y: b.y - a.y }
  const vcd = { x: d.x - c.x, y: d.y - c.y }

  const ip = vab.x * vcd.y - vab.y * vcd.x

  const ratio = (vca.y * vcd.x - vca.x * vcd.y) / ip

  return {
    x: vab.x * ratio + a.x,
    y: vab.y * ratio + a.y,
  }
}

customElements.define("graph-link", GraphLink)
export default GraphLink
