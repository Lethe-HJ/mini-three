// ============ 类型定义 ============
type Mat4 = number[] | Float32Array;
type Vec3 = [number, number, number];

interface ShaderSource {
  vertex: string;
  fragment: string;
}

interface CameraConfig {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fov: number;
  aspect: number;
  near: number;
  far: number;
}

interface AmbientLightConfig {
  color: string;
}

interface PointLightConfig {
  color: string;
  position: Vec3;
  attenuation: [number, number, number];
}

interface MaterialConfig {
  type: number;
  color: string;
  shininess?: number;
}

interface SceneObjectBase {
  name: string;
  attach?(gl: WebGLRenderingContext, program?: WebGLProgram): void;
}

interface MeshMatrixSet {
  mvp: { value: Mat4 | null; location: WebGLUniformLocation | null };
  model: { value: Mat4 | null; location: WebGLUniformLocation | null };
  normal: { value: Mat4 | null; location: WebGLUniformLocation | null };
  rotation: Mat4;
  translate: Mat4;
  scale: Mat4;
  localModel: Mat4;
}

interface Geometry {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint8Array;
  attach(gl: WebGLRenderingContext, program: WebGLProgram): void;
}

interface Material {
  shaderProgram: WebGLProgram;
  color: [number, number, number];
  attach(gl: WebGLRenderingContext): void;
}

interface Camera {
  matrix: { camera: Mat4; projection: Mat4; view: Mat4; vp: Mat4 };
  attach(gl: WebGLRenderingContext, program: WebGLProgram): void;
}

interface AmbientLight {
  name: "AmbientLight";
  color: [number, number, number];
  attach(gl: WebGLRenderingContext, program: WebGLProgram): void;
}

interface PointLight {
  name: "PointLight";
  position: Vec3;
  color: string;
  attenuation: [number, number, number];
  attach(gl: WebGLRenderingContext, program: WebGLProgram): void;
}

