export const ObjectType = {
  Mesh: "Mesh",
  Group: "Group",
};

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];
