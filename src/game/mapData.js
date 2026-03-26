/**
 * Town Map Data — 50x38 tile grid
 * 0=grass, 1=dirt_path, 2=stone, 3=water
 */

const W = 50, H = 38;

export function generateTileMap() {
  const map = [];
  for (let y = 0; y < H; y++) {
    map[y] = [];
    for (let x = 0; x < W; x++) {
      // Center paths (cross shape)
      if ((x >= 24 && x <= 25) || (y >= 18 && y <= 19)) {
        map[y][x] = 1;
      }
      // Center plaza
      else if (x >= 21 && x <= 28 && y >= 16 && y <= 21) {
        map[y][x] = 2;
      }
      // Small ponds
      else if ((x >= 19 && x <= 20 && y >= 8 && y <= 9) ||
               (x >= 43 && x <= 44 && y >= 30 && y <= 31)) {
        map[y][x] = 3;
      }
      // Extra paths to buildings
      else if ((y === 4 && x >= 5 && x <= 7) || (y === 4 && x >= 30 && x <= 33) ||
               (y === 24 && x >= 5 && x <= 7) || (y === 24 && x >= 30 && x <= 33)) {
        map[y][x] = 1;
      }
      else {
        map[y][x] = 0;
      }
    }
  }
  return map;
}

export const BUILDINGS = [
  // Zone: female_active (top-left) — warm colors
  { x: 3, y: 2, w: 3, h: 2, roof: '#b83030', wall: '#f5efe5' },
  { x: 10, y: 1, w: 2, h: 2, roof: '#c06030', wall: '#f0d0d0' },
  { x: 17, y: 3, w: 2, h: 2, roof: '#a04040', wall: '#ede0c8' },
  // Zone: male_active (top-right) — cool colors
  { x: 28, y: 2, w: 3, h: 2, roof: '#3060a0', wall: '#f5efe5' },
  { x: 36, y: 1, w: 2, h: 2, roof: '#306080', wall: '#e0e8f0' },
  { x: 44, y: 3, w: 2, h: 2, roof: '#4070b0', wall: '#f5efe5' },
  // Zone: female_inactive (bottom-left) — purple tones
  { x: 3, y: 22, w: 3, h: 2, roof: '#805090', wall: '#f0e0f0' },
  { x: 12, y: 24, w: 2, h: 2, roof: '#704080', wall: '#ede0c8' },
  // Zone: male_inactive (bottom-right) — warm earth
  { x: 28, y: 22, w: 3, h: 2, roof: '#806030', wall: '#ede0c8' },
  { x: 40, y: 24, w: 2, h: 2, roof: '#907040', wall: '#f5efe5' },
  // Center — gold
  { x: 23, y: 16, w: 4, h: 2, roof: '#b09030', wall: '#fffde7' },
];

export const TREES = [
  // Border trees
  ...[0,2,4,6,8,10,12,14,16].map(y => ({ x: 0, y, style: 'pine' })),
  ...[0,2,4,6,8,10,12,14,16].map(y => ({ x: 49, y, style: 'pine' })),
  ...[20,22,24,26,28,30,32,34,36].map(y => ({ x: 0, y, style: 'oak' })),
  ...[20,22,24,26,28,30,32,34,36].map(y => ({ x: 49, y, style: 'oak' })),

  // Zone fl (cherry/pink)
  { x: 6, y: 5, style: 'cherry' }, { x: 14, y: 7, style: 'cherry' },
  { x: 3, y: 12, style: 'cherry' }, { x: 20, y: 4, style: 'cherry' },
  { x: 9, y: 14, style: 'cherry' }, { x: 16, y: 10, style: 'cherry' },
  { x: 1, y: 9, style: 'oak' }, { x: 22, y: 6, style: 'cherry' },

  // Zone fr (oak)
  { x: 27, y: 5, style: 'oak' }, { x: 33, y: 7, style: 'oak' },
  { x: 40, y: 4, style: 'oak' }, { x: 46, y: 8, style: 'pine' },
  { x: 35, y: 12, style: 'oak' }, { x: 30, y: 14, style: 'pine' },
  { x: 42, y: 12, style: 'oak' }, { x: 47, y: 3, style: 'pine' },

  // Zone bl (pine)
  { x: 5, y: 25, style: 'pine' }, { x: 12, y: 28, style: 'pine' },
  { x: 3, y: 32, style: 'pine' }, { x: 18, y: 26, style: 'pine' },
  { x: 7, y: 35, style: 'oak' }, { x: 15, y: 30, style: 'pine' },

  // Zone br (mixed)
  { x: 27, y: 25, style: 'oak' }, { x: 33, y: 28, style: 'oak' },
  { x: 40, y: 25, style: 'oak' }, { x: 46, y: 30, style: 'pine' },
  { x: 35, y: 33, style: 'oak' }, { x: 30, y: 35, style: 'pine' },

  // Center flanking
  { x: 20, y: 15, style: 'cherry' }, { x: 29, y: 15, style: 'cherry' },
  { x: 20, y: 21, style: 'cherry' }, { x: 29, y: 21, style: 'cherry' },
];

export const DECORATIONS = [
  // Fences along the center paths
  { type: 'fence', x: 8, y: 17 }, { type: 'fence', x: 9, y: 17 }, { type: 'fence', x: 10, y: 17 },
  { type: 'fence', x: 34, y: 17 }, { type: 'fence', x: 35, y: 17 }, { type: 'fence', x: 36, y: 17 },
  { type: 'fence', x: 8, y: 20 }, { type: 'fence', x: 9, y: 20 }, { type: 'fence', x: 10, y: 20 },
  { type: 'fence', x: 34, y: 20 }, { type: 'fence', x: 35, y: 20 }, { type: 'fence', x: 36, y: 20 },
  // Benches
  { type: 'bench', x: 22, y: 17 }, { type: 'bench', x: 27, y: 17 },
  { type: 'bench', x: 22, y: 20 }, { type: 'bench', x: 27, y: 20 },
  // Lamps
  { type: 'lamp', x: 21, y: 16 }, { type: 'lamp', x: 28, y: 16 },
  { type: 'lamp', x: 21, y: 21 }, { type: 'lamp', x: 28, y: 21 },
  // Well
  { type: 'well', x: 25, y: 18 },
  // Signs
  { type: 'sign', x: 12, y: 18, text: '♀活跃' },
  { type: 'sign', x: 37, y: 18, text: '♂活跃' },
  { type: 'sign', x: 12, y: 19, text: '♀轻度' },
  { type: 'sign', x: 37, y: 19, text: '♂轻度' },
];

export const MAP_WIDTH = W;
export const MAP_HEIGHT = H;
