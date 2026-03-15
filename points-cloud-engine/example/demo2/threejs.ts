/**
 * js 场景（标准参考），渲染到 #canvas2。
 * WebGL (core) 以本配置为准，保持相机/光照/材质参数一致以便对比效果。
 * - 相机：position(30,30,30) lookAt(0,0,0) fov 60° aspect 2 near 0.1 far 1000
 * - 背景白；环境光 #494949；点光 #fff position(50,50,50) intensity=1.5 distance=0 decay=0
 * - 立方体：1000个 Phong 材质，随机颜色，分布在 20x20x20 空间内
 * - 动画：每个立方体独立旋转
 */

import {
  PerspectiveCamera,
  Scene,
  AmbientLight,
  PointLight,
  BoxGeometry,
  MeshPhongMaterial,
  WebGLRenderer,
  Color,
  Mesh,
  Vector2,
  Group,
} from "three";
import Stats from "stats.js";

// 获取 canvas 元素
const canvas = document.getElementById("canvas2") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas #canvas2 not found");

// 设置 canvas 尺寸
const width = 600;
const height = 300;
const dpr = window.devicePixelRatio || 1;

canvas.width = width * dpr;
canvas.height = height * dpr;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;

// 鼠标交互控制 - 提前声明变量
let isDragging = false;
let previousMousePosition = new Vector2();
let cameraDistance = 30;
let theta = 0; // 方位角 (绕 y 轴)
let phi = 0; // 极角 (绕 x 轴)

// 防抖定时器

// 调整相机位置以适应更大的场景
const camera = new PerspectiveCamera(60, width / height, 0.1, 1000);
camera.up.set(0, 1, 0);

// 初始化相机位置
updateCameraPosition();

const scene = new Scene();
scene.background = new Color(0xffffffff);

// 环境光 #494949
const ambient = new AmbientLight(0x494949);
scene.add(ambient);

// 点光源位置调整到场景中心上方，照亮整个区域
const pointLight = new PointLight(0xffffff, 1.5, 0, 0);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);

// 创建立方体几何体
const boxGeometry = new BoxGeometry(1, 1, 1);

const group = new Group();
scene.add(group);
// 创建1000个立方体
const meshes: Mesh[] = [];
const count = 1000;
const spread = 20; // 分布范围

for (let i = 0; i < count; i++) {
  // 随机颜色
  const color = new Color().setHSL(Math.random(), 0.7, 0.5);
  const material = new MeshPhongMaterial({
    color: color,
    specular: 0xffffff,
    shininess: 30,
  });

  const mesh = new Mesh(boxGeometry, material);
  group.add(mesh);

  // 随机位置，分布在 -10 到 10 的空间内
  mesh.position.set(
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread,
  );

  // 随机初始旋转
  mesh.rotation.set(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
  );

  // 随机缩放 (0.5 到 1.5)
  const scale = 0.5 + Math.random();
  mesh.scale.setScalar(scale);

  meshes.push(mesh);
}

const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(dpr);
renderer.setClearColor(0x000000);

// 性能监控
const stats = new Stats();
document.body.appendChild(stats.dom);

// 更新相机位置函数
function updateCameraPosition() {
  // 基于球坐标系计算相机位置
  const x = Math.sin(theta) * Math.cos(phi) * cameraDistance;
  const y = Math.sin(phi) * cameraDistance;
  const z = Math.cos(theta) * Math.cos(phi) * cameraDistance;

  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);
}

// 鼠标交互控制

// 鼠标按下事件
canvas.addEventListener("mousedown", (event) => {
  isDragging = true;
  previousMousePosition.set(event.clientX, event.clientY);
});

// 鼠标移动事件
canvas.addEventListener("mousemove", (event) => {
  if (!isDragging) return;

  const currentMousePosition = new Vector2(event.clientX, event.clientY);

  const mouseDelta = currentMousePosition.clone().sub(previousMousePosition);

  // 调整旋转速度，使拖动更直观
  const rotationSpeed = 0.002;

  // 更新球坐标系的角度（调整方向使其符合直觉）
  theta -= mouseDelta.x * rotationSpeed;
  phi += mouseDelta.y * rotationSpeed;

  // 限制极角范围，避免过度旋转
  phi = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, phi));

  previousMousePosition.copy(currentMousePosition);

  // 实时更新相机位置
  updateCameraPosition();
});

// 鼠标释放事件
canvas.addEventListener("mouseup", () => {
  isDragging = false;
});

// 鼠标离开事件
canvas.addEventListener("mouseleave", () => {
  isDragging = false;
});

// 鼠标滚轮事件 - 缩放
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();

  // 缩放速度
  const zoomSpeed = 0.01; // 调整缩放速度，使缩放更直观
  cameraDistance = Math.max(
    10,
    Math.min(100, cameraDistance - event.deltaY * zoomSpeed),
  );

  // 实时更新相机位置
  updateCameraPosition();
});

// 动画：每个立方体以不同速度旋转
function animate() {
  stats.begin();

  // meshes.forEach((mesh, index) => {
  //   // 每个立方体有不同的旋转速度
  //   const speed = 0.5 + (index % 5) * 0.01;
  //   mesh.rotation.x += 0.01 * speed;
  //   mesh.rotation.y += 0.02 * speed;
  //   mesh.rotation.z += 0.005 * speed;
  // });

  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}
animate();
