export const demoInfo = {
  id: "demo3",
  name: "视锥体剔除对照",
  description: "第三个演示：关闭 frustumCulling，与开启 frustumCulling。",
  showInMenu: true,
  leftTitle: "Frustum culling: OFF",
  rightTitle: "Frustum culling: ON",
  leftFile: "webgl1.ts",
  rightFile: "webgl2.ts",
  init: async () => {
    await Promise.all([import("./webgl1"), import("./webgl2")]);
  },
};
