import React, { useRef, useEffect, useCallback } from 'react';
import { Point, GameObject, Character, Lamp, Level } from '../game/types';
import { calculateShadowPolygon, isPointInPolygon, isPointInRect, getDistance } from '../game/utils';

interface GameViewProps {
  key?: React.Key;
  level: number;
  onBackToMenu: () => void;
  onWin: () => void;
  onGameOver: () => void;
}

const LEVEL_1: Level = {
  id: 1,
  startPos: { x: 60, y: 300 },
  finishPos: { x: 740, y: 300 },
  lampStartPos: { x: 550, y: 300 },
  objects: [
    { id: 'start-zone', type: 'darkZone', x: 0, y: 0, width: 120, height: 600 },
    { id: 'finish-zone', type: 'darkZone', x: 680, y: 0, width: 120, height: 600 },
    { id: 'block-1', type: 'shadowSource', x: 350, y: 250, width: 100, height: 100 },
  ]
};

const LEVEL_2: Level = {
  id: 2,
  startPos: { x: 75, y: 75 },
  finishPos: { x: 760, y: 300 },
  lampStartPos: { x: 50, y: 550 },
  objects: [
    // Start Zone (Top Left Square)
    { id: 'start-zone', type: 'darkZone', x: 0, y: 0, width: 150, height: 150 },
    // Finish Zone (Right Bar)
    { id: 'finish-zone', type: 'darkZone', x: 720, y: 0, width: 80, height: 600 },
    // Yellow Zone (Death for Character, Top - rendered above shadows)
    { id: 'yellow-zone', type: 'yellowZone', x: 330, y: 0, width: 280, height: 230 },
    // Pit (Center - Collider for both, No Shadow)
    { id: 'pit', type: 'pit', x: 330, y: 230, width: 280, height: 320 },
    // Red Zones (Death for Lamp, Left - rendered below shadows)
    { id: 'red-bar', type: 'redZone', x: 0, y: 350, width: 330, height: 50 },
    { id: 'red-loop', type: 'redZone', x: 140, y: 250, width: 130, height: 130 },
    // Green Object (Shadow Source)
    { id: 'block-2', type: 'shadowSource', x: 175, y: 285, width: 60, height: 60 },
  ]
};

const LEVEL_3: Level = {
  id: 3,
  startPos: { x: 75, y: 75 },
  finishPos: { x: 760, y: 300 },
  lampStartPos: { x: 50, y: 550 },
  objects: [
    { id: 'start-zone', type: 'darkZone', x: 0, y: 0, width: 130, height: 130 },
    { id: 'finish-zone', type: 'darkZone', x: 720, y: 0, width: 80, height: 600 },
    { id: 'pit-top', type: 'pit', x: 390, y: 0, width: 220, height: 100 },
    { id: 'pit-bottom', type: 'pit', x: 390, y: 500, width: 220, height: 100 },
    { id: 'yellow-mid', type: 'yellowZone', x: 375, y: 100, width: 250, height: 400 },
    { id: 'safe-island', type: 'darkZone', x: 320, y: 420, width: 70, height: 70 },
    { id: 'green-core', type: 'shadowSource', x: 610, y: 260, width: 80, height: 80 },
    { id: 'slot-rail', type: 'rail', x: 650, y: 300, width: 100, height: 100 },
  ]
};

const LEVEL_4: Level = {
  id: 4,
  startPos: { x: 65, y: 65 },
  finishPos: { x: 760, y: 300 },
  lampStartPos: { x: 50, y: 550 },
  objects: [
    { id: 'start-zone', type: 'darkZone', x: 0, y: 0, width: 140, height: 140 },
    { id: 'finish-zone', type: 'darkZone', x: 720, y: 0, width: 80, height: 600 },
    // Yellow zone at the top
    { id: 'yellow-top', type: 'yellowZone', x: 140, y: 0, width: 580, height: 80 },
    // Large yellow zone on the left
    { id: 'yellow-left', type: 'yellowZone', x: 140, y: 80, width: 180, height: 440 },
    // Red zone bottom left
    { id: 'red-bottom', type: 'redZone', x: 140, y: 520, width: 260, height: 80 },
    // Red zone middle
    { id: 'red-mid', type: 'redZone', x: 390, y: 80, width: 120, height: 340 },
    // Orange zone (Death for both) - L-shape
    { id: 'orange-v', type: 'orangeZone', x: 600, y: 220, width: 70, height: 380 },
    { id: 'orange-h', type: 'orangeZone', x: 670, y: 220, width: 50, height: 210 },
    // Safe islands
    { id: 'safe-1', type: 'darkZone', x: 550, y: 130, width: 90, height: 80 },
    { id: 'safe-2', type: 'darkZone', x: 540, y: 530, width: 90, height: 70 },
    // Shadow sources
    { id: 'block-4-1', type: 'shadowSource', x: 360, y: 490, width: 80, height: 80 },
    { id: 'block-4-2', type: 'shadowSource', x: 485, y: 240, width: 65, height: 100 },
    { id: 'block-4-3', type: 'shadowSource', x: 625, y: 140, width: 65, height: 100 },
  ]
};

