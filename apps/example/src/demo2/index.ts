export const demoInfo = {
  id: "demo2",
  name: "1万立方体",
  description: "第二个演示：10000个正方体的旋转场景渲染",
  showInMenu: true,
  leftTitle: "WebGL Implementation  47fps",
  rightTitle: "Three.js Standard     33fpx",
  leftFile: "webgl.ts",
  rightFile: "threejs.ts",
  init: async () => {
    await Promise.all([import("./webgl"), import("./threejs")]);
  },
};
