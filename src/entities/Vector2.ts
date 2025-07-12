export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static from(x: number, y: number): Vector2 {
    return new Vector2(x, y);
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  distance(other: Vector2): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2 {
    const len = this.length();
    if (len === 0) return Vector2.zero();
    return new Vector2(this.x / len, this.y / len);
  }

  equals(other: Vector2): boolean {
    return Math.abs(this.x - other.x) < 0.001 && Math.abs(this.y - other.y) < 0.001;
  }

  lerp(other: Vector2, t: number): Vector2 {
    return new Vector2(
      this.x + (other.x - this.x) * t,
      this.y + (other.y - this.y) * t
    );
  }
}