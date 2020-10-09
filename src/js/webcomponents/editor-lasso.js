import { html, css, LitElement } from "lit-element"

import editorMixin from "./util/editor-mixin.js"

class EditorLasso extends editorMixin(LitElement) {
  render() {
    return html`
      <style>
        :host {
          --lasso-top: ${Math.min(this.starty, this.endy)}px;
          --lasso-left: ${Math.min(this.startx, this.endx)}px;
          --lasso-width: ${Math.abs(this.endx - this.startx)}px;
          --lasso-height: ${Math.abs(this.endy - this.starty)}px;
        }
      </style>
      <div class="lasso"></div>
    `
  }

  static get styles() {
    return css`
      .lasso {
        border: dashed 1px;
        position: fixed;
        top: var(--lasso-top);
        left: var(--lasso-left);
        width: var(--lasso-width);
        height: var(--lasso-height);
      }
    `
  }

  static get properties() {
    return {
      startx: { type: Number, reflect: true },
      starty: { type: Number, reflect: true },
      endx: { type: Number, reflect: true },
      endy: { type: Number, reflect: true },
    }
  }
}

customElements.define("editor-lasso", EditorLasso)
