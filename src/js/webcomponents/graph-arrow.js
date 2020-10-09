import { html, css, LitElement } from "lit-element"

let styles = css`
  :host {
    color: white;
    position: absolute;
  }
  svg {
    overflow: visible;
    pointer-events: none;
  }

  g#graph-line-group {
    --color: black;
    fill: var(--color);
    stroke: var(--color);
  }
  g#graph-line-group:hover {
    --color: red;
  }
`

class GraphArrow extends LitElement {
  constructor() {
    super()
    this.strokeWidth = 2
  }

  render() {
    return html`
      <style>
        g {
          pointer-events: ${this.pseudo ? "none" : "stroke"};
        }
      </style>
      <svg>
        <g id="graph-line-group">
          <marker
            id="graph-arrow-marker"
            viewBox="-5 -5 10 10"
            orient="auto"
            refX="0"
            refY="0"
            markerUnits="strokeWidth"
            markerWidth=${this.markerWidth}
            markerHeight=${this.markerWidth}
          >
            <polygon points="-5,-5 5,0 -5,5" stroke="none" />
          </marker>
          <line
            stroke-width=${this.strokeWidth}
            marker-end="url(#graph-arrow-marker)"
            x1=${this.startx}
            y1=${-this.starty}
            x2=${this.endx}
            y2=${-this.endy}
          />
        </g>
      </svg>
    `
  }

  static get styles() {
    return styles
  }

  static get properties() {
    return {
      startx: { type: Number, reflect: true },
      starty: { type: Number, reflect: true },
      endx: { type: Number, reflect: true },
      endy: { type: Number, reflect: true },
      pseudo: { type: Boolean, reflect: true },
      strokeWidth: { type: Number, reflect: true },
    }
  }

  get markerWidth() {
    return 3 * this.strokeWidth
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

customElements.define("graph-arrow", GraphArrow)
export default GraphArrow
