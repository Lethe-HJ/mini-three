import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { DemoInfo } from "./layout";

const LAST_DEMO_KEY = "last-demo-id";

const GAP = 20;
/** 卡片左右 padding 20+20 */
const CARD_HORIZONTAL_PAD = 40;
/** 卡片上 padding + 标题 + 标题下间距 + 下 padding（与 .demo-card / .demo-title 样式一致） */
const CARD_VERTICAL_RESERVE = 73;

/** 将 `html` 模板结果转为 HTML 字符串（供 iframe `srcdoc` 等使用） */
function templateResultToString(result: TemplateResult): string {
  const { strings, values } = result as TemplateResult & {
    strings: TemplateStringsArray;
    values: readonly unknown[];
  };
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += String(values[i] ?? "") + strings[i + 1];
  }
  return out;
}

/** 估算某一种 flex 方向下单张卡片内 iframe 的可用宽高（画布 100% 铺满，不假定固定宽高比） */
function iframeBoxForLayout(
  hostW: number,
  hostH: number,
  horizontal: boolean,
): { iw: number; ih: number } {
  const marginTop = GAP;
  const innerH = Math.max(0, hostH - marginTop);
  const innerW = hostW;
  if (horizontal) {
    const cardW = (innerW - GAP) / 2;
    const cardH = innerH;
    return {
      iw: Math.max(0, cardW - CARD_HORIZONTAL_PAD),
      ih: Math.max(0, cardH - CARD_VERTICAL_RESERVE),
    };
  }
  const cardH = (innerH - GAP) / 2;
  const cardW = innerW;
  return {
    iw: Math.max(0, cardW - CARD_HORIZONTAL_PAD),
    ih: Math.max(0, cardH - CARD_VERTICAL_RESERVE),
  };
}

@customElement("demo-content")
export class DemoContent extends LitElement {
  @property({ type: String }) demoId = localStorage.getItem(LAST_DEMO_KEY) ?? "demo1";
  @property({ attribute: false }) demoInfo: DemoInfo | null = null;
  @state() private loading = true;
  @state() private error: string | null = null;
  @state() private horizontalLayout = true;

  private resizeObserver: ResizeObserver | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      min-width: 0;
    }
    .demo-container {
      display: flex;
      flex: 1 1 0;
      min-height: 0;
      min-width: 0;
      gap: 20px;
      margin-top: 20px;
    }
    .demo-container.horizontal {
      flex-direction: row;
    }
    .demo-container.vertical {
      flex-direction: column;
    }
    .demo-card {
      flex: 1;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }
    .demo-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #333;
      flex-shrink: 0;
    }
    .iframe-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      min-height: 0;
      min-width: 0;
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: hidden;
      background: #eee;
    }
    iframe {
      flex: 1 1 0;
      width: 100%;
      min-height: 0;
      border: none;
      display: block;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      min-height: 120px;
      color: #666;
      font-size: 16px;
    }
    .error {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      min-height: 120px;
      color: #ff4444;
      font-size: 16px;
      background: #ffebee;
      border-radius: 4px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => this.updateLayoutFromHost());
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  protected firstUpdated() {
    this.updateLayoutFromHost();
  }

  private updateLayoutFromHost() {
    const w = this.clientWidth;
    const h = this.clientHeight;
    if (w <= 0 || h <= 0) return;

    const boxH = iframeBoxForLayout(w, h, true);
    const boxV = iframeBoxForLayout(w, h, false);
    const areaH = boxH.iw * boxH.ih;
    const areaV = boxV.iw * boxV.ih;
    const horizontal = areaH >= areaV;

    if (this.horizontalLayout !== horizontal) {
      this.horizontalLayout = horizontal;
    }
  }

  protected updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has("demoInfo")) {
      this.loading = false;
      this.error = null;
    }
    if (changedProperties.has("demoId")) {
      localStorage.setItem(LAST_DEMO_KEY, this.demoId);
    }
    if (changedProperties.has("demoInfo") || changedProperties.has("loading")) {
      queueMicrotask(() => this.updateLayoutFromHost());
    }
  }

  private generateIframeHtml(scriptPath: string, canvasId: string): string {
    const doc = html`<html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>Demo</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html,
          body {
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          canvas {
            display: block;
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <canvas id="${canvasId}"></canvas>
        <script type="module" src="${scriptPath}"></script>
      </body>
    </html>`;
    return `<!DOCTYPE html>${templateResultToString(doc)}`;
  }

  private containerClass() {
    return `demo-container ${this.horizontalLayout ? "horizontal" : "vertical"}`;
  }

  private panelTitles(): { left: string; right: string } {
    const d = this.demoInfo;
    return {
      left: d?.leftTitle ?? "—",
      right: d?.rightTitle ?? "—",
    };
  }

  render() {
    const { left: leftTitle, right: rightTitle } = this.panelTitles();

    if (this.loading) {
      return html`
        <div class="${this.containerClass()}">
          <div class="demo-card">
            <div class="demo-title">${leftTitle}</div>
            <div class="loading">Loading...</div>
          </div>
          <div class="demo-card">
            <div class="demo-title">${rightTitle}</div>
            <div class="loading">Loading...</div>
          </div>
        </div>
      `;
    }
    if (this.error) {
      return html`<div class="${this.containerClass()}">
        <div class="demo-card">
          <div class="demo-title">${leftTitle}</div>
          <div class="error">${this.error}</div>
        </div>
        <div class="demo-card">
          <div class="demo-title">${rightTitle}</div>
          <div class="error">${this.error}</div>
        </div>
      </div>`;
    }
    if (!this.demoInfo) {
      return html`
        <div class="${this.containerClass()}">
          <div class="demo-card">
            <div class="demo-title">${leftTitle}</div>
            <div class="error">No demo info loaded</div>
          </div>
          <div class="demo-card">
            <div class="demo-title">${rightTitle}</div>
            <div class="error">No demo info loaded</div>
          </div>
        </div>
      `;
    }
    const engineHtml = this.generateIframeHtml(
      `./src/${this.demoId}/${this.demoInfo.leftFile}`,
      "canvas",
    );
    const threejsHtml = this.generateIframeHtml(
      `./src/${this.demoId}/${this.demoInfo.rightFile}`,
      "canvas",
    );
    return html`<div class="${this.containerClass()}">
      <div class="demo-card">
        <div class="demo-title">${leftTitle}</div>
        <div class="iframe-container">
          <iframe .srcdoc=${engineHtml} title=${leftTitle}></iframe>
        </div>
      </div>
      <div class="demo-card">
        <div class="demo-title">${rightTitle}</div>
        <div class="iframe-container">
          <iframe .srcdoc=${threejsHtml} title=${rightTitle}></iframe>
        </div>
      </div>
    </div>`;
  }
}
