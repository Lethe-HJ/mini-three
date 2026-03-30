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
  @property({ type: String }) demoId =
    localStorage.getItem(LAST_DEMO_KEY) ?? "demo1";
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
    .demo-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1 1 auto;
    }
    .github-source-link {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      color: #24292f;
      opacity: 0.85;
      transition:
        opacity 0.15s,
        color 0.15s;
    }
    .github-source-link:hover {
      opacity: 1;
      color: #0969da;
    }
    .github-source-link .github-icon {
      width: 22px;
      height: 22px;
      display: block;
    }
    .demo-title-group .demo-title {
      flex: 1 1 auto;
      min-width: 0;
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

    const githubLink =
      active?.githubUrl != null
        ? html`<a
            class="github-source-link"
            href=${active.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="在 GitHub 上查看源码"
            aria-label="在 GitHub 上查看源码"
          >
            <svg class="github-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </a>`
        : null;

    const header = html`
      <div class="demo-header">
        <div class="demo-title-group">
          <div class="demo-title">${currentTitle}</div>
          ${githubLink}
        </div>
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
