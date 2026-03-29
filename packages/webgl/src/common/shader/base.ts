import { minify } from "@plutotcool/glsl-bundler/minifier";
import { Brand } from "../../utils/type/brand";
import { getShortUnique } from "../../utils/unique";

/** 不重命名符号，避免与 JS 侧 uniform / attribute 及跨 stage 名称不一致 */
const glslMinifyOpts = {
  renameFunctions: false,
  renameVariables: false,
  renameDefines: false,
  renameStructs: false,
  trimComments: true,
  trimSpaces: true,
  trimZeros: true,
} as const;

export type FragmentCode = Brand<string, "FragmentCode">;
export type VertexCode = Brand<string, "VertexCode">;
export type GlslCode = VertexCode | FragmentCode;
export type ShaderCode = Brand<string, "ShaderCode">;
export type GlslUnique = `glsl-${string}`;
export type GlslType = "vertex" | "fragment" | "unknown";

export interface CodeSource {
  code: GlslCode;
  unique: GlslUnique;
  type: GlslType;
}

export interface FragmentCodeSource {
  code: FragmentCode;
  unique: GlslUnique;
  type: "fragment";
}

export interface VertexCodeSource {
  code: VertexCode;
  unique: GlslUnique;
  type: "vertex";
}

function crateGlslUnique(): GlslUnique {
  const id = getShortUnique();
  return `glsl-${id}` as GlslUnique;
}

function _glsl(strings: TemplateStringsArray, ...values: any[]) {
  const n = values.length;
  let raw: string;
  if (n === 0) {
    raw = strings[0];
  } else {
    let out = strings[0] + (values[0] || "") + strings[1];
    for (let i = 1; i < n; i++) {
      out += (values[i] || "") + strings[i + 1];
    }
    raw = out;
  }
  if (__DEBUG__) {
    return {
      code: raw,
      unique: crateGlslUnique(),
    };
  }
  const code = minify(raw, glslMinifyOpts);
  return {
    code,
    unique: crateGlslUnique(),
  };
}

export function glsl(strings: TemplateStringsArray, ...values: any[]) {
  return {
    ...(_glsl(strings, ...values) as CodeSource),
    type: "unknown" as GlslType,
  };
}
// export function glslify(strings: TemplateStringsArray, ...values: any[]) {
//   return {
//     ...(_glsl(strings, ...values) as CodeSource),
//     type: "unknown" as GlslType,
//   };
// }
export function frag(strings: TemplateStringsArray, ...values: any[]): FragmentCodeSource {
  const { code, unique } = _glsl(strings, ...values);
  return {
    code: code as FragmentCode,
    unique,
    type: "fragment",
  };
}
export function vert(strings: TemplateStringsArray, ...values: any[]): VertexCodeSource {
  const { code, unique } = _glsl(strings, ...values);
  return {
    code: code as VertexCode,
    unique,
    type: "vertex",
  };
}
