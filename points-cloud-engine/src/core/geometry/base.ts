export class Geometry {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint8Array;

  constructor(vertices: Float32Array, normals: Float32Array, indices: Uint8Array) {
    this.vertices = vertices;
    this.normals = normals;
    this.indices = indices;
  }

  attach(gl: WebGLRenderingContext, program: WebGLProgram): void {
    const a_positionLocation = gl.getAttribLocation(program, "a_position");
    const vertices_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_positionLocation);

    const a_normalLocation = gl.getAttribLocation(program, "a_normal");
    const normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_normalLocation);

    const indices_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
  }
}
