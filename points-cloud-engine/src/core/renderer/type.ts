import type { Camera } from "../camera/type";
import type { Scene } from "../scene/type";

interface RendererConfig {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
}

export class Renderer {
  private gl: WebGLRenderingContext;

  constructor(config: RendererConfig | WebGLRenderingContext) {
    let gl: WebGLRenderingContext | null = null;
    if (config instanceof WebGLRenderingContext) {
      gl = config;
    } else {
      const canvas = config.canvas;
      if (!canvas) {
        throw new Error("Canvas is required");
      }
      gl = canvas.getContext("webgl");
      if (!gl) {
        throw new Error("WebGL not supported");
      }
    }
    this.gl = gl;
    this.gl.enable(gl.DEPTH_TEST);
    this.gl.clearColor(1, 1, 1, 1); // 与 Three.js scene.background 白色一致
  }

  setSize(width: number, height: number): void {
    this.gl.viewport(0, 0, width, height);
  }

  setPixelRatio(_ratio: number): void {
    // 这里可以添加像素比的处理逻辑
  }

  setClearColor(color: [number, number, number, number]): void {
    this.gl.clearColor(color[0], color[1], color[2], color[3]);
  }

  render(scene: Scene, camera: Camera): void {
    const gl = this.gl;
    // 如果场景有背景色，使用场景的背景色
    if (scene.background) {
      gl.clearColor(scene.background[0], scene.background[1], scene.background[2], 1);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    scene.children.forEach((object) => {
      if (object.name === "Mesh") {
        object.updateModelMatrix();
      } else if (object.name === "Group") {
        object.updateModelMatrix();
      }
    });
    scene.meshes.forEach((mesh) => {
      mesh.attach(gl);
      const shaderProgram = mesh.material.shaderProgram;
      gl.useProgram(shaderProgram);
      mesh.updateMatrix(gl, camera);
      scene.objects.forEach((obj) => {
        if ("attach" in obj && typeof obj.attach === "function") {
          obj.attach(gl, shaderProgram);
        }
      });
      camera.attach(gl, shaderProgram);
      gl.drawElements(gl.TRIANGLES, mesh.geometry.indices.length, gl.UNSIGNED_BYTE, 0);
    });
  }
}