interface Mesh extends SceneObjectBase {
  name: "Mesh";
  geometry: Geometry;
  material: Material;
  parent: Group | null;
  matrixes: MeshMatrixSet;
  attach(gl: WebGLRenderingContext): void;
  updateModelMatrix(): void;
  updateMatrix(gl: WebGLRenderingContext, camera: Camera): void;
  setRotation(xDeg: number, yDeg: number, zDeg: number): void;
  setPosition(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
}

interface GroupMatrixSet {
  model: Mat4;
  localModel: Mat4;
  rotation: Mat4;
  translate: Mat4;
  scale: Mat4;
}

interface Group extends SceneObjectBase {
  name: "Group";
  matrixes: GroupMatrixSet;
  children: (Mesh | Group)[];
  parent: Group | null;
  add(object: Mesh | Group): void;
  updateModelMatrix(): void;
  setRotation(xDeg: number, yDeg: number, zDeg: number): void;
  setPosition(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
}

type SceneChild = Mesh | Group | AmbientLight | PointLight;

interface Scene {
  meshes: Mesh[];
  objects: SceneChild[];
  groups: Group[];
  children: SceneChild[];
  add(object: SceneChild): void;
}

// ============ Shaders ============
const noneShader: ShaderSource = {
  vertex: /*glsl */ `
      attribute vec4 a_position;
      uniform mat4 u_mvpMatrix;
      uniform vec3 u_materialColor;
  
      varying vec4 v_color;
  
      void main() {
        vec4 color = vec4(u_materialColor, 1.0); // 物体表面的颜色
        v_color = color;
        vec4 vertexPosition = u_mvpMatrix * a_position;
        gl_Position =  vertexPosition;
      }
    `,
  fragment: /*glsl */ `
      precision highp float;
      varying vec4 v_color; // 从顶点着色器传来的颜色值
      
      void main() {
          gl_FragColor = v_color;
      }
    `,
};

const lambertShader: ShaderSource = {
  vertex: /*glsl */ `
      precision lowp float;
  
      attribute vec4 a_position;
      attribute vec4 a_normal;
      uniform vec3 u_ambientLightColor;
      uniform vec3 u_materialColor;
      uniform mat4 u_mvpMatrix;
      uniform mat4 u_normalMatrix;
      uniform mat4 u_modelMatrix;
      
  
      varying vec4 v_color;
  
      struct Material {
        vec3 color;
        float shininess;
      };
  
      uniform Material u_material;
  
      struct PointLight {
        vec3 color; // 光源颜色
        vec3 position; // 光源位置
        float constant; // 光源常数衰减
        float linear; // 光源线性衰减
        float quadratic; // 光源二次衰减
      };
  
      uniform PointLight u_pointLight;
  
      void main() {
        vec4 color = vec4(u_material.color, 1.0); // 物体表面的颜色
        vec4 vertexPosition = u_mvpMatrix * a_position;
        vec4 worldPosition = u_modelMatrix * a_position; // 顶点的世界坐标
        vec3 lightDirection = normalize(u_pointLight.position - worldPosition.xyz); // 点光源的方向
        vec3 ambientColor = u_ambientLightColor * vec3(color); // 环境反射
        vec3 transformedNormal = normalize(vec3(u_normalMatrix * vec4(vec3(a_normal), 0.0)));
  
        //  计算衰减
        float dist = length(u_pointLight.position -  worldPosition.xyz);
        float attenuation = 1.0 / (u_pointLight.constant + u_pointLight.linear * dist + u_pointLight.quadratic * dist * dist);
  
        float dotDeg = max(dot(transformedNormal, lightDirection), 0.0); // 计算入射角 光线方向和法线方向的点积
        vec3 diffuseColor = u_pointLight.color * vec3(color) * dotDeg; // 漫反射光的颜色
        v_color = vec4(ambientColor + diffuseColor * attenuation, color.a);
        gl_Position =  vertexPosition;
      }
    `,
  fragment: /*glsl */ `
      precision lowp float;
  
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `,
};

const phongShader: ShaderSource = {
  vertex: /*glsl */ `
      precision highp float;
      precision mediump int;
  
      attribute vec4 a_position;
      attribute vec4 a_normal;
      uniform mat4 u_mvpMatrix;
      uniform mat4 u_normalMatrix;
      uniform mat4 u_modelMatrix;
      
      varying vec3 v_normal;
      varying vec3 v_fragPos; // 用于传递片元的世界坐标
  
      void main() {
        vec4 vertexPosition = u_mvpMatrix * a_position; // 顶点的世界坐标
        // 计算顶点的世界坐标并传递给片元着色器
        vec4 worldPosition = u_modelMatrix * a_position;
        v_fragPos = worldPosition.xyz;
        v_normal = normalize(vec3(u_normalMatrix * vec4(vec3(a_normal), 0.0)));
        gl_Position =  vertexPosition;
      }
    `,
  fragment: /*glsl */ `
      precision highp float;
      precision mediump int;
  
      varying vec3 v_normal; // 从顶点着色器传来的法线
      varying vec3 v_fragPos; // 从顶点着色器传来的片元位置
  
      uniform vec3 u_ambientLightColor; // 环境光颜色
      uniform vec3 u_cameraPosition; // 照相机位置 用来计算高光
      
      struct Material {
        vec3 color;
        float shininess;
      };
  
      uniform Material u_material;
  
      struct PointLight {
        vec3 color; // 光源颜色
        vec3 position; // 光源位置
        float constant; // 光源常数衰减
        float linear; // 光源线性衰减
        float quadratic; // 光源二次衰减
      };
  
      uniform PointLight u_pointLight;
      
      void main() {
  
        // 环境光
        vec3 ambient = u_ambientLightColor * vec3(u_material.color);
  
        // 漫反射光
        vec3 norm = normalize(v_normal);
        vec3 lightDir = normalize(u_pointLight.position - v_fragPos);
        float diff = max(dot(norm, lightDir), 0.0);
        vec3 diffuse = diff * u_pointLight.color;
  
        // 高光
        vec3 viewDir = normalize(u_cameraPosition - v_fragPos);
        vec3 reflectDir = reflect(-lightDir, norm);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_material.shininess); // 32是高光系数，可调整
        vec3 shininess = u_pointLight.color * spec;
    
        // 计算衰减
        float dist = length(u_pointLight.position - v_fragPos);
        float attenuation = 1.0 / (u_pointLight.constant + u_pointLight.linear * dist + u_pointLight.quadratic * dist * dist);
        
        vec3 result = (ambient + (diffuse + shininess) * attenuation) * vec3(u_material.color);
        gl_FragColor = vec4(result, 1.0);
      }
    `,
};

const MaterialType: { None: number; Lambert: number; Phong: number } = {
  None: 0,
  Lambert: 1,
  Phong: 2,
};

const AbstractName: { Mesh: "Mesh"; Group: "Group" } = {
  Mesh: "Mesh",
  Group: "Group",
};

const shadersMap: Record<number, ShaderSource> = {
  [MaterialType.None]: noneShader,
  [MaterialType.Lambert]: lambertShader,
  [MaterialType.Phong]: phongShader,
};

const m4 = {
  identity() {
    // prettier-ignore
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ])
  },
  perspective(fieldOfViewInRadians: number, aspect: number, near: number, far: number): number[] {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    const rangeInv = 1.0 / (near - far);
    // prettier-ignore
    return [
        f / aspect, 0, 0,                         0,
        0,          f, 0,                         0,
        0,          0, (near + far) * rangeInv,   -1,
        0,          0, near * far * rangeInv * 2, 0
      ];
  },

