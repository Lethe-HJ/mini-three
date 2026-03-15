import type { Camera } from "../camera/type";
import type { Mesh } from "../mesh/type";
import type { Group } from "../group/type";
import type { SceneChild } from "../scene/type";
import type { Scene } from "../scene/type";
import { ObjectType } from "../common/object/type";
import type { Renderer } from "./type";

export function createRenderer(gl: WebGLRenderingContext): Renderer {
  gl.enable(gl.DEPTH_TEST);
  // 这个应该在scene初始化时设置
  gl.clearColor(1, 1, 1, 1); // 与 Three.js scene.background 白色一致
  return {
    render(scene: Scene, camera: Camera) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.children.forEach((object: SceneChild) => {
        if (object.name === ObjectType.Mesh) (object as Mesh).updateModelMatrix();
        else if (object.name === ObjectType.Group) (object as Group).updateModelMatrix();
      });
      scene.meshes.forEach((mesh: Mesh) => {
        mesh.attach(gl);
        const shaderProgram = mesh.material.shaderProgram;
        gl.useProgram(shaderProgram);
        mesh.updateMatrix(gl, camera);
        scene.objects.forEach((obj) => obj.attach && obj.attach(gl, shaderProgram));
        camera.attach(gl, shaderProgram);
        gl.drawElements(gl.TRIANGLES, mesh.geometry.indices.length, gl.UNSIGNED_BYTE, 0);
      });
    },
  };
}
