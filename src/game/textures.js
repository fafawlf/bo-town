/**
 * Programmatic Pixel Art Texture Generator
 * Creates all game textures at runtime using Canvas → PixiJS Texture
 */
import { Texture, RenderTexture, Graphics, Container, Text, TextStyle } from 'pixi.js';

const TS = 32; // tile size in pixels

// Color palette — warm, storybook RPG style
export const PAL = {
  grass:     ['#7ec850','#6db843','#8ed45e','#5da83a'],
  grassDark: '#4a8c2a',
  dirt:      ['#d4a76a','#c49a5e','#b8956a'],
  stone:     ['#a0a8a0','#8a928a','#b5bdb5','#788078'],
  water:     ['#4a90d9','#5a9ee0','#3a80c0'],
  sand:      '#e8d8a8',

  wallWhite: '#f5efe5', wallWarm: '#ede0c8', wallPink: '#f0d0d0',
  roofRed: '#b83030', roofBlue: '#3060a0', roofGreen: '#308030', roofBrown: '#806030',
  wood: '#a07840', woodDark: '#705020', woodLight: '#c09860',

  leafGreen: '#40a040', leafLight: '#60c060', leafDark: '#208020',
  leafPink: '#f0a0b0', leafPinkLight: '#f8c0d0',
  trunk: '#806040', trunkDark: '#604020',

  npcTypes: {
    emotional_therapist: { main: '#f48fb1', dark: '#e91e63', light: '#fce4ec' },
    emotional_collector: { main: '#64b5f6', dark: '#1976d2', light: '#e3f2fd' },
    emotional_architect: { main: '#ce93d8', dark: '#9c27b0', light: '#f3e5f5' },
    high_intensity:      { main: '#ef5350', dark: '#c62828', light: '#ffebee' },
    compulsive_explorer: { main: '#90a4ae', dark: '#546e7a', light: '#eceff1' },
  },
};

/**
 * Draw pixels onto a canvas context using a simple pixel map
 * map: 2D array of color strings (null = transparent)
 */
function drawPixelMap(ctx, map, ox = 0, oy = 0, scale = 2) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x]) {
        ctx.fillStyle = map[y][x];
        ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }
  }
}

/**
 * Create a Canvas-based texture
 */
function makeTexture(w, h, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, w, h);
  return Texture.from(canvas);
}

// ==================
// Tile Textures
// ==================

export function createGrassTex(variant = 0) {
  return makeTexture(TS, TS, (ctx) => {
    ctx.fillStyle = PAL.grass[variant % PAL.grass.length];
    ctx.fillRect(0, 0, TS, TS);
    // Grass blades
    ctx.fillStyle = PAL.grass[(variant + 1) % PAL.grass.length];
    const seed = variant * 7;
    for (let i = 0; i < 4; i++) {
      const gx = ((seed + i * 11) % 26) + 2;
      const gy = ((seed + i * 7) % 24) + 4;
      ctx.fillRect(gx, gy, 1, 3);
      ctx.fillRect(gx + 1, gy + 1, 1, 2);
    }
    // Occasional flower
    if (variant % 5 === 0) {
      ctx.fillStyle = ['#e74c3c', '#f1c40f', '#fff', '#9b59b6', '#5dade2'][variant % 5];
      ctx.fillRect(14, 12, 3, 3);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(15, 13, 1, 1);
    }
  });
}

export function createDirtTex() {
  return makeTexture(TS, TS, (ctx) => {
    ctx.fillStyle = PAL.dirt[0];
    ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = PAL.dirt[1];
    ctx.fillRect(4, 8, 6, 3);
    ctx.fillRect(18, 20, 8, 3);
    ctx.fillRect(24, 6, 5, 3);
    ctx.fillStyle = PAL.dirt[2];
    ctx.fillRect(10, 16, 4, 2);
    ctx.fillRect(2, 24, 5, 2);
  });
}

