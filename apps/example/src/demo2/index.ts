export const demoInfo = {
  id: "demo2",
  name: "1千立方体",
  description: "第二个演示：1000个正方体的旋转场景渲染",
  showInMenu: true,
  leftTitle: "WebGL Implementation",
  rightTitle: "Three.js Standard",
  leftFile: "webgl.ts",
  rightFile: "threejs.ts",
  init: async () => {
    await Promise.all([import("./webgl"), import("./threejs")]);
  },
};
