import { PerspectiveCamera, Vector2 } from "three";
import { PerspectiveCamera as EPerspectiveCamera } from "@mini-three/webgl";

export interface CameraTransformConfig {
  initialDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  rotationSpeed?: number;
  zoomSpeed?: number;
  initialTheta?: number;
  initialPhi?: number;
  /** 自动绕 lookAt 目标水平旋转的角速度（弧度/秒），0 或未设置表示关闭；需在同一 rAF 中先 tick() 再渲染；拖拽时 tick 内不旋转 */
  autoRotateSpeed?: number;
  /** 相机位姿因交互更新后调用（用于按需渲染） */
  onChange?: () => void;
}

export class CameraTransformController {
  private camera: PerspectiveCamera | EPerspectiveCamera;
  private initialDistance: number;
  private minDistance: number;
  private maxDistance: number;
  private rotationSpeed: number;
  private zoomSpeed: number;
  private isDragging = false;
  private previousMousePosition = new Vector2();
  private cameraDistance: number;
  private theta = 0;
  private phi = 0;
  private onChange?: () => void;
  /** 弧度/秒，水平方向；0 表示关闭自动旋转 */
  private autoRotateSpeed: number;

  constructor(
    camera: PerspectiveCamera | EPerspectiveCamera,
    config: CameraTransformConfig = {},
  ) {
    this.camera = camera;
    this.initialDistance = config.initialDistance ?? 30;
    this.minDistance = config.minDistance ?? 10;
    this.maxDistance = config.maxDistance ?? 100;
    this.rotationSpeed = config.rotationSpeed ?? 0.002;
    this.zoomSpeed = config.zoomSpeed ?? 0.01;
    this.cameraDistance = this.initialDistance;
    this.theta = config.initialTheta ?? 0;
    this.phi = config.initialPhi ?? 0;
    this.onChange = config.onChange;
    this.autoRotateSpeed = config.autoRotateSpeed ?? 0;
    this.updateCameraPosition();
  }

  private updateCameraPosition() {
    const x = Math.sin(this.theta) * Math.cos(this.phi) * this.cameraDistance;
    const y = Math.sin(this.phi) * this.cameraDistance;
    const z = Math.cos(this.theta) * Math.cos(this.phi) * this.cameraDistance;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  private handleMouseDown = (event: MouseEvent) => {
    this.isDragging = true;
    this.previousMousePosition.set(event.clientX, event.clientY);
  };
  private handleMouseMove = (event: MouseEvent) => {
    if (!this.isDragging) return;
    const currentMousePosition = new Vector2(event.clientX, event.clientY);
    const mouseDelta = currentMousePosition
      .clone()
      .sub(this.previousMousePosition);
    this.previousMousePosition.copy(currentMousePosition);
    this.applyPointerDelta(mouseDelta.x, mouseDelta.y);
  };

  /**
   * 与鼠标拖拽相同的球坐标增量（像素位移 × rotationSpeed），并触发 onChange。
   * 用于程序化旋转或外部输入，无需先触发 mousedown。
   */
  applyPointerDelta(dx: number, dy: number) {
    this.theta -= dx * this.rotationSpeed;
    this.phi += dy * this.rotationSpeed;
    this.phi = Math.max(
      -Math.PI / 2 + 0.1,
      Math.min(Math.PI / 2 - 0.1, this.phi),
    );
    this.updateCameraPosition();
    this.onChange?.();
  }

  /**
   * 在动画循环中调用：按 autoRotateSpeed 绕目标水平旋转（仅改相机，不触发 onChange）。
   * 渲染应由同一帧里对 tick 的调用方执行，避免在 rAF 内再嵌套 onChange→节流 render 导致帧率不稳。
   * 拖拽时不会叠加自动旋转。
   */
  tick(deltaSeconds: number) {
    if (this.autoRotateSpeed === 0 || this.isDragging) return;
    const dt = Math.min(deltaSeconds, 0.25);
    this.theta -= this.autoRotateSpeed * dt;
    this.updateCameraPosition();
  }

  setAutoRotate(enabled: boolean, speedRadiansPerSecond = 0.4) {
    this.autoRotateSpeed = enabled ? speedRadiansPerSecond : 0;
  }

  getAutoRotateSpeed(): number {
    return this.autoRotateSpeed;
  }

  private handleMouseUp = () => {
    this.isDragging = false;
  };
  private handleMouseLeave = () => {
    this.isDragging = false;
  };
  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.cameraDistance = Math.max(
      this.minDistance,
      Math.min(
        this.maxDistance,
        this.cameraDistance - event.deltaY * this.zoomSpeed,
      ),
    );
    this.updateCameraPosition();
    this.onChange?.();
  };

  bindEvents(canvas: HTMLCanvasElement) {
    canvas.addEventListener("mousedown", this.handleMouseDown);
    canvas.addEventListener("mousemove", this.handleMouseMove);
    canvas.addEventListener("mouseup", this.handleMouseUp);
    canvas.addEventListener("mouseleave", this.handleMouseLeave);
    canvas.addEventListener("wheel", this.handleWheel);
  }
}
