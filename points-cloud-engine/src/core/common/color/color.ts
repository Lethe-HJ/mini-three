export class Color {
  r: number = 0;
  g: number = 0;
  b: number = 0;

  constructor(color: string | number | [number, number, number]) {
    if (typeof color === "string") {
      this.set(color);
    } else if (typeof color === "number") {
      this.setHex(color);
    } else if (Array.isArray(color)) {
      this.setRGB(color[0], color[1], color[2]);
    } else {
      this.setRGB(0, 0, 0);
    }
  }

  set(color: string): this {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    this.setRGB(r, g, b);
    return this;
  }

  setHex(hex: number): this {
    const r = ((hex >> 16) & 255) / 255;
    const g = ((hex >> 8) & 255) / 255;
    const b = (hex & 255) / 255;
    this.setRGB(r, g, b);
    return this;
  }

  setRGB(r: number, g: number, b: number): this {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }

  toArray(): [number, number, number] {
    return [this.r, this.g, this.b];
  }

  toHexString(): string {
    const r = Math.floor(this.r * 255)
      .toString(16)
      .padStart(2, "0");
    const g = Math.floor(this.g * 255)
      .toString(16)
      .padStart(2, "0");
    const b = Math.floor(this.b * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${r}${g}${b}`;
  }
}
