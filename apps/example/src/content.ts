import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import type { DemoExperiment, DemoInfo } from "./layout";

const LAST_DEMO_KEY = "last-demo-id";

const GAP = 20;

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

@customElement("demo-content")
export class DemoContent extends LitElement {
  @property({ type: String }) demoId = localStorage.getItem(LAST_DEMO_KEY) ?? "demo1";
  @property({ attribute: false }) demoInfo: DemoInfo | null = null;
  @state() private loading = true;
  @state() private error: string | null = null;
  /** 当前选中的小实验 {@link DemoExperiment.id} */
  @state() private activeExperimentId = "";

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
      margin-top: ${GAP}px;
    }
    .demo-header {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 15px;
    }
    .demo-header .demo-title {
      margin-bottom: 0;
    }
    .panel-select {
      flex-shrink: 0;
      max-width: min(280px, 55%);
      padding: 6px 10px;
      font-size: 14px;
      border: 1px solid #ccc;
      border-radius: 6px;
      background: #fff;
      color: #333;
      cursor: pointer;
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
      color: #333;
      flex-shrink: 0;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

  protected updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has("demoInfo")) {
      this.loading = false;
      this.error = null;
    }
    if (changedProperties.has("demoId")) {
      localStorage.setItem(LAST_DEMO_KEY, this.demoId);
    }
    /** 切换 demo 后若 activeExperimentId 仍属旧列表，与 option 对不上会令 select 显示空白；在此对齐 state */
    const list = this.demoInfo?.experiments;
    if (list?.length) {
      const resolved = this.resolveExperimentId(list);
      if (resolved !== this.activeExperimentId) {
        this.activeExperimentId = resolved;
      }
    }
  }

  /** 保证与当前 {@link demoInfo.experiments} 中某一项一致，避免切换 demo 后下拉显示空白 */
  private resolveExperimentId(experiments: DemoExperiment[]): string {
    if (!experiments.length) return "";
    if (experiments.some((e) => e.id === this.activeExperimentId)) {
      return this.activeExperimentId;
    }
    return experiments[0].id;
  }

  private onExperimentSelect(ev: Event) {
    const sel = ev.target as HTMLSelectElement;
    const v = sel.value;
    if (this.demoInfo?.experiments.some((e) => e.id === v)) {
      this.activeExperimentId = v;
    }
  }

  private getActiveExperiment(): DemoExperiment | undefined {
    const list = this.demoInfo?.experiments;
    if (!list?.length) return undefined;
    return list.find((e) => e.id === this.activeExperimentId) ?? list[0];
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

  render() {
    const experiments = this.demoInfo?.experiments ?? [];
    const resolvedExperimentId = this.resolveExperimentId(experiments);
    const active = this.getActiveExperiment();
    const currentTitle = active?.title ?? "—";
    const multi = experiments.length > 1;

    const header = html`
      <div class="demo-header">
        <div class="demo-title">${currentTitle}</div>
        ${
          multi
            ? keyed(
                this.demoId,
                html`<select
                class="panel-select"
                .value=${resolvedExperimentId}
                @change=${this.onExperimentSelect}
                aria-label="切换小实验"
              >
                ${experiments.map(
                  (ex) =>
                    html`<option
                      value=${ex.id}
                      ?selected=${ex.id === resolvedExperimentId}
                    >
                      ${ex.title}
                    </option>`,
                )}
              </select>`,
              )
            : null
        }
      </div>
    `;

    if (this.loading) {
      return html`
        <div class="demo-container">
          <div class="demo-card">
            ${header}
            <div class="loading">Loading...</div>
          </div>
        </div>
      `;
    }
    if (this.error) {
      return html`<div class="demo-container">
        <div class="demo-card">
          ${header}
          <div class="error">${this.error}</div>
        </div>
      </div>`;
    }
    if (!this.demoInfo) {
      return html`
        <div class="demo-container">
          <div class="demo-card">
            ${header}
            <div class="error">No demo info loaded</div>
          </div>
        </div>
      `;
    }
    if (!experiments.length) {
      return html`
        <div class="demo-container">
          <div class="demo-card">
            ${header}
            <div class="error">该 demo 未配置 experiments</div>
          </div>
        </div>
      `;
    }
    const scriptSrc = active?.scriptSrc;
    if (!scriptSrc) {
      return html`
        <div class="demo-container">
          <div class="demo-card">
            ${header}
            <div class="error">无法解析当前小实验</div>
          </div>
        </div>
      `;
    }
    /* 实验脚本只能在 iframe 文档里执行（依赖 #canvas），不要在父页调用 entry() */
    const srcdoc = this.generateIframeHtml(scriptSrc, "canvas");
    const iframeKey = `${this.demoId}:${resolvedExperimentId}`;
    return html`<div class="demo-container">
      <div class="demo-card">
        ${header}
        <div class="iframe-container">
          ${keyed(iframeKey, html`<iframe .srcdoc=${srcdoc} title=${currentTitle}></iframe>`)}
        </div>
      </div>
    </div>`;
  }
}
