import {
  PerspectiveCamera,
  Scene,
  AmbientLight,
  PointLight,
  BoxGeometry,
  WebGLRenderer,
  Color,
  Mesh,
  Group,
  MeshLambertMaterial,
} from "@mini-three/webgl";
import Stats from "stats.js";
import { CameraTransformController } from "../utils/transform";
import { syncMiniThreeCanvasSize } from "../utils/sync-canvas-size";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas #canvas not found");

const camera = new PerspectiveCamera(60, 1, 0.1, 30);
camera.up.set(0, 1, 0);
const cameraController = new CameraTransformController(camera, {
  initialDistance: 30,
  minDistance: 10,
  maxDistance: 100,
  rotationSpeed: 0.002,
  zoomSpeed: 0.01,
});
cameraController.bindEvents(canvas);

const scene = new Scene();
scene.background = new Color(0xffffffff);
const ambient = new AmbientLight(0x494949);
scene.add(ambient);
const pointLight = new PointLight(0xffffff, 1.5, 0, 0);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);

const boxGeometry = new BoxGeometry(0.2, 0.2, 0.2);
const group = new Group();
scene.add(group);
const meshes: Mesh[] = [];
const count = 3000;
const spread = 80;
for (let i = 0; i < count; i++) {
  const color = new Color().setHSL(Math.random(), 0.7, 0.5);
  const material = new MeshLambertMaterial({
    color,
  });
  const mesh = new Mesh(boxGeometry, material);
  group.add(mesh);
  mesh.position.set(
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread,
  );
  mesh.rotation.set(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
  );
  const scale = 0.4 + Math.random() * 1.6;
  mesh.scale.setScalar(scale);
  meshes.push(mesh);
}

const renderer = new WebGLRenderer({
  canvas,
  antialias: true,
  frustumCulling: true,
});
renderer.setClearColor(0x000000);

const ro = new ResizeObserver(() =>
  syncMiniThreeCanvasSize(canvas, renderer, camera),
);
ro.observe(canvas);
syncMiniThreeCanvasSize(canvas, renderer, camera);

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  meshes.forEach((mesh, index) => {
    const speed = 0.3 + (index % 7) * 0.01;
    mesh.rotation.x += 0.007 * speed;
    mesh.rotation.y += 0.012 * speed;
    mesh.rotation.z += 0.005 * speed;
  });
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}

animate();
