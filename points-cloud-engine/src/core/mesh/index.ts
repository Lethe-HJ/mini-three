import type { Geometry } from "../geometry/type";
import type { Mesh, MeshMatrixSet } from "./type";
import type { Material } from "../material/type";
import type { Group } from "../group/type";
import type { Camera } from "../camera/type";
import { m4, type Mat4 } from "../common/math/matrix/matrix4";
import { ObjectType } from "../common/object/type";

export function createMesh(geometry: Geometry, material: Material): Mesh {
  const matrixes: MeshMatrixSet = {
    mvp: { value: null, location: null },
    model: { value: null, location: null },
    normal: { value: null, location: null },
    rotation: m4.identity(),
    translate: m4.identity(),
    scale: m4.identity(),
    localModel: m4.identity(),
  };
  const mesh: Mesh = {
    name: ObjectType.Mesh,
    geometry,
    material,
    parent: null,
    matrixes,
    attach(gl: WebGLRenderingContext) {
      material.attach(gl);
      const program = this.material.shaderProgram;
      gl.useProgram(program);
      matrixes.mvp.location = gl.getUniformLocation(program, "u_mvpMatrix");
      matrixes.model.location = gl.getUniformLocation(program, "u_modelMatrix");
      matrixes.normal.location = gl.getUniformLocation(program, "u_normalMatrix");
      geometry.attach(gl, program);
    },
    updateModelMatrix() {
      const parentModel = mesh.parent ? (mesh.parent as Group).matrixes.model : null;
      matrixes.localModel = m4.multiplySeries(
        matrixes.translate,
        matrixes.rotation,
        matrixes.scale,
      );
      matrixes.model.value = parentModel
        ? m4.multiply(parentModel, matrixes.localModel)
        : matrixes.localModel;
    },
    updateMatrix(gl: WebGLRenderingContext, camera: Camera) {
      const modelMatrix = matrixes.model.value!;
      const mvpMatrix = m4.multiply(camera.matrix.vp, modelMatrix);
      matrixes.mvp.value = mvpMatrix;
      const normalMatrix = m4.transpose(m4.inverse(modelMatrix));
      matrixes.normal.value = normalMatrix;
      const toF32 = (m: Mat4) => (m instanceof Float32Array ? m : new Float32Array(m));
      if (matrixes.model.location)
        gl.uniformMatrix4fv(matrixes.model.location, false, toF32(modelMatrix));
      if (matrixes.mvp.location)
        gl.uniformMatrix4fv(matrixes.mvp.location, false, toF32(mvpMatrix));
      if (matrixes.normal.location)
        gl.uniformMatrix4fv(matrixes.normal.location, false, toF32(normalMatrix));
    },
    setRotation(xDeg: number, yDeg: number, zDeg: number) {
      matrixes.rotation = m4.multiplySeries(
        m4.identity(),
        m4.xRotation(xDeg),
        m4.yRotation(yDeg),
        m4.zRotation(zDeg),
      );
    },
    setPosition(x: number, y: number, z: number) {
      matrixes.translate = m4.multiplySeries(m4.identity(), m4.translation(x, y, z));
    },
    setScale(x: number, y: number, z: number) {
      matrixes.scale = m4.multiplySeries(m4.identity(), m4.scaling(x, y, z));
    },
  };
  return mesh;
}
