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
  Group,
  MeshLambertMaterial,
} from "three";
import Stats from "stats.js";
import { CameraTransformController } from "../utils/transform";
import { syncThreeCanvasSize } from "../utils/sync-canvas-size";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas #canvas not found");

const camera = new PerspectiveCamera(60, 1, 0.1, 1000);
camera.up.set(0, 1, 0);

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
const count = 10000;
const spread = 20;
for (let i = 0; i < count; i++) {
  const color = new Color().setHSL(Math.random(), 0.7, 0.5);
  const material = new MeshLambertMaterial({
    color: color,
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
  const scale = 0.5 + Math.random();
  mesh.scale.setScalar(scale);
  meshes.push(mesh);
}

const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0x000000);

const stats = new Stats();
document.body.appendChild(stats.dom);

function _render() {
  let rafId: number | null = null;
  return function () {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      stats.begin();
      renderer.render(scene, camera);
      stats.end();
    });
  };
}

const render = _render();

const cameraController = new CameraTransformController(camera, {
  initialDistance: 30,
  minDistance: 10,
  maxDistance: 100,
  rotationSpeed: 0.002,
  zoomSpeed: 0.01,
  onChange: render,
});
cameraController.bindEvents(canvas);

const ro = new ResizeObserver(() => syncThreeCanvasSize(canvas, renderer, camera));
ro.observe(canvas);
syncThreeCanvasSize(canvas, renderer, camera);
render();
