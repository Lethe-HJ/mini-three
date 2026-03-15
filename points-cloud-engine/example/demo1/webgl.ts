// ============ 类型定义 ============

import {
  createCamera,
  createGeometry,
  createGroup,
  createAmbientLight,
  createPointLight,
  createMaterial,
  MaterialType,
  createMesh,
  createRenderer,
  createScene,
} from "points-cloud-engine";
import Stats from "stats.js";

// 获取 canvas 元素
const canvas = document.getElementById("canvas1") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas element not found");

// 设置 canvas 尺寸
const width = 600;
const height = 300;
const dpr = window.devicePixelRatio || 1;

canvas.width = width * dpr;
canvas.height = height * dpr;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;

const gl = canvas.getContext("webgl");
if (!gl) throw new Error("WebGL not supported");

// 设置 viewport
gl.viewport(0, 0, canvas.width, canvas.height);

const scene = createScene();

const ambient_light = createAmbientLight({
  color: "#494949",
}); // 定义环境光 实际上就是一些uniform 待传入到着色器
scene.add(ambient_light);

// 以 Three.js 为标准：PointLight intensity=2, distance=0, decay=0（无距离衰减）
// 对应 WebGL：attenuation [1,0,0] 使 attenuation=1，intensity=2
const point_light = createPointLight({
  color: "#ffffff",
  position: [2.0, 6.0, 2.0],
  attenuation: [1, 0, 0],
  intensity: 2,
});
scene.add(point_light);

const camera = createCamera({
  position: [1, 1, 10],
  target: [1.0, 0.0, 0.0],
  up: [0.0, 1.0, 0.0],
  fov: 90 * (Math.PI / 360),
  aspect: width / height,
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
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
  15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
]);

const geometry = createGeometry(vertices, normals, indices); // 定义物体 实际上就是待传入到着色器中的点数据面数据

// 与 Three.js 一致：Phong 绿、高光白、shininess 100
const material1 = createMaterial(
  {
    type: MaterialType.Phong,
    color: "#00FF00",
    specular: "#ffffff",
    shininess: 100.0,
  },
  gl,
);

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

// 性能监控
const stats = new Stats();
document.body.appendChild(stats.dom);

let deg = 1;
function animate() {
  stats.begin();
  deg += 0.005;
  if (deg > 20) deg = 0;
  mesh1.setRotation(deg, 2 * deg, 3 * deg);
  mesh2.setRotation(deg, 2 * deg, 3 * deg);
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}
animate();