export function createStoneTex() {
  return makeTexture(TS, TS, (ctx) => {
    ctx.fillStyle = PAL.stone[0];
    ctx.fillRect(0, 0, TS, TS);
    // Stone blocks
    ctx.fillStyle = PAL.stone[1];
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillRect(17, 17, 14, 14);
    ctx.fillStyle = PAL.stone[2];
    ctx.fillRect(17, 1, 14, 14);
    ctx.fillRect(1, 17, 14, 14);
    // Gaps
    ctx.fillStyle = PAL.stone[3];
    ctx.fillRect(15, 0, 2, TS);
    ctx.fillRect(0, 15, TS, 2);
  });
}

export function createWaterTex(frame = 0) {
  return makeTexture(TS, TS, (ctx) => {
    ctx.fillStyle = PAL.water[0];
    ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = PAL.water[1];
    const off = frame * 4;
    ctx.fillRect((off) % 28, 6, 10, 2);
    ctx.fillRect((off + 14) % 28, 18, 8, 2);
    ctx.fillRect((off + 7) % 28, 28, 12, 2);
    ctx.fillStyle = PAL.water[2];
    ctx.fillRect((off + 10) % 24 + 2, 12, 6, 2);
  });
}

// ==================
// Building Textures
// ==================

export function createBuildingTex(w = 2, h = 2, style = {}) {
  const pw = w * TS, ph = h * TS + 12;
  return makeTexture(pw + 8, ph, (ctx) => {
    const roofC = style.roof || PAL.roofRed;
    const wallC = style.wall || PAL.wallWhite;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(6, 6, pw, ph - 6);

    // Walls
    ctx.fillStyle = wallC;
    ctx.fillRect(4, 14, pw, ph - 14);

    // Door
    const dx = 4 + pw / 2 - 6;
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(dx, ph - 16, 12, 16);
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(dx + 1, ph - 15, 10, 14);
    ctx.fillStyle = '#f0c040';
    ctx.fillRect(dx + 8, ph - 9, 2, 2);

    // Windows
    if (w >= 2) {
      drawWindow(ctx, 10, 20);
      drawWindow(ctx, pw - 12, 20);
    }

    // Roof
    ctx.fillStyle = roofC;
    ctx.fillRect(0, 0, pw + 8, 16);
    // Roof shading
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 12, pw + 8, 4);
    // Roof tile lines
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let rx = 4; rx < pw + 8; rx += 8) {
      ctx.fillRect(rx, 2, 1, 10);
    }

    // Chimney
    if (w >= 2) {
      ctx.fillStyle = '#888';
      ctx.fillRect(pw - 6, -8, 8, 10);
      ctx.fillStyle = '#999';
      ctx.fillRect(pw - 6, -8, 8, 3);
    }
  });
}

function drawWindow(ctx, x, y) {
  ctx.fillStyle = PAL.woodDark;
  ctx.fillRect(x, y, 12, 12);
  ctx.fillStyle = '#b0d0f0';
  ctx.fillRect(x + 1, y + 1, 10, 10);
  ctx.fillStyle = PAL.wood;
  ctx.fillRect(x + 5, y + 1, 2, 10);
  ctx.fillRect(x + 1, y + 5, 10, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x + 2, y + 2, 3, 3);
}

// ==================
// Tree Textures
// ==================

