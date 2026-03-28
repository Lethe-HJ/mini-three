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
} from "@mini-three/webgl";
import Stats from "stats.js";
import { syncMiniThreeCanvasSize } from "../utils/sync-canvas-size";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas #canvas not found");

const camera = new PerspectiveCamera(45, 1, 0.1, 30);
camera.position.set(1, 1, 20);
camera.lookAt(1, 0, 0);
camera.up.set(0, 1, 0);

const scene = new Scene();
scene.background = new Color(0xffffffff);
const ambient = new AmbientLight(0x494949);
scene.add(ambient);
const pointLight = new PointLight(0xffffff, 2, 0, 0);
pointLight.position.set(2, 6, 2);
scene.add(pointLight);

const boxGeometry = new BoxGeometry(2, 2, 2);
const phongMaterial = new MeshPhongMaterial({
  color: 0x00ff00,
  specular: 0xffffff,
  shininess: 100,
});
const mesh1 = new Mesh(boxGeometry, phongMaterial);
mesh1.position.set(-2, 0, 0);
mesh1.scale.setScalar(1.5);
scene.add(mesh1);

const lambertMaterial = new MeshLambertMaterial({ color: 0x00ff00 });
const mesh2 = new Mesh(boxGeometry, lambertMaterial);
mesh2.position.set(4, 0, 0);
mesh2.scale.setScalar(1.5);
scene.add(mesh2);

const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0x000000);

const ro = new ResizeObserver(() =>
  syncMiniThreeCanvasSize(canvas, renderer, camera),
);
ro.observe(canvas);
syncMiniThreeCanvasSize(canvas, renderer, camera);

const stats = new Stats();
document.body.appendChild(stats.dom);

let deg = 1;
function animate() {
  stats.begin();
  deg += 0.005;
  if (deg > 20) deg = 0;
  mesh1.rotation.set(deg, 2 * deg, 3 * deg);
  mesh2.rotation.set(deg, 2 * deg, 3 * deg);
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}
animate();
