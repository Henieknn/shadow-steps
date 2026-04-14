export type GameState = 'menu' | 'playing' | 'gameOver' | 'win' | 'winPrototype';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameObject {
  id: string;
  type: 'shadowSource' | 'redZone' | 'yellowZone' | 'orangeZone' | 'darkZone' | 'slot' | 'pit' | 'rail';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface Character {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
}

export interface Lamp {
  x: number;
  y: number;
  radius: number;
  isDragging: boolean;
}

export interface Level {
  id: number;
  objects: GameObject[];
  startPos: Point;
  finishPos: Point;
  lampStartPos: Point;
}
