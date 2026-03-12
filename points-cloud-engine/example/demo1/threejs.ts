/**
 * js 场景（标准参考），渲染到 #canvas2。
 * WebGL (core) 以本配置为准，保持相机/光照/材质参数一致以便对比效果。
 * - 相机：position(1,1,10) lookAt(1,0,0) fov 45° aspect 2 near 0.1 far 20
 * - 背景白；环境光 #494949；点光 #fff position(2,6,2) intensity=2 distance=0 decay=0
 * - 立方体：mesh1 Phong 绿 shininess 100 (-2,0,0) scale 1.5，mesh2 Lambert 绿 (4,0,0) scale 1.5
 * - 动画：rotation(deg, 2*deg, 3*deg) 弧度
 */

import {
  PerspectiveCamera,
  Scene,
  AmbientLight,
  PointLight,
  BoxGeometry,
  MeshPhongMaterial,
  MeshLambertMaterial,
  WebGLRenderer,
  Color,
  Mesh,
} from "three";

const canvas = document.getElementById("canvas2") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas #canvas2 not found");

const width = 600;
const height = 300;

// 与 core 一致：fov 90*(π/360)=45°, aspect 600/300=2, near 0.1, far 20
const camera = new PerspectiveCamera(45, width / height, 0.1, 20);
camera.position.set(1, 1, 10);
camera.lookAt(1, 0, 0);
camera.up.set(0, 1, 0);

const scene = new Scene();
scene.background = new Color(0xffffffff);

// 环境光 #494949
const ambient = new AmbientLight(0x494949);
scene.add(ambient);

// 点光 #ffffff position(2,6,2)
// WebGL 衰减: 1/(0.5+0.01*d+0.032*d²)，在 d≈6 时约 0.58；Three 默认 1/distance^decay 在 d=6 时约 0.05，故需提高 intensity
// decay=0 关闭距离衰减，intensity=2 近似 WebGL 在光源处的 1/constant=2 的强度，使整体亮度与 Phong/Lambert 区分度接近 core
const pointLight = new PointLight(0xffffff, 2, 0, 0);
pointLight.position.set(2, 6, 2);
scene.add(pointLight);

// 立方体几何（与 core 一致：中心在原点、边长 2 的立方体，scale 1.5 后视觉一致）
const boxGeometry = new BoxGeometry(2, 2, 2);

// mesh1: Phong 绿 #00FF00，高光明显：specular 白、shininess 100
const phongMaterial = new MeshPhongMaterial({
  color: 0x00ff00,
  specular: 0xffffff,
  shininess: 100,
});
const mesh1 = new Mesh(boxGeometry, phongMaterial);
mesh1.position.set(-2, 0, 0);
mesh1.scale.setScalar(1.5);
scene.add(mesh1);

// mesh2: Lambert 绿（MeshLambertMaterial），在 group 中 position(4,0,0) scale 1.5
const lambertMaterial = new MeshLambertMaterial({ color: 0x00ff00 });
const mesh2 = new Mesh(boxGeometry, lambertMaterial);
mesh2.position.set(4, 0, 0);
mesh2.scale.setScalar(1.5);
scene.add(mesh2);

const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000);

// 与 core 一致：旋转量为弧度，deg 变量从 1 累加到 20 后归零
let deg = 1;
function animate() {
  deg += 0.005;
  if (deg > 20) deg = 0;
  mesh1.rotation.set(deg, 2 * deg, 3 * deg);
  mesh2.rotation.set(deg, 2 * deg, 3 * deg);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
