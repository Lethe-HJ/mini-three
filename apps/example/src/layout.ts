import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./content";
import { demos } from "./config";

const LAST_DEMO_KEY = "last-demo-id";

export interface DemoInfo {
  id: string;
  name: string;
  description: string;
  showInMenu: boolean;
  /** 左栏 iframe 对应脚本 {@link leftFile} 的卡片标题 */
  leftTitle: string;
  /** 右栏 iframe 对应脚本 {@link rightFile} 的卡片标题 */
  rightTitle: string;
  leftFile: string;
  rightFile: string;
  init: () => Promise<void>;
}

@customElement("demo-layout")
export class DemoLayout extends LitElement {
  @property({ type: String }) activeId = localStorage.getItem(LAST_DEMO_KEY) ?? "demo1";
  @state() private demoItems: DemoInfo[] = [];

  static styles = css`
    :host {
      display: flex;
      height: 100vh;
      min-height: 0;
      font-family: Arial, sans-serif;
    }
    .sidebar {
      width: 200px;
      background: #f0f0f0;
      padding: 20px;
      border-right: 1px solid #ddd;
      overflow-y: auto;
    }
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      min-width: 0;
      padding: 20px;
      overflow: hidden;
    }
    .content > demo-content {
      flex: 1 1 0;
      min-height: 0;
      min-width: 0;
    }
    .nav-item {
      padding: 10px;
      margin: 5px 0;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .nav-item:hover {
      background: #e0e0e0;
    }
    .nav-item.active {
      background: #007bff;
      color: #fff;
    }
  `;

  private async loadDemoInfo() {
    const demoInfos: DemoInfo[] = [];
    for (const demoId of demos) {
      try {
        const { demoInfo } = await import(`./${demoId}/index.ts`);
        if (demoInfo.showInMenu) demoInfos.push(demoInfo);
      } catch (error) {
        console.warn(`Failed to load demo ${demoId}:`, error);
      }
    }
    this.demoItems = demoInfos;
    if (demoInfos.length > 0 && !demoInfos.find((item) => item.id === this.activeId)) {
      this.activeId = demoInfos[0].id;
    }
  }

  protected firstUpdated() {
    this.loadDemoInfo();
  }

  private handleNavClick(item: DemoInfo) {
    this.activeId = item.id;
    localStorage.setItem(LAST_DEMO_KEY, item.id);
  }

  render() {
    const activeItem = this.demoItems.find((item) => item.id === this.activeId);
    return html`
      <div class="sidebar">
        <h2>Demos</h2>
        ${this.demoItems.map(
          (item) =>
            html`<div
              class="nav-item ${this.activeId === item.id ? "active" : ""}"
              @click=${() => this.handleNavClick(item)}
            >
              ${item.name}
            </div>`,
        )}
      </div>
      <div class="content">
        <h1>mini-three - ${activeItem?.name}</h1>
        ${activeItem ? html`<p>${activeItem.description}</p>` : html``}
        <demo-content
          .demoId=${this.activeId}
          .demoInfo=${activeItem}
        ></demo-content>
      </div>
    `;
  }
}
