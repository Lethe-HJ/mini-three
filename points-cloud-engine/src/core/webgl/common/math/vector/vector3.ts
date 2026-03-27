export class Vector3 {
  private _x: number;
  private _y: number;
  private _z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this._x = x;
    this._y = y;
    this._z = z;
  }

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
  }

  get z(): number {
    return this._z;
  }

  set z(value: number) {
    this._z = value;
  }

  set(x: number, y: number, z: number): this {
    this._x = x;
    this._y = y;
    this._z = z;
    return this;
  }

  copy(v: Vector3): this {
    this._x = v.x;
    this._y = v.y;
    this._z = v.z;
    return this;
  }

  toArray(): [number, number, number] {
    return [this._x, this._y, this._z];
  }

  clone(): Vector3 {
    return new Vector3(this._x, this._y, this._z);
  }

  setScalar(scalar: number): this {
    this._x = scalar;
    this._y = scalar;
    this._z = scalar;
    return this;
  }
}