  projection(width: number, height: number, depth: number): number[] {
    // Note: This matrix flips the Y axis so 0 is at the top.
    // prettier-ignore
    return [
        2 / width,  0,            0,          0,
        0,          -2 / height,  0,          0,
        0,          0,            2 / depth,  0,
        -1,         1,            0,          1, 
      ];
  },

  translation(tx: number, ty: number, tz: number): number[] {
    // prettier-ignore
    return [
        1,  0,  0,  0,
        0,  1,  0,  0,
        0,  0,  1,  0,
        tx, ty, tz, 1,
      ];
  },

  xRotation(angleInRadians: number): number[] {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1,
      ];
  },

  yRotation(angleInRadians: number): number[] {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1,
      ];
  },

  zRotation(angleInRadians: number): Float32Array {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    // prettier-ignore
    return new Float32Array([
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ]);
  },

  scaling(sx: number, sy: number, sz: number): number[] {
    // prettier-ignore
    return [
        sx, 0,  0,  0,
        0, sy,  0,  0,
        0,  0, sz,  0,
        0,  0,  0,  1,
      ];
  },

  translate(m: Mat4, tx: number, ty: number, tz: number): number[] | Float32Array {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate(m: Mat4, angleInRadians: number): number[] | Float32Array {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate(m: Mat4, angleInRadians: number): number[] | Float32Array {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate(m: Mat4, angleInRadians: number): number[] | Float32Array {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale(m: Mat4, sx: number, sy: number, sz: number): number[] | Float32Array {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },

  inverse(m: Mat4): number[] {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp_0 = m22 * m33;
    const tmp_1 = m32 * m23;
    const tmp_2 = m12 * m33;
    const tmp_3 = m32 * m13;
    const tmp_4 = m12 * m23;
    const tmp_5 = m22 * m13;
    const tmp_6 = m02 * m33;
    const tmp_7 = m32 * m03;
    const tmp_8 = m02 * m23;
    const tmp_9 = m22 * m03;
    const tmp_10 = m02 * m13;
    const tmp_11 = m12 * m03;
    const tmp_12 = m20 * m31;
    const tmp_13 = m30 * m21;
    const tmp_14 = m10 * m31;
    const tmp_15 = m30 * m11;
    const tmp_16 = m10 * m21;
    const tmp_17 = m20 * m11;
    const tmp_18 = m00 * m31;
    const tmp_19 = m30 * m01;
    const tmp_20 = m00 * m21;
    const tmp_21 = m20 * m01;
    const tmp_22 = m00 * m11;
    const tmp_23 = m10 * m01;

    const t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    const t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    const t2 =
      tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    const t3 =
      tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    // prettier-ignore
    return [
          d * t0,
          d * t1,
          d * t2,
          d * t3,
          d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
              (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
          d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
              (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
          d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
              (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
          d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
              (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
          d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
              (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
          d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
              (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
          d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
              (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
          d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
              (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
          d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
              (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
          d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
              (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
          d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
              (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
          d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
              (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
        ];
  },

  // prettier-ignore
  transpose(m: Mat4): number[] {
        return [
          m[0], m[4], m[8], m[12],
          m[1], m[5], m[9], m[13],
          m[2], m[6], m[10], m[14],
          m[3], m[7], m[11], m[15],
        ];
      },

  lookAt(cameraPosition: Vec3, target: Vec3, up: Vec3): number[] {
    const zAxis = v3.normalize(v3.subtractVectors(cameraPosition, target));
    const xAxis = v3.normalize(v3.cross(up, zAxis));
    const yAxis = v3.normalize(v3.cross(zAxis, xAxis));
    // prettier-ignore
    return [
          xAxis[0],       xAxis[1],      xAxis[2],        0,
          yAxis[0],       yAxis[1],      yAxis[2],        0,
          zAxis[0],       zAxis[1],      zAxis[2],        0,
          cameraPosition[0], cameraPosition[1], cameraPosition[2], 1,
        ];
  },

  multiply(a: Mat4, b: Mat4): number[] {
    const a00 = a[0 * 4 + 0];
    const a01 = a[0 * 4 + 1];
    const a02 = a[0 * 4 + 2];
    const a03 = a[0 * 4 + 3];
    const a10 = a[1 * 4 + 0];
    const a11 = a[1 * 4 + 1];
    const a12 = a[1 * 4 + 2];
    const a13 = a[1 * 4 + 3];
    const a20 = a[2 * 4 + 0];
    const a21 = a[2 * 4 + 1];
    const a22 = a[2 * 4 + 2];
    const a23 = a[2 * 4 + 3];
    const a30 = a[3 * 4 + 0];
    const a31 = a[3 * 4 + 1];
    const a32 = a[3 * 4 + 2];
    const a33 = a[3 * 4 + 3];
    const b00 = b[0 * 4 + 0];
    const b01 = b[0 * 4 + 1];
    const b02 = b[0 * 4 + 2];
    const b03 = b[0 * 4 + 3];
    const b10 = b[1 * 4 + 0];
    const b11 = b[1 * 4 + 1];
    const b12 = b[1 * 4 + 2];
    const b13 = b[1 * 4 + 3];
    const b20 = b[2 * 4 + 0];
    const b21 = b[2 * 4 + 1];
    const b22 = b[2 * 4 + 2];
    const b23 = b[2 * 4 + 3];
    const b30 = b[3 * 4 + 0];
    const b31 = b[3 * 4 + 1];
    const b32 = b[3 * 4 + 2];
    const b33 = b[3 * 4 + 3];
    // prettier-ignore
    return [
          b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
          b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
          b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
          b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
          b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
          b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
          b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
          b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
          b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
          b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
          b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
          b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
          b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
          b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
          b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
          b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
  },

  multiplySeries(...matrices: Mat4[]): number[] | Float32Array {
    if (matrices.length < 2) {
      throw new Error("Need at least two matrices to multiply");
    }

    let result = matrices[0];

    for (let i = 1; i < matrices.length; i++) {
      result = this.multiply(result, matrices[i]);
    }

    return result;
  },
};

const v3 = {
  vectorMultiply(v: number[], m: Mat4): number[] {
    const dst: number[] = [];
    for (let i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (let j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  },

  cross(a: Vec3, b: Vec3): Vec3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  },
  subtractVectors(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },
  normalize(v: Vec3): Vec3 {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // 确定不会除以 0
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  },
};

const color = {
  hexToRgbNormalized(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  },
};

function createScene(): Scene {
  return {
    meshes: [] as Mesh[],
    objects: [] as SceneChild[],
    groups: [] as Group[],
    children: [] as SceneChild[],
    add(object: SceneChild) {
      this.children.push(object); // 总是添加到 children 中

      if (object.name === AbstractName.Mesh) {
        this.meshes.push(object as Mesh); // 添加 mesh 到 meshes 数组
      } else if (object.name === AbstractName.Group) {
        this.groups.push(object as Group); // 仅添加顶级 group 到 groups 数组
        // 递归添加组内的所有 mesh 到 meshes 数组
        (object as Group).children.forEach((child: Mesh | Group) => {
          if (child.name === AbstractName.Mesh) {
            this.meshes.push(child as Mesh);
          } else if (child.name === AbstractName.Group) {
            // 如果组内还有子组，则递归处理
            this.add(child);
          }
        });
      } else {
        this.objects.push(object);
      }
    },
  };
}

function createCamera(config: CameraConfig): Camera & CameraConfig {
  const { position, target, up, fov, aspect, near, far } = config;

  const cameraMatrix = m4.lookAt(position, target, up);
  const viewMatrix = m4.inverse(cameraMatrix);

  const projectionMatrix = m4.perspective(fov, aspect, near, far);

  const vpMatrix = m4.multiply(projectionMatrix, viewMatrix);

  return {
    ...config,
    matrix: {
      camera: cameraMatrix,
      projection: projectionMatrix,
      view: viewMatrix,
      vp: vpMatrix,
    },
    attach(gl: WebGLRenderingContext, program: WebGLProgram) {
      gl.useProgram(program);
      const loc = gl.getUniformLocation(program, "u_cameraPosition");
      if (loc) gl.uniform3fv(loc, position);
    },
  };
}

function createAmbientLight(config: AmbientLightConfig): AmbientLight {
  const _color = color.hexToRgbNormalized(config.color);
  return {
    name: "AmbientLight",
    color: _color,
    attach(gl: WebGLRenderingContext, program: WebGLProgram) {
      const loc = gl.getUniformLocation(program, "u_ambientLightColor");
      if (loc) gl.uniform3fv(loc, _color);
    },
  };
}

function createPointLight(pointLight: PointLightConfig): PointLight {
  const _color = color.hexToRgbNormalized(pointLight.color);
  return {
    ...pointLight,
    name: "PointLight",
    attach(gl: WebGLRenderingContext, program: WebGLProgram) {
      const locPos = gl.getUniformLocation(program, "u_pointLight.position");
      const locColor = gl.getUniformLocation(program, "u_pointLight.color");
      const locC = gl.getUniformLocation(program, "u_pointLight.constant");
      const locL = gl.getUniformLocation(program, "u_pointLight.linear");
      const locQ = gl.getUniformLocation(program, "u_pointLight.quadratic");
      if (locPos) gl.uniform3fv(locPos, pointLight.position);
      if (locColor) gl.uniform3fv(locColor, _color);
      if (locC) gl.uniform1f(locC, pointLight.attenuation[0]);
      if (locL) gl.uniform1f(locL, pointLight.attenuation[1]);
      if (locQ) gl.uniform1f(locQ, pointLight.attenuation[2]);
    },
  };
}

function createGeometry(
  vertices: Float32Array,
  normals: Float32Array,
  indices: Uint8Array,
): Geometry {
  return {
    vertices,
    normals,
    indices,
    attach(gl: WebGLRenderingContext, program: WebGLProgram) {
      const a_positionLocation = gl.getAttribLocation(program, "a_position");
      const vertices_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertices_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_positionLocation);

      const a_normalLocation = gl.getAttribLocation(program, "a_normal");
      const normal_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_normalLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_normalLocation);

      const indices_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    },
  };
}

function createMaterial(config: MaterialConfig, gl: WebGLRenderingContext): Material {
  const { vertex, fragment } = shadersMap[config.type];
  const shaderProgram = createShaderProgram(gl, vertex, fragment);
  if (!shaderProgram) throw new Error("Failed to create shader program");
  const _color = color.hexToRgbNormalized(config.color);
  return {
    shaderProgram,
    color: _color,
    attach(gl: WebGLRenderingContext) {
      gl.useProgram(shaderProgram);
      const locColor = gl.getUniformLocation(shaderProgram, "u_material.color");
      if (locColor) gl.uniform3fv(locColor, _color);
      if (config.type === MaterialType.Phong && config.shininess != null) {
        const locShininess = gl.getUniformLocation(shaderProgram, "u_material.shininess");
        if (locShininess) gl.uniform1f(locShininess, config.shininess);
      }
    },
  };
}

function createShaderProgram(
  gl: WebGLRenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string,
): WebGLProgram | null | undefined {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) return undefined;

  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.shaderSource(fragmentShader, fragmentShaderSource);

  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error("ERROR compiling vertex shader!", gl.getShaderInfoLog(vertexShader));
    return undefined;
  }

  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error("ERROR compiling fragment shader!", gl.getShaderInfoLog(fragmentShader));
    return undefined;
  }

  const shaderProgram = gl.createProgram();
  if (!shaderProgram) return null;
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);

  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("ERROR linking program!", gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;
}

function createMesh(geometry: Geometry, material: Material): Mesh {
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
    name: AbstractName.Mesh,
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

function createGroup(): Group {
  const matrixes: GroupMatrixSet = {
    model: m4.identity(),
    localModel: m4.identity(),
    rotation: m4.identity(),
    translate: m4.identity(),
    scale: m4.identity(),
  };
  const group: Group = {
    name: AbstractName.Group,
    matrixes,
    children: [],
    parent: null,
    add(object: Mesh | Group) {
      this.children.push(object);
      object.parent = this;
    },
    updateModelMatrix() {
      const parentModel = group.parent ? group.parent.matrixes.model : null;
      matrixes.localModel = m4.multiplySeries(
        matrixes.translate,
        matrixes.rotation,
        matrixes.scale,
      );
      matrixes.model = parentModel
        ? m4.multiply(parentModel, matrixes.localModel)
        : matrixes.localModel;
      group.children.forEach((child) => child.updateModelMatrix());
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
  return group;
}

interface Renderer {
  render(scene: Scene, camera: Camera): void;
}

function createRenderer(gl: WebGLRenderingContext): Renderer {
  gl.enable(gl.DEPTH_TEST);
  return {
    render(scene: Scene, camera: Camera) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.children.forEach((object: SceneChild) => {
        if (object.name === AbstractName.Mesh) (object as Mesh).updateModelMatrix();
        else if (object.name === AbstractName.Group) (object as Group).updateModelMatrix();
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

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas element not found");
const gl = canvas.getContext("webgl");
if (!gl) throw new Error("WebGL not supported");

const scene = createScene();

const ambient_light = createAmbientLight({
  color: "#494949",
}); // 定义环境光 实际上就是一些uniform 待传入到着色器
scene.add(ambient_light);

const point_light = createPointLight({
  color: "#ffffff",
  position: [2.0, 6.0, 2.0],
  attenuation: [0.5, 0.01, 0.032],
}); // 定义点光源  实际上就是一些uniform 待传入到着色器中
scene.add(point_light);

const camera = createCamera({
  position: [1, 1, 10],
  target: [1.0, 0.0, 0.0],
  up: [0.0, 1.0, 0.0],
  fov: 90 * (Math.PI / 360),
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 20,
}); // 定义相机 实际上就是视图矩阵和投影矩阵

// 物体位置
const vertices = new Float32Array([
  // 0123
  1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
  // 0345
  1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,
  // 0156
  1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1,
  // 1267
  -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1,
  // 2347
  -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1,
  // 4567
  1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1,
]);

// 法向量
const normals = new Float32Array([
  // 0123
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  // 0345
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  // 0156
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  // 1267
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  // 2347
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  // 4567
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
]);

// 面
const indices = new Uint8Array([
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16,
  18, 19, 20, 21, 22, 20, 22, 23,
]);

const geometry = createGeometry(vertices, normals, indices); // 定义物体 实际上就是待传入到着色器中的点数据面数据

const material1 = createMaterial(
  {
    type: MaterialType.Phong,
    color: "#00FF00",
    shininess: 100.0,
  },
  gl,
); // 定义材质 实际上就是着色器

const mesh1 = createMesh(geometry, material1); // Mesh的实质就是将几何体和材质绑定成一组 用材质指定的着色器 绘制一次这个几何体
mesh1.setPosition(-2, 0, 0);
mesh1.setScale(1.5, 1.5, 1.5);
scene.add(mesh1);

const material2 = createMaterial(
  {
    type: MaterialType.Lambert,
    color: "#00FF00",
  },
  gl,
);
const mesh2 = createMesh(geometry, material2);
const group = createGroup();
group.add(mesh2);
group.setPosition(4, 0, 0);
group.setScale(1.5, 1.5, 1.5);
scene.add(group);

const renderer = createRenderer(gl);

let deg = 1;
function animate() {
  deg += 0.005;
  if (deg > 20) deg = 0;
  mesh1.setRotation(deg, 2 * deg, 3 * deg);
  mesh2.setRotation(deg, 2 * deg, 3 * deg);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
