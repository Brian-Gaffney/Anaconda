import { Vector2 } from '../entities/Vector2.js';

export class Collision {
  static circleToCircle(
    pos1: Vector2, 
    radius1: number, 
    pos2: Vector2, 
    radius2: number
  ): boolean {
    const distance = pos1.distance(pos2);
    return distance < (radius1 + radius2);
  }

  static pointToRect(
    point: Vector2,
    rectPos: Vector2,
    rectWidth: number,
    rectHeight: number
  ): boolean {
    return (
      point.x >= rectPos.x &&
      point.x <= rectPos.x + rectWidth &&
      point.y >= rectPos.y &&
      point.y <= rectPos.y + rectHeight
    );
  }

  static circleToRect(
    circlePos: Vector2,
    circleRadius: number,
    rectPos: Vector2,
    rectWidth: number,
    rectHeight: number
  ): boolean {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(rectPos.x, Math.min(circlePos.x, rectPos.x + rectWidth));
    const closestY = Math.max(rectPos.y, Math.min(circlePos.y, rectPos.y + rectHeight));
    
    const distance = circlePos.distance(new Vector2(closestX, closestY));
    return distance < circleRadius;
  }

  static rectToRect(
    pos1: Vector2,
    width1: number,
    height1: number,
    pos2: Vector2,
    width2: number,
    height2: number
  ): boolean {
    return (
      pos1.x < pos2.x + width2 &&
      pos1.x + width1 > pos2.x &&
      pos1.y < pos2.y + height2 &&
      pos1.y + height1 > pos2.y
    );
  }
}