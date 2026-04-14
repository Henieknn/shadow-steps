import { Point, Rect } from './types';

export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function isPointInRect(p: Point, rect: Rect): boolean {
  return p.x >= rect.x && p.x <= rect.x + rect.width &&
         p.y >= rect.y && p.y <= rect.y + rect.height;
}

export function getRectVertices(rect: Rect): Point[] {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height }
  ];
}

export function projectPoint(light: Point, vertex: Point, distance: number): Point {
  const dx = vertex.x - light.x;
  const dy = vertex.y - light.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  return {
    x: vertex.x + (dx / len) * distance,
    y: vertex.y + (dy / len) * distance
  };
}

/**
 * Calculates the shadow polygon for a rectangle from a point light source.
 */
export function calculateShadowPolygon(light: Point, rect: Rect, canvasWidth: number, canvasHeight: number): Point[] {
  const vertices = getRectVertices(rect);
  const maxDist = Math.max(canvasWidth, canvasHeight) * 2;

  // Find the two vertices that form the widest angle from the light source
  let minAngle = Infinity;
  let maxAngle = -Infinity;
  let minIdx = -1;
  let maxIdx = -1;

  // We need to handle the wrap-around case for angles, but for simple rectangles 
  // and light outside, we can often just find the min/max of atan2.
  // However, if the light is very close or the object spans the -PI/PI boundary, it breaks.
  
  // A more robust way:
  // 1. Find all edges.
  // 2. Determine which edges face the light.
  // 3. The silhouette vertices are those shared by a front-facing and a back-facing edge.
  
  const edges = [
    [vertices[0], vertices[1]],
    [vertices[1], vertices[2]],
    [vertices[2], vertices[3]],
    [vertices[3], vertices[0]]
  ];

  const frontFacing: boolean[] = edges.map(([v1, v2]) => {
    const midX = (v1.x + v2.x) / 2;
    const midY = (v1.y + v2.y) / 2;
    const normalX = v2.y - v1.y;
    const normalY = v1.x - v2.x;
    const dot = (midX - light.x) * normalX + (midY - light.y) * normalY;
    return dot < 0; // Normal points outwards, so if dot < 0, it's facing light
  });

  const silhouetteVertices: Point[] = [];
  for (let i = 0; i < 4; i++) {
    const prev = (i + 3) % 4;
    if (frontFacing[i] !== frontFacing[prev]) {
      silhouetteVertices.push(vertices[i]);
    }
  }

  if (silhouetteVertices.length < 2) return [];

  // Sort them so they form a proper polygon (clockwise/counter-clockwise)
  // For a rectangle, we just need to make sure we project them in the right order.
  const v1 = silhouetteVertices[0];
  const v2 = silhouetteVertices[1];
  
  const p1 = projectPoint(light, v1, maxDist);
  const p2 = projectPoint(light, v2, maxDist);

  // To ensure a simple polygon, we might need to check the order.
  // But for a shadow, [v1, v2, p2, p1] usually works if v1 and v2 are ordered correctly.
  // Let's use the cross product to determine order.
  const cp = (v2.x - v1.x) * (p1.y - v1.y) - (v2.y - v1.y) * (p1.x - v1.x);
  if (cp > 0) {
    return [v1, v2, p2, p1];
  } else {
    return [v1, p1, p2, v2];
  }
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