export function createTreeTex(style = 'oak') {
  return makeTexture(TS, TS + 8, (ctx) => {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(TS / 2, TS + 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = PAL.trunk;
    ctx.fillRect(13, 18, 6, 16);
    ctx.fillStyle = PAL.trunkDark;
    ctx.fillRect(13, 18, 2, 16);

    if (style === 'oak') {
      ctx.fillStyle = PAL.leafDark;
      ctx.fillRect(4, 4, 24, 16);
      ctx.fillRect(8, 0, 16, 20);
      ctx.fillStyle = PAL.leafGreen;
      ctx.fillRect(6, 2, 20, 14);
      ctx.fillRect(10, 0, 12, 18);
      ctx.fillStyle = PAL.leafLight;
      ctx.fillRect(10, 2, 6, 6);
      ctx.fillRect(14, 6, 8, 4);
    } else if (style === 'pine') {
      ctx.fillStyle = PAL.leafDark;
      ctx.fillRect(8, 12, 16, 8);
      ctx.fillRect(10, 6, 12, 8);
      ctx.fillRect(12, 0, 8, 8);
      ctx.fillStyle = PAL.leafGreen;
      ctx.fillRect(9, 11, 14, 7);
      ctx.fillRect(11, 5, 10, 7);
      ctx.fillRect(13, 0, 6, 6);
    } else { // cherry
      ctx.fillStyle = PAL.leafPink;
      ctx.fillRect(4, 2, 24, 16);
      ctx.fillRect(8, 0, 16, 18);
      ctx.fillStyle = PAL.leafPinkLight;
      ctx.fillRect(8, 2, 16, 12);
      ctx.fillRect(12, 0, 8, 14);
      // Petals
      ctx.fillStyle = '#fff';
      ctx.fillRect(10, 4, 2, 2);
      ctx.fillRect(18, 6, 2, 2);
      ctx.fillRect(14, 10, 2, 2);
      ctx.fillRect(22, 3, 2, 2);
    }
  });
}

// ==================
// NPC Sprite Texture
// ==================

export function createNpcTex(type = 'emotional_therapist') {
  const colors = PAL.npcTypes[type] || PAL.npcTypes.emotional_therapist;
  return makeTexture(TS, TS + 4, (ctx) => {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(16, TS, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pixel character (16x16 pixel art at 2x)
    const S = 2;
    // Feet
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(9*S, 14*S, 3*S, 2*S);
    ctx.fillRect(4*S, 14*S, 3*S, 2*S);
    // Legs
    ctx.fillStyle = '#607080';
    ctx.fillRect(4*S, 12*S, 3*S, 2*S);
    ctx.fillRect(9*S, 12*S, 3*S, 2*S);
    // Body
    ctx.fillStyle = colors.main;
    ctx.fillRect(3*S, 7*S, 10*S, 5*S);
    // Collar detail
    ctx.fillStyle = colors.dark;
    ctx.fillRect(3*S, 7*S, 10*S, 1*S);
    ctx.fillRect(7*S, 8*S, 2*S, 4*S);
    // Arms
    ctx.fillStyle = colors.light;
    ctx.fillRect(1*S, 8*S, 2*S, 4*S);
    ctx.fillRect(13*S, 8*S, 2*S, 4*S);
    // Head
    ctx.fillStyle = '#fdd8b5';
    ctx.fillRect(4*S, 2*S, 8*S, 5*S);
    // Hair
    ctx.fillStyle = colors.dark;
    ctx.fillRect(3*S, 1*S, 10*S, 2*S);
    ctx.fillRect(3*S, 2*S, 2*S, 4*S);
    ctx.fillRect(11*S, 2*S, 2*S, 4*S);
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(5*S, 4*S, 3*S, 2*S);
    ctx.fillRect(9*S, 4*S, 3*S, 2*S);
    ctx.fillStyle = '#333';
    ctx.fillRect(6*S, 4*S, 2*S, 2*S);
    ctx.fillRect(10*S, 4*S, 2*S, 2*S);
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.fillRect(6*S, 4*S, 1*S, 1*S);
    ctx.fillRect(10*S, 4*S, 1*S, 1*S);
    // Mouth
    ctx.fillStyle = '#e08080';
    ctx.fillRect(7*S, 6*S, 2*S, 1*S);
  });
}

export function createPlayerTex() {
  return makeTexture(TS, TS + 4, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(16, TS, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const S = 2;
    // Feet
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(9*S, 14*S, 3*S, 2*S);
    ctx.fillRect(4*S, 14*S, 3*S, 2*S);
    // Legs
    ctx.fillStyle = '#405060';
    ctx.fillRect(4*S, 12*S, 3*S, 2*S);
    ctx.fillRect(9*S, 12*S, 3*S, 2*S);
    // Body (green adventurer)
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(3*S, 7*S, 10*S, 5*S);
    ctx.fillStyle = '#388e3c';
    ctx.fillRect(3*S, 7*S, 10*S, 1*S);
    ctx.fillRect(7*S, 8*S, 2*S, 4*S);
    // Arms
    ctx.fillStyle = '#fdd8b5';
    ctx.fillRect(1*S, 8*S, 2*S, 4*S);
    ctx.fillRect(13*S, 8*S, 2*S, 4*S);
    // Head
    ctx.fillStyle = '#fdd8b5';
    ctx.fillRect(4*S, 2*S, 8*S, 5*S);
    // Hair
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(3*S, 1*S, 10*S, 2*S);
    ctx.fillRect(3*S, 2*S, 2*S, 3*S);
    ctx.fillRect(11*S, 2*S, 2*S, 3*S);
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(5*S, 4*S, 3*S, 2*S);
    ctx.fillRect(9*S, 4*S, 3*S, 2*S);
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(6*S, 4*S, 2*S, 2*S);
    ctx.fillRect(10*S, 4*S, 2*S, 2*S);
    ctx.fillStyle = '#fff';
    ctx.fillRect(6*S, 4*S, 1*S, 1*S);
    ctx.fillRect(10*S, 4*S, 1*S, 1*S);
    // Crown
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(5*S, 0, 6*S, 1*S);
    ctx.fillRect(6*S, -1*S, 4*S, 1*S);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(7*S, 0, 2*S, 1*S);
  });
}

// ==================
// Decoration Textures
// ==================

export function createFenceTex() {
  return makeTexture(TS, TS, (ctx) => {
    ctx.fillStyle = PAL.woodLight;
    ctx.fillRect(2, 10, 4, 18);
    ctx.fillRect(26, 10, 4, 18);
    ctx.fillRect(0, 14, TS, 4);
    ctx.fillRect(0, 24, TS, 4);
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(2, 10, 4, 2);
    ctx.fillRect(26, 10, 4, 2);
  });
}

export function createBenchTex() {
  return makeTexture(TS, 20, (ctx) => {
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(4, 12, 4, 8);
    ctx.fillRect(24, 12, 4, 8);
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(0, 8, TS, 5);
    ctx.fillStyle = PAL.woodLight;
    ctx.fillRect(2, 4, 28, 3);
    ctx.fillRect(0, 7, TS, 2);
  });
}

export function createLampTex() {
  return makeTexture(TS, TS + 8, (ctx) => {
    ctx.fillStyle = '#444';
    ctx.fillRect(14, 10, 4, 24);
    ctx.fillRect(10, 30, 12, 4);
    ctx.fillStyle = '#f0c040';
    ctx.fillRect(8, 0, 16, 12);
    ctx.fillStyle = '#ffe88a';
    ctx.fillRect(10, 2, 12, 8);
    // Glow
    ctx.fillStyle = 'rgba(240,192,64,0.12)';
    ctx.beginPath();
    ctx.arc(16, 6, 18, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function createWellTex() {
  return makeTexture(TS, TS, (ctx) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(4, 16, 24, 14);
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(6, 18, 20, 10);
    ctx.fillStyle = '#3060a0';
    ctx.fillRect(8, 20, 16, 6);
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(6, 4, 4, 16);
    ctx.fillRect(22, 4, 4, 16);
    ctx.fillStyle = PAL.roofBrown;
    ctx.fillRect(2, 0, 28, 6);
  });
}

export function createSignTex(text = '') {
  return makeTexture(TS, TS, (ctx) => {
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(13, 16, 6, 16);
    ctx.fillStyle = PAL.woodLight;
    ctx.fillRect(2, 2, 28, 16);
    ctx.fillStyle = PAL.wood;
    ctx.strokeStyle = PAL.wood;
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, 28, 16);
    ctx.fillStyle = '#402010';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 16, 14);
  });
}
