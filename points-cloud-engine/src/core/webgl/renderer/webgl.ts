import type { Camera } from "../camera/type";
import { Color } from "../common/color/color";
import type { Scene } from "../scene/type";
import type { RendererConfig } from "./type";
import type { Mesh } from "../mesh/type";
import type { Group } from "../group/type";

export class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private pixelRatio: number = 1;

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

  setPixelRatio(ratio: number): void {
    // 存储像素比
    this.pixelRatio = Math.max(1, ratio);

    // 尝试获取画布并更新其大小
    const canvas = this.gl.canvas as HTMLCanvasElement;
    if (canvas) {
      // 获取当前画布的CSS大小
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;

      // 根据像素比更新画布的实际大小
      canvas.width = Math.floor(cssWidth * this.pixelRatio);
      canvas.height = Math.floor(cssHeight * this.pixelRatio);

      // 更新视口
      this.gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  setClearColor(color: number): void {
    const _color = Color.fromNumber(color);
    const colorArray = _color.toNormalizedArray();
    this.gl.clearColor(colorArray[0], colorArray[1], colorArray[2], 1);
  }

  render(scene: Scene, camera: Camera): void {
    const gl = this.gl;
    // 如果场景有背景色，使用场景的背景色
    if (scene.background) {
      const colorArray = scene.background.toArray();
      gl.clearColor(colorArray[0], colorArray[1], colorArray[2], 1);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 动态收集所有 mesh
    const meshes: Mesh[] = [];
    const collectMeshes = (obj: Mesh | Group) => {
      if (obj.name === "Mesh") {
        meshes.push(obj as Mesh);
        (obj as Mesh).updateModelMatrix();
      } else if (obj.name === "Group") {
        (obj as Group).updateModelMatrix();
        (obj as Group).children.forEach(collectMeshes);
      }
    };

    scene.children.forEach((object) => {
      collectMeshes(object as Mesh | Group);
    });

    meshes.forEach((mesh) => {
      mesh.attach(gl);
      const shaderProgram = mesh.material.getShaderProgram();
      if (!shaderProgram) throw new Error("ShaderProgram is not attached");
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
