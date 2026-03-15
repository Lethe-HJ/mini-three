import { PerspectiveCamera, Vector2 } from "three";

export interface CameraTransformConfig {
  initialDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  rotationSpeed?: number;
  zoomSpeed?: number;
}

export class CameraTransformController {
  private camera: PerspectiveCamera;
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

  constructor(camera: PerspectiveCamera, config: CameraTransformConfig = {}) {
    this.camera = camera;
    this.initialDistance = config.initialDistance ?? 30;
    this.minDistance = config.minDistance ?? 10;
    this.maxDistance = config.maxDistance ?? 100;
    this.rotationSpeed = config.rotationSpeed ?? 0.002;
    this.zoomSpeed = config.zoomSpeed ?? 0.01;
    this.cameraDistance = this.initialDistance;

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

    this.theta -= mouseDelta.x * this.rotationSpeed;
    this.phi += mouseDelta.y * this.rotationSpeed;

    this.phi = Math.max(
      -Math.PI / 2 + 0.1,
      Math.min(Math.PI / 2 - 0.1, this.phi),
    );

    this.previousMousePosition.copy(currentMousePosition);
    this.updateCameraPosition();
  };

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
  };

  bindEvents(canvas: HTMLCanvasElement) {
    canvas.addEventListener("mousedown", this.handleMouseDown);
    canvas.addEventListener("mousemove", this.handleMouseMove);
    canvas.addEventListener("mouseup", this.handleMouseUp);
    canvas.addEventListener("mouseleave", this.handleMouseLeave);
    canvas.addEventListener("wheel", this.handleWheel);
  }

  unbindEvents(canvas: HTMLCanvasElement) {
    canvas.removeEventListener("mousedown", this.handleMouseDown);
    canvas.removeEventListener("mousemove", this.handleMouseMove);
    canvas.removeEventListener("mouseup", this.handleMouseUp);
    canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    canvas.removeEventListener("wheel", this.handleWheel);
  }

  getCamera() {
    return this.camera;
  }

  reset() {
    this.cameraDistance = this.initialDistance;
    this.theta = 0;
    this.phi = 0;
    this.updateCameraPosition();
  }
}
