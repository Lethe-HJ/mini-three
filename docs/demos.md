# 示例应用与 Demo

示例位于 `apps/example`。在线演示：<http://81.71.84.163/>。每个 Demo 可在侧栏切换「mini-three / three.js」或不同小实验（源码见对应 `demoN/` 目录）。

## Demo 1：Phong 与 Lambert 材质

并排展示 Phong（高光）与 Lambert（纯漫反射）的差异。

![phong与lambert材质](./img/2026-03-30-14-13-58.png)

### 底层相关点

- **几何体复用**：两个 `Mesh` 共用同一 `BoxGeometry`，GPU 侧同一套顶点缓冲，渲染器在「同一着色程序」内会按 geometry 归类排序，减少 VAO / 顶点布局切换。
- **着色程序分流**：两种材质对应两套着色器；`ShaderProgram` 按着色器源码去重，同类型材质实例共享同一 WebGL program。
- **统一渲染路径**：默认走视锥剔除、按 program 再按 geometry 批处理等（见下文「引擎侧共性」）。

## Demo 2：1 万立方体

约 10000 个随机分布、随机缩放的立方体，Lambert 材质；相机可轨道旋转 / 缩放，用于观察大规模静态排布下的帧率。

![1万立方体](./img/2026-03-30-14-15-39.png)

### 底层相关点

- **单份几何 + 万级材质实例**：所有立方体共享一个 `BoxGeometry`；万级 `MeshLambertMaterial` 仍通过 `ShaderProgram.create` 的按源码去重，合并为**单次** Lambert program，避免重复编译/链接着色器。
- **渲染排序**：`WebGLRenderer` 先将可见 Mesh 按 **ShaderProgram** 分组，再在组内按 **Geometry** 重排，从而在万级 draw 时压缩 `gl.useProgram` 与顶点数组对象绑定次数。
- **视锥剔除**：默认开启，用相机 VP 矩阵更新视锥平面，与每 Mesh 的世界空间包围球做相交测试，视锥外物体不进入绘制循环。
- **矩阵与包围体**：Mesh 在变换未变时可跳过局部矩阵重建；世界包围球随 model 矩阵缓存，有利于剔除与减少重复计算（详见 `packages/webgl/src/mesh`）。

## Demo 3：视锥体剔除开关对照

相同样本（约 10000 立方体、较大散布范围），对比 `WebGLRenderer` 配置 **`frustumCulling: true`** 与 **`false`** 时的 Stats 与体感负载。

![视锥体剔除](./img/2026-03-30-14-16-34.png)

### 底层相关点

- **剔除路径**：开启时走 `cullMeshesByFrustum`：视锥体平面集每帧原地更新（避免每帧分配平面对象），可见列表写入复用缓冲区 `meshVisibleScratch`。
- **关闭时**：跳过包围球测试，所有 Mesh 进入绘制；便于在同一相机与场景下对比 CPU 剔除开销与 GPU 实际绘制量的差异。

## 引擎侧共性（与 Demo 相关的部分）

以下由 `packages/webgl` 实现，各 Demo 均会间接受益：

- **收集与剔除**：场景遍历使用复用的 `meshScratch` 数组，避免每帧 `[]` 分配。
- **Program 与 VAO**：同源码着色器全局去重；批内按 geometry 排序以降低绑定切换。
- **Uniform**：`getUniformLocation` 结果缓存；Mesh 侧矩阵上传使用预分配 `Float32Array`，避免每帧 `new`。
- **可选**：`scheduleRender` 可将同一帧内多次渲染请求合并为一次 `requestAnimationFrame`（当前示例主循环多为直接 `render`）。
