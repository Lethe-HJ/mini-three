// ============ 类型定义 ============

import {
  Camera,
  BoxGeometry,
  Group,
  AmbientLight,
  PointLight,
  Material,
  MaterialType,
  Mesh,
  Renderer,
  Scene,
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

const scene = new Scene();
scene.setBackground([1, 1, 1]); // 设置背景色为白色，与 threejs 一致

// 环境光 #494949
const ambient_light = new AmbientLight("#494949");
scene.add(ambient_light);

// 点光 #ffffff position(2,6,2) intensity=2 distance=0 decay=0
const point_light = new PointLight("#ffffff", 2, 0, 0);
point_light.setPosition(2.0, 6.0, 2.0);
scene.add(point_light);

// 与 threejs 一致：fov 45°, aspect 600/300=2, near 0.1, far 20
const camera = new Camera(45 * (Math.PI / 180), width / height, 0.1, 20);
camera.setPosition(1, 1, 10);
camera.lookAt(1, 0, 0);
camera.setUp(0, 1, 0);

// 创建立方体几何体（与 threejs 一致：中心在原点、边长 2 的立方体）
const geometry = new BoxGeometry(2, 2, 2);

// 与 Three.js 一致：Phong 绿、高光白、shininess 100
const material1 = new Material(
  {
    type: MaterialType.Phong,
    color: "#00FF00",
    specular: "#ffffff",
    shininess: 100.0,
  },
  canvas.getContext("webgl")!,
);

const mesh1 = new Mesh(geometry, material1); // Mesh的实质就是将几何体和材质绑定成一组 用材质指定的着色器 绘制一次这个几何体
mesh1.setPosition(-2, 0, 0).setScale(1.5, 1.5, 1.5);
scene.add(mesh1);

const material2 = new Material(
  {
    type: MaterialType.Lambert,
    color: "#00FF00",
  },
  canvas.getContext("webgl")!,
);
const mesh2 = new Mesh(geometry, material2);
const group = new Group();
group.add(mesh2).setPosition(4, 0, 0).setScale(1.5, 1.5, 1.5);
scene.add(group);

const renderer = new Renderer({ canvas, antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(dpr);

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
