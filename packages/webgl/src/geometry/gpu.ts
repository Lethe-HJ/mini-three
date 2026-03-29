// 这一层是 VBO IBO VAO
// 都是以函数形式存在，调用次数会比较多, 使用函数开销比class小

/** 创建并上传静态 `ARRAY_BUFFER`（VBO） */
export function createVbo(gl: WebGL2RenderingContext, data: ArrayBufferView): WebGLBuffer {
  const buf = gl.createBuffer();
  if (!buf) {
    throw new Error("createVbo: createBuffer failed");
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buf;
}

/** 释放用作 `ARRAY_BUFFER` 的 VBO（`deleteBuffer`） */
export function deleteVbo(gl: WebGL2RenderingContext, buffer: WebGLBuffer | null): void {
  gl.deleteBuffer(buffer);
}

/** 创建并上传静态 `ELEMENT_ARRAY_BUFFER`（IBO） */
export function createIbo(gl: WebGL2RenderingContext, data: ArrayBufferView): WebGLBuffer {
  const buf = gl.createBuffer();
  if (!buf) {
    throw new Error("createIbo: createBuffer failed");
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buf;
}

/** 释放用作 `ELEMENT_ARRAY_BUFFER` 的 IBO（底层同为 `deleteBuffer`） */
export function deleteIbo(gl: WebGL2RenderingContext, buffer: WebGLBuffer | null): void {
  gl.deleteBuffer(buffer);
}

/** 单路顶点属性：`location < 0` 时只绑定 buffer，不写 pointer（与常见 shader 变体兼容） */
export interface MeshVertexAttrib {
  buffer: WebGLBuffer;
  location: number;
  size: number;
  type: number;
  normalized?: boolean;
  stride?: number;
  offset?: number;
}

/**
 * 创建 VAO：按顺序绑定各 VBO 并配置 vertexAttribPointer，最后绑定 IBO。
 * 调用后当前 VAO 为 null（与内部实现解绑一致）。
 */
export function createVao(
  gl: WebGL2RenderingContext,
  attribs: MeshVertexAttrib[],
  indexBuffer: WebGLBuffer,
): WebGLVertexArrayObject {
  const vao = gl.createVertexArray();
  if (!vao) {
    throw new Error("createVao: createVertexArray failed");
  }
  gl.bindVertexArray(vao);
  for (const a of attribs) {
    gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
    if (a.location >= 0) {
      gl.vertexAttribPointer(
        a.location,
        a.size,
        a.type,
        a.normalized ?? false,
        a.stride ?? 0,
        a.offset ?? 0,
      );
      gl.enableVertexAttribArray(a.location);
    }
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bindVertexArray(null);
  return vao;
}

/** 释放 VAO（`deleteVertexArray`） */
export function deleteVao(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject | null): void {
  gl.deleteVertexArray(vao);
}