const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export default function GameView({ level, onBackToMenu, onWin, onGameOver }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentLevel = LEVELS[level - 1] || LEVEL_1;
  
  // Game state in refs for performance
  const characterRef = useRef<Character & { bob: number; angle: number }>({
    x: currentLevel.startPos.x,
    y: currentLevel.startPos.y,
    radius: 14,
    vx: 0,
    vy: 0,
    bob: 0,
    angle: 0
  });
  
  const lampRef = useRef<Lamp>({
    x: currentLevel.lampStartPos.x,
    y: currentLevel.lampStartPos.y,
    radius: 18,
    isDragging: false
  });

  const particlesRef = useRef<Particle[]>([]);
  const keys = useRef<{ [key: string]: boolean }>({});
  const requestRef = useRef<number>(null);
  const isGameOverRef = useRef(false);
  const frameCountRef = useRef(0);
  const slotAngleRef = useRef(0);
  const isLampInSlotRef = useRef(false);
  const slotPosRef = useRef({ x: 0, y: 0 });

  const createParticle = (x: number, y: number, color: string, type: 'lamp' | 'dust') => {
    const p: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * (type === 'lamp' ? 1 : 2),
      vy: (Math.random() - 0.5) * (type === 'lamp' ? 1 : 2) - (type === 'dust' ? 0.5 : 0),
      life: 1.0,
      maxLife: 0.5 + Math.random() * 0.5,
      size: type === 'lamp' ? 1 + Math.random() * 2 : 2 + Math.random() * 3,
      color
    };
    particlesRef.current.push(p);
  };

  const isSupported = (x: number, y: number, shadows: Point[][]) => {
    const inDarkZone = currentLevel.objects.some(obj => 
      obj.type === 'darkZone' && isPointInRect({ x, y }, obj)
    );
    if (inDarkZone) return true;

    // Level 3 specific: Yellow zone becomes safe when lamp is in slot
    if (currentLevel.id === 3 && isLampInSlotRef.current) {
      const inYellow = currentLevel.objects.some(obj => 
        obj.type === 'yellowZone' && isPointInRect({ x, y }, obj)
      );
      if (inYellow) return true;
    }

    const inShadow = shadows.some(poly => isPointInPolygon({ x, y }, poly));
    return inShadow;
  };

  const update = useCallback(() => {
    if (isGameOverRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;
    const char = characterRef.current;
    const lamp = lampRef.current;

    // Level 3 Slot Logic
    if (currentLevel.id === 3) {
      const rail = currentLevel.objects.find(o => o.type === 'rail');
      if (rail) {
        if (!isLampInSlotRef.current) {
          slotAngleRef.current += 0.02;
        }
        const radius = rail.width;
        slotPosRef.current.x = rail.x + Math.cos(slotAngleRef.current) * radius;
        slotPosRef.current.y = rail.y + Math.sin(slotAngleRef.current) * radius;

        // Check for lamp snapping
        if (!isLampInSlotRef.current && lamp.isDragging) {
          const dist = getDistance(lamp, slotPosRef.current);
          if (dist < 30) {
            isLampInSlotRef.current = true;
            lamp.isDragging = false;
            lamp.x = slotPosRef.current.x;
            lamp.y = slotPosRef.current.y;
          }
        }
        
        if (isLampInSlotRef.current) {
          lamp.x = slotPosRef.current.x;
          lamp.y = slotPosRef.current.y;
        }
      }
    }

    // 1. Handle Input for Character
    let speed = 3.8; // Increased speed
    
    let dx = 0;
    let dy = 0;

    if (keys.current['KeyA'] || keys.current['ArrowLeft']) dx -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) dx += 1;
    if (keys.current['KeyW'] || keys.current['ArrowUp']) dy -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    char.vx = dx * speed;
    char.vy = dy * speed;

    // Character Animation Logic
    if (dx !== 0 || dy !== 0) {
      char.bob += 0.25;
      char.angle = Math.atan2(dy, dx);
      // Create dust particles when moving
      if (frameCountRef.current % 5 === 0) {
        createParticle(char.x, char.y + char.radius, 'rgba(0,0,0,0.2)', 'dust');
      }
    } else {
      char.bob *= 0.8;
    }

    // 2. Physics & Collision
    const shadows = currentLevel.objects
      .filter(obj => obj.type === 'shadowSource')
      .map(obj => calculateShadowPolygon(lamp, obj, canvas.width, canvas.height));

    let nextX = char.x + char.vx;
    let nextY = char.y + char.vy;

    // Wall Collision (Green Objects & Pits)
    currentLevel.objects.filter(obj => obj.type === 'shadowSource' || obj.type === 'pit').forEach(wall => {
      const closestX = Math.max(wall.x, Math.min(nextX, wall.x + wall.width));
      const closestY = Math.max(wall.y, Math.min(nextY, wall.y + wall.height));
      const distanceX = nextX - closestX;
      const distanceY = nextY - closestY;
      const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

      if (distanceSquared < (char.radius * char.radius)) {
        const closestX_only = Math.max(wall.x, Math.min(nextX, wall.x + wall.width));
        const distSqX = (nextX - closestX_only) ** 2 + (char.y - Math.max(wall.y, Math.min(char.y, wall.y + wall.height))) ** 2;
        if (distSqX < char.radius * char.radius) nextX = char.x;
        const closestY_only = Math.max(wall.y, Math.min(nextY, wall.y + wall.height));
        const distSqY = (char.x - Math.max(wall.x, Math.min(char.x, wall.x + wall.width))) ** 2 + (nextY - closestY_only) ** 2;
        if (distSqY < char.radius * char.radius) nextY = char.y;
      }
    });

    char.x = nextX;
    char.y = nextY;

    if (char.x < char.radius) char.x = char.radius;
    if (char.x > canvas.width - char.radius) char.x = canvas.width - char.radius;
    if (char.y < char.radius) char.y = char.radius;
    if (char.y > canvas.height - char.radius) char.y = canvas.height - char.radius;

    // Lamp Particles
    if (frameCountRef.current % 3 === 0) {
      createParticle(lamp.x, lamp.y, 'rgba(250, 204, 21, 0.8)', 'lamp');
    }

    // Update Particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      return p.life > 0;
    });

    // Death check (Light)
    const margin = 5;
    const checkPoints = [
      { x: char.x, y: char.y },
      { x: char.x - char.radius + margin, y: char.y },
      { x: char.x + char.radius - margin, y: char.y },
      { x: char.x, y: char.y - char.radius + margin },
      { x: char.x, y: char.y + char.radius - margin },
    ];
    if (!checkPoints.every(p => isSupported(p.x, p.y, shadows))) {
      isGameOverRef.current = true;
      onGameOver();
      return;
    }

    // Death check (Yellow Zone for Character)
    const inYellowZone = currentLevel.objects.some(obj => 
      obj.type === 'yellowZone' && isPointInRect({ x: char.x, y: char.y }, obj)
    );
    if (inYellowZone) {
      if (currentLevel.id !== 3 || !isLampInSlotRef.current) {
        isGameOverRef.current = true;
        onGameOver();
        return;
      }
    }

    // Death check (Orange Zone for Character)
    const inOrangeZoneChar = currentLevel.objects.some(obj => 
      obj.type === 'orangeZone' && isPointInRect({ x: char.x, y: char.y }, obj)
    );
    if (inOrangeZoneChar) {
      isGameOverRef.current = true;
      onGameOver();
      return;
    }

    // Death check (Red Zone for Lamp)
    const lampInRedZone = currentLevel.objects.some(obj => 
      obj.type === 'redZone' && (
        // Check lamp center and edges
        isPointInRect({ x: lamp.x, y: lamp.y }, obj) ||
        isPointInRect({ x: lamp.x - lamp.radius, y: lamp.y }, obj) ||
        isPointInRect({ x: lamp.x + lamp.radius, y: lamp.y }, obj) ||
        isPointInRect({ x: lamp.x, y: lamp.y - lamp.radius }, obj) ||
        isPointInRect({ x: lamp.x, y: lamp.y + lamp.radius }, obj)
      )
    );
    if (lampInRedZone) {
      isGameOverRef.current = true;
      onGameOver();
      return;
    }

    // Death check (Orange Zone for Lamp)
    const lampInOrangeZone = currentLevel.objects.some(obj => 
      obj.type === 'orangeZone' && (
        isPointInRect({ x: lamp.x, y: lamp.y }, obj) ||
        isPointInRect({ x: lamp.x - lamp.radius, y: lamp.y }, obj) ||
        isPointInRect({ x: lamp.x + lamp.radius, y: lamp.y }, obj) ||
        isPointInRect({ x: lamp.x, y: lamp.y - lamp.radius }, obj) ||
        isPointInRect({ x: lamp.x, y: lamp.y + lamp.radius }, obj)
      )
    );
    if (lampInOrangeZone) {
      isGameOverRef.current = true;
      onGameOver();
      return;
    }

    // Win check
    const inFinish = currentLevel.objects.some(obj => 
      obj.id === 'finish-zone' && isPointInRect({ x: char.x, y: char.y }, obj)
    );
    if (inFinish && char.x > 700) {
      isGameOverRef.current = true;
      onWin();
      return;
    }

    // 3. Rendering
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Red Zones (rendered BELOW shadows)
    ctx.fillStyle = '#f87171'; // red-400 opaque
    currentLevel.objects.filter(obj => obj.type === 'redZone').forEach(obj => {
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    });

    // Shadows
    ctx.fillStyle = '#2d2d2d';
    shadows.forEach(poly => {
      if (poly.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      ctx.fill();
    });

    // Dark Zones
    currentLevel.objects.filter(obj => obj.type === 'darkZone').forEach(obj => {
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    });

    // Yellow Zones (rendered ABOVE shadows)
    currentLevel.objects.filter(obj => obj.type === 'yellowZone').forEach(obj => {
      if (currentLevel.id === 3 && isLampInSlotRef.current) {
        // Safe mode: draw as dark zone
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      } else {
        // Glow effect
        const glow = ctx.createLinearGradient(obj.x, obj.y, obj.x, obj.y + obj.height);
        glow.addColorStop(0, '#fef08a');
        glow.addColorStop(1, '#fde047');
        ctx.fillStyle = glow;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        
        // Inner glow/border
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
        ctx.lineWidth = 10;
        ctx.strokeRect(obj.x + 5, obj.y + 5, obj.width - 10, obj.height - 10);
      }
    });

    // Orange Zones (Death for both, rendered ABOVE shadows)
    currentLevel.objects.filter(obj => obj.type === 'orangeZone').forEach(obj => {
      ctx.fillStyle = '#fb923c'; // orange-400
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      ctx.strokeStyle = '#f97316'; // orange-500
      ctx.lineWidth = 4;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    });

    // Rails (Level 3)
    if (currentLevel.id === 3) {
      const rail = currentLevel.objects.find(o => o.type === 'rail');
      if (rail) {
        ctx.strokeStyle = '#6b7280'; // gray-500
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(rail.x, rail.y, rail.width, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rail.x, rail.y, rail.width - 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rail.x, rail.y, rail.width + 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Slot
      ctx.fillStyle = '#2dd4bf'; // turquoise-400
      const slotSize = 40;
      ctx.fillRect(slotPosRef.current.x - slotSize/2, slotPosRef.current.y - slotSize/2, slotSize, slotSize);
      ctx.fillStyle = '#134e4a'; // dark turquoise
      ctx.beginPath();
      ctx.arc(slotPosRef.current.x, slotPosRef.current.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pits (Collider, No Shadow)
    currentLevel.objects.filter(obj => obj.type === 'pit').forEach(obj => {
      // Depth effect: multiple nested rectangles with colors matching the image
      // Using a more "muddy" brown palette as seen in the sketch
      const layers = 8;
      const colors = [
        '#3d2b1f', // Outer muddy brown
        '#35251b',
        '#2d1f17',
        '#251913',
        '#1d130f',
        '#150d0b',
        '#0d0707',
        '#000000'  // Deep center
      ];
      
      const step = Math.min(obj.width, obj.height) / (layers * 2.5);
      
      for (let i = 0; i < layers; i++) {
        const offset = i * step;
        ctx.fillStyle = colors[i];
        ctx.fillRect(obj.x + offset, obj.y + offset, obj.width - offset * 2, obj.height - offset * 2);
      }
      
      // Outer rim
      ctx.strokeStyle = '#2b1e15';
      ctx.lineWidth = 3;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    });

    // Green Objects
    ctx.fillStyle = '#84cc16';
    currentLevel.objects.filter(obj => obj.type === 'shadowSource').forEach(obj => {
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    });

    // Vignette Effect
    const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Character
    ctx.save();
    ctx.translate(char.x, char.y);
    
    // Animation: Squash and stretch
    const scaleY = 1 + Math.sin(char.bob) * 0.15;
    const scaleX = 1 - Math.sin(char.bob) * 0.1;
    ctx.scale(scaleX, scaleY);
    
    // Body Shape (Blob with trailing nub)
    ctx.fillStyle = '#000000';
    
    // Draw "Tail" (Lagging behind movement)
    const tailLag = 3;
    const tx = -char.vx * tailLag;
    const ty = -char.vy * tailLag;
    
    ctx.beginPath();
    // Main body
    ctx.arc(0, 0, char.radius, 0, Math.PI * 2);
    // Tail nub
    ctx.arc(tx, ty, char.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (Directional)
    // Only show eyes if not moving up (or if idle)
    const isMovingUp = char.vy < -0.5;
    
    if (!isMovingUp) {
      ctx.fillStyle = '#f97316'; // Orange eyes
      
      let eyeX = 0;
      let eyeY = -1;
      
      // Shift eyes based on movement
      if (char.vx > 0.5) eyeX = 4;
      else if (char.vx < -0.5) eyeX = -4;
      
      if (char.vy > 0.5) eyeY = 2;

      // Draw rectangular eyes like in the image
      const eyeW = 4;
      const eyeH = 7;
      const eyeSpacing = 4;
      
      // Left Eye
      ctx.fillRect(eyeX - eyeSpacing - eyeW/2, eyeY - eyeH/2, eyeW, eyeH);
      // Right Eye
      ctx.fillRect(eyeX + eyeSpacing - eyeW/2, eyeY - eyeH/2, eyeW, eyeH);
    }
    
    ctx.restore();

    // Lamp
    ctx.save();
    ctx.translate(lamp.x, lamp.y);
    const lampPulse = 1 + Math.sin(frameCountRef.current * 0.05) * 0.05;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, lamp.radius * 5 * lampPulse);
    gradient.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
    gradient.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, lamp.radius * 5 * lampPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, lamp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    requestRef.current = requestAnimationFrame(update);
  }, [onGameOver, onWin, currentLevel]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  // Input Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLampInSlotRef.current && currentLevel.id === 3) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (getDistance({ x: mouseX, y: mouseY }, lampRef.current) < lampRef.current.radius * 3) {
      lampRef.current.isDragging = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!lampRef.current.isDragging) return;
    if (isLampInSlotRef.current && currentLevel.id === 3) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvas = canvasRef.current!;
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;
    const lamp = lampRef.current;

    // Boundary check
    mouseX = Math.max(lamp.radius, Math.min(canvas.width - lamp.radius, mouseX));
    mouseY = Math.max(lamp.radius, Math.min(canvas.height - lamp.radius, mouseY));
    
    // Constraint: Lamp shouldn't go inside shadow sources or pits
    // Check collision between lamp (circle) and walls (rects)
    let canMove = true;
    currentLevel.objects.filter(obj => obj.type === 'shadowSource' || obj.type === 'pit').forEach(wall => {
      const closestX = Math.max(wall.x, Math.min(mouseX, wall.x + wall.width));
      const closestY = Math.max(wall.y, Math.min(mouseY, wall.y + wall.height));
      const distanceX = mouseX - closestX;
      const distanceY = mouseY - closestY;
      const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

      if (distanceSquared < (lamp.radius * lamp.radius)) {
        canMove = false;
      }
    });
    
    if (canMove) {
      lamp.x = mouseX;
      lamp.y = mouseY;
    }
  };

  const handleMouseUp = () => {
    lampRef.current.isDragging = false;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0a] p-4">
      <div className="mb-4 flex justify-between w-full max-w-[800px] items-center">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Level</span>
          <span className="text-2xl font-black italic">0{level}</span>
        </div>
        <button 
          onClick={onBackToMenu}
          className="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-white border border-white/10 rounded-full transition-all hover:bg-white/5"
        >
          Exit to Menu
        </button>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-blue-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-white">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair"
          />
        </div>
      </div>

      <div className="mt-8 flex gap-12 items-center">
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400">W</kbd>
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400">A</kbd>
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400">S</kbd>
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400">D</kbd>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-gray-600">Move</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <div className="flex flex-col items-center gap-1">
          <div className="px-4 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400 uppercase tracking-tighter">Mouse Drag</div>
          <span className="text-[9px] uppercase tracking-widest text-gray-600">Control Light</span>
        </div>
      </div>
    </div>
  );
}
