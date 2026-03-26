/**
 * 洋葱小镇 — Custom-designed tilemap
 * Uses gentle-obj.png tileset (45 cols x 32 rows, 32px tiles)
 *
 * Map Layout (40 x 30 tiles):
 *
 *   ┌──────────────────────────────────────────┐
 *   │ 🌲🌲🌲🌲🌲  FOREST BORDER  🌲🌲🌲🌲🌲 │
 *   │ 🌲                                   🌲 │
 *   │ 🌲  ┌─────────┐     ┌──────────┐    🌲 │
 *   │ 🌲  │ 🏡 居民区  │ ══ │  🌳 公园   │   🌲 │
 *   │ 🌲  │  Houses  │     │   Park    │   🌲 │
 *   │ 🌲  └────┬─────┘     └─────┬────┘   🌲 │
 *   │ 🌲       ║                  ║        🌲 │
 *   │ 🌲  ═════╬══════════════════╬═════  🌲 │
 *   │ 🌲       ║    ┌────────┐    ║       🌲 │
 *   │ 🌲       ║    │ 🏛 广场 │    ║       🌲 │
 *   │ 🌲       ║    │ Plaza  │    ║       🌲 │
 *   │ 🌲       ║    └───┬────┘    ║       🌲 │
 *   │ 🌲  ═════╬════════╬════════╬═════  🌲 │
 *   │ 🌲       ║        ║        ║       🌲 │
 *   │ 🌲  ┌────┴───┐ ┌──┴───┐  ┌┴────┐  🌲 │
 *   │ 🌲  │ 🌊 湖边 │ │🏕营地│  │🌲森林│  🌲 │
 *   │ 🌲  │  Lake  │ │ Camp │  │Woods│  🌲 │
 *   │ 🌲  └────────┘ └──────┘  └─────┘  🌲 │
 *   │ 🌲🌲🌲🌲🌲  FOREST BORDER  🌲🌲🌲🌲🌲 │
 *   └──────────────────────────────────────────┘
 */

const W = 40, H = 30;
const TC = 45; // tileset columns

// Tile indices in gentle-obj.png (col + row * 45)
const T = {
  // Grass
  GRASS: 271,        // plain grass
  GRASS2: 272,       // grass variant
  GRASS3: 316,       // grass variant 2
  GRASS_DARK: 451,   // darker grass
  GRASS_FLOWER: 317, // grass with flowers

  // Paths
  PATH_H: 962,       // horizontal path
  PATH_V: 962,       // vertical path (same tile, context-dependent)
  PATH_STONE: 1007,  // stone path
  DIRT: 226,          // dirt ground
  DIRT2: 227,         // dirt variant

  // Water
  WATER: 1270,        // water tile
  WATER2: 1271,       // water variant
  WATER_EDGE_T: 1223, // water top edge
  WATER_EDGE_B: 1268, // water bottom edge
  WATER_EDGE_L: 1225, // water left edge
  WATER_EDGE_R: 1226, // water right edge

  // Trees (in objmap layer)
  TREE1: 499,         // tree top
  TREE2: 544,         // tree bottom
  TREE_PINE: 497,     // pine tree

  // Buildings (approximate — using common building tiles)
  WALL: 180,          // wall
  WALL2: 225,         // wall variant
  ROOF: 315,          // roof
  DOOR: 270,          // door
  WINDOW: 140,        // window
  FLOOR: 405,         // floor/interior

  // Decorations
  FENCE_H: 594,       // horizontal fence
  FENCE_V: 595,       // vertical fence
  SIGN: 675,          // signpost
  BARREL: 642,        // barrel
  CRATE: 641,         // crate
  FLOWER_RED: 551,    // flower
  FLOWER_YELLOW: 552, // flower
  BUSH: 541,          // bush
  ROCK: 586,          // rock
  ROCK2: 631,         // rock variant
  STUMP: 632,         // tree stump
  WELL: 684,          // well top
  BENCH: 685,         // bench
  LAMP: 686,          // lamp post
};

// ==================
// Map Generation
// ==================

function createBlankLayer(fill = T.GRASS) {
  const layer = [];
  for (let y = 0; y < H; y++) {
    layer[y] = [];
    for (let x = 0; x < W; x++) {
      layer[y][x] = fill;
    }
  }
  return layer;
}

function fillRect(layer, x1, y1, w, h, tile) {
  for (let y = y1; y < Math.min(y1 + h, H); y++)
    for (let x = x1; x < Math.min(x1 + w, W); x++)
      layer[y][x] = tile;
}

function fillRandom(layer, x1, y1, w, h, tiles) {
  for (let y = y1; y < Math.min(y1 + h, H); y++)
    for (let x = x1; x < Math.min(x1 + w, W); x++)
      layer[y][x] = tiles[(x * 7 + y * 13) % tiles.length];
}

function drawPath(layer, x1, y1, x2, y2, tile = T.PATH_STONE, width = 2) {
  // Horizontal segment
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  for (let x = minX; x <= maxX; x++)
    for (let w = 0; w < width; w++)
      if (y1 + w < H) layer[y1 + w][x] = tile;
  // Vertical segment
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  for (let y = minY; y <= maxY; y++)
    for (let w = 0; w < width; w++)
      if (x2 + w < W) layer[y][x2 + w] = tile;
}

export function generateTownMap() {
  const bg = createBlankLayer(T.GRASS);
  const obj = createBlankLayer(0); // 0 = empty/transparent

  // ========== 1. BASE TERRAIN ==========

  // Varied grass base (not uniform)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const noise = (x * 7 + y * 13 + x * y) % 20;
      if (noise < 12) bg[y][x] = T.GRASS;
      else if (noise < 16) bg[y][x] = T.GRASS2;
      else if (noise < 18) bg[y][x] = T.GRASS3;
      else bg[y][x] = T.GRASS_DARK;
    }
  }

  // ========== 2. FOREST BORDER ==========
  // Dense trees around edges (irregular, not wall-like)
  const forestTiles = [T.TREE1, T.TREE_PINE, T.GRASS_DARK];

  // Top border (irregular depth)
  for (let x = 0; x < W; x++) {
    const depth = 2 + ((x * 3 + 5) % 3); // 2-4 tiles deep
    for (let y = 0; y < depth; y++) {
      bg[y][x] = T.GRASS_DARK;
      if (y < depth - 1) obj[y][x] = forestTiles[(x + y) % 2 === 0 ? 0 : 1];
    }
  }
  // Bottom border
  for (let x = 0; x < W; x++) {
    const depth = 2 + ((x * 5 + 3) % 3);
    for (let y = H - depth; y < H; y++) {
      bg[y][x] = T.GRASS_DARK;
      if (y > H - depth) obj[y][x] = forestTiles[(x + y) % 3];
    }
  }
  // Left border
  for (let y = 0; y < H; y++) {
    const depth = 2 + ((y * 3 + 7) % 3);
    for (let x = 0; x < depth; x++) {
      bg[y][x] = T.GRASS_DARK;
      if (x < depth - 1 && !obj[y][x]) obj[y][x] = forestTiles[(x + y) % 2];
    }
  }
  // Right border
  for (let y = 0; y < H; y++) {
    const depth = 2 + ((y * 5 + 1) % 3);
    for (let x = W - depth; x < W; x++) {
      bg[y][x] = T.GRASS_DARK;
      if (x > W - depth && !obj[y][x]) obj[y][x] = forestTiles[(x + y) % 2];
    }
  }

  // ========== 3. MAIN PATHS (connecting all zones) ==========

  // Central cross road
  const centerX = 19, centerY = 14;

  // Main horizontal road
  fillRect(bg, 4, 13, 32, 2, T.PATH_STONE);
  // Main vertical road
  fillRect(bg, 19, 4, 2, 22, T.PATH_STONE);

  // Path to residential area (top-left)
  fillRect(bg, 6, 6, 2, 7, T.DIRT);
  fillRect(bg, 6, 6, 8, 2, T.DIRT);

  // Path to park (top-right)
  fillRect(bg, 27, 6, 2, 7, T.DIRT);
  fillRect(bg, 27, 6, 8, 2, T.DIRT);

  // Path to lake (bottom-left)
  fillRect(bg, 8, 15, 2, 8, T.DIRT);

  // Path to camp (bottom-center)
  fillRect(bg, 19, 15, 2, 7, T.DIRT);

  // Path to forest (bottom-right)
  fillRect(bg, 30, 15, 2, 6, T.DIRT);

  // ========== 4. TOWN PLAZA (center - main landmark) ==========

  // Plaza ground (stone square)
  fillRect(bg, 16, 11, 8, 6, T.PATH_STONE);
  // Inner decorated area
  fillRect(bg, 17, 12, 6, 4, T.DIRT);
  fillRect(bg, 18, 13, 4, 2, T.FLOOR);

  // Plaza decorations (obj layer)
  obj[12][19] = T.WELL;      // Central well (landmark!)
  obj[12][20] = T.LAMP;      // Lamp post
  obj[11][17] = T.SIGN;      // Signpost
  obj[11][22] = T.SIGN;      // Signpost
  obj[15][17] = T.BENCH;     // Bench
  obj[15][22] = T.BENCH;     // Bench
  obj[12][16] = T.FLOWER_RED; // Flowers around plaza
  obj[12][23] = T.FLOWER_YELLOW;
  obj[15][16] = T.FLOWER_RED;
  obj[15][23] = T.FLOWER_YELLOW;
  obj[11][19] = T.BARREL;    // Barrel near well
  obj[11][20] = T.CRATE;     // Crate

  // ========== 5. RESIDENTIAL AREA (top-left) ==========

  // Ground: dirt/cleared area around houses
  fillRect(bg, 4, 4, 12, 8, T.DIRT);
  fillRandom(bg, 4, 4, 12, 8, [T.DIRT, T.DIRT2, T.DIRT]);

  // House 1 (large)
  fillRect(bg, 5, 5, 4, 3, T.FLOOR);
  obj[4][5] = T.ROOF; obj[4][6] = T.ROOF; obj[4][7] = T.ROOF; obj[4][8] = T.ROOF;
  obj[5][5] = T.WALL; obj[5][6] = T.WINDOW; obj[5][7] = T.DOOR; obj[5][8] = T.WALL;
  obj[6][5] = T.WALL; obj[6][6] = T.WALL; obj[6][7] = T.WALL; obj[6][8] = T.WALL;

  // House 2 (small)
  fillRect(bg, 11, 5, 3, 3, T.FLOOR);
  obj[4][11] = T.ROOF; obj[4][12] = T.ROOF; obj[4][13] = T.ROOF;
  obj[5][11] = T.WALL; obj[5][12] = T.DOOR; obj[5][13] = T.WALL;
  obj[6][11] = T.WALL; obj[6][12] = T.WALL; obj[6][13] = T.WALL;

  // Garden decorations
  obj[8][5] = T.FLOWER_RED; obj[8][6] = T.FLOWER_YELLOW; obj[8][7] = T.FLOWER_RED;
  obj[8][8] = T.BUSH;
  obj[9][5] = T.BARREL; obj[9][6] = T.CRATE;
  obj[7][10] = T.FENCE_H; obj[7][11] = T.FENCE_H; obj[7][12] = T.FENCE_H;
  obj[9][10] = T.LAMP;
  obj[8][13] = T.BUSH; obj[9][13] = T.BUSH;
  obj[10][5] = T.STUMP; obj[10][8] = T.ROCK;

  // ========== 6. PARK AREA (top-right) ==========

  // Grassy park with trees and benches
  fillRandom(bg, 25, 4, 12, 8, [T.GRASS, T.GRASS2, T.GRASS3, T.GRASS_FLOWER]);

  // Park paths (stone walkways)
  fillRect(bg, 29, 5, 1, 6, T.PATH_STONE);
  fillRect(bg, 26, 8, 8, 1, T.PATH_STONE);

  // Scattered trees
  obj[5][26] = T.TREE1; obj[5][28] = T.TREE_PINE;
  obj[5][32] = T.TREE1; obj[5][34] = T.TREE_PINE;
  obj[9][26] = T.TREE1; obj[9][33] = T.TREE1;
  obj[7][31] = T.TREE_PINE;

  // Park furniture
  obj[8][28] = T.BENCH; obj[8][30] = T.BENCH;
  obj[6][29] = T.LAMP;
  obj[10][29] = T.FLOWER_RED; obj[10][30] = T.FLOWER_YELLOW; obj[10][31] = T.FLOWER_RED;
  obj[6][33] = T.ROCK; obj[7][34] = T.BUSH;
  obj[10][26] = T.SIGN; // Park sign

  // ========== 7. LAKE AREA (bottom-left) ==========

  // Water body
  fillRect(bg, 5, 18, 8, 5, T.WATER);
  fillRandom(bg, 5, 18, 8, 5, [T.WATER, T.WATER2, T.WATER]);

  // Shore transitions (dirt around water)
  fillRect(bg, 4, 17, 10, 1, T.DIRT);  // top shore
  fillRect(bg, 4, 23, 10, 1, T.DIRT);  // bottom shore
  fillRect(bg, 4, 17, 1, 7, T.DIRT);   // left shore
  fillRect(bg, 13, 17, 1, 7, T.DIRT);  // right shore

  // Shore decorations
  obj[17][5] = T.ROCK; obj[17][7] = T.ROCK2; obj[17][10] = T.ROCK;
  obj[23][6] = T.BUSH; obj[23][8] = T.BUSH; obj[23][11] = T.ROCK2;
  obj[19][4] = T.BUSH; obj[21][4] = T.ROCK;
  obj[17][12] = T.STUMP;
  obj[16][7] = T.SIGN; // "Lake" sign
  obj[16][9] = T.BENCH; // Fishing bench
  obj[24][5] = T.FLOWER_RED; obj[24][7] = T.FLOWER_YELLOW;

  // ========== 8. CAMPSITE (bottom-center) ==========

  // Cleared ground
  fillRect(bg, 16, 18, 8, 6, T.DIRT);
  fillRandom(bg, 16, 18, 8, 6, [T.DIRT, T.DIRT2, T.DIRT]);

  // Camp items cluster
  obj[19][18] = T.BARREL; obj[19][19] = T.CRATE; obj[19][20] = T.BARREL;
  obj[20][17] = T.STUMP;  // sitting stump
  obj[20][22] = T.STUMP;  // sitting stump
  obj[21][19] = T.LAMP;   // campfire (using lamp as substitute)
  obj[21][20] = T.ROCK;   // fire ring
  obj[22][18] = T.CRATE; obj[22][21] = T.BARREL;
  obj[18][17] = T.FENCE_H; obj[18][18] = T.FENCE_H; obj[18][19] = T.FENCE_H;
  obj[18][21] = T.FENCE_H; obj[18][22] = T.FENCE_H; obj[18][23] = T.FENCE_H;
  obj[23][19] = T.FLOWER_RED; obj[23][20] = T.BUSH;
  obj[17][20] = T.SIGN; // Camp sign

  // ========== 9. FOREST CLEARING (bottom-right) ==========

  // Dense trees with small clearing
  fillRect(bg, 27, 18, 10, 6, T.GRASS_DARK);

  // Trees (dense)
  for (let y = 18; y < 24; y++) {
    for (let x = 27; x < 37; x++) {
      if ((x + y) % 3 === 0 || (x * y) % 5 === 0) {
        obj[y][x] = [(x + y) % 2 === 0 ? T.TREE1 : T.TREE_PINE][(0)];
      }
    }
  }
  // Small clearing in the middle
  fillRect(bg, 30, 20, 3, 2, T.DIRT);
  obj[20][30] = 0; obj[20][31] = 0; obj[20][32] = 0;
  obj[21][30] = 0; obj[21][31] = 0; obj[21][32] = 0;
  obj[20][31] = T.STUMP; // lonely stump in clearing
  obj[21][30] = T.ROCK; obj[21][32] = T.BUSH;
  obj[17][31] = T.SIGN; // Forest sign

  // ========== 10. SCATTERED DETAILS ==========

  // Flowers along main paths
  for (let x = 5; x < 35; x += 3) {
    if (!obj[12][x]) obj[12][x] = T.FLOWER_RED;
    if (!obj[14][x] && bg[14][x] !== T.PATH_STONE) obj[14][x] = T.FLOWER_YELLOW;
  }

  // Rocks and bushes in transition areas
  obj[13][4] = T.ROCK; obj[13][36] = T.ROCK;
  obj[14][5] = T.BUSH; obj[14][35] = T.BUSH;

  // Extra trees in gaps
  obj[10][16] = T.TREE1; obj[10][23] = T.TREE_PINE;
  obj[16][14] = T.TREE1; obj[16][25] = T.TREE1;
  obj[24][14] = T.TREE_PINE; obj[24][25] = T.TREE_PINE;

  return {
    bg: [bg],      // background layer
    obj: [obj],    // object layer
    width: W,
    height: H,
  };
}

// Zone definitions for NPC placement
export const ZONES = {
  residential: { label: '🏡 豪宅花园区', sub: '活跃付费用户的家', x: 4, y: 4, w: 12, h: 8, color: '#ffd700' },
  plaza:       { label: '🏛️ 镇中心广场', sub: '小镇的心脏', x: 16, y: 11, w: 8, h: 6, color: '#ffffff' },
  park:        { label: '🌳 洋葱公园', sub: '散步与交流', x: 25, y: 4, w: 12, h: 8, color: '#90caf9' },
  lake:        { label: '🌊 静心湖畔', sub: '独处与思考', x: 4, y: 17, w: 10, h: 7, color: '#4fc3f7' },
  camp:        { label: '🏕️ 探索者营地', sub: '冒险者聚集地', x: 16, y: 18, w: 8, h: 6, color: '#ff9800' },
  forest:      { label: '🌲 迷雾森林', sub: '未知区域', x: 27, y: 18, w: 10, h: 6, color: '#66bb6a' },
};

// NPC positions for Smallville map (45w x 32h)
// Top-left (0-15, 0-12): buildings → 豪宅花园区
// Top-right (25-44, 0-12): park → 洋葱公园
// Center (15-30, 12-20): open paths → 镇中心广场
// Bottom-left (0-15, 20-32): nature → 静心湖畔
// Bottom-right (25-44, 20-32): forest → 迷雾森林
export const NPC_PLACEMENTS = [
  // 豪宅花园区 (top-left buildings) — active power users
  { x: 5, y: 6, zone: 'residential' },    // user_1
  { x: 9, y: 4, zone: 'residential' },    // user2
  { x: 12, y: 8, zone: 'residential' },   // user3
  { x: 4, y: 10, zone: 'residential' },   // user4

  // 镇中心广场 (center) — social/active users
  { x: 20, y: 15, zone: 'plaza' },        // user5
  { x: 24, y: 17, zone: 'plaza' },        // user6
  { x: 18, y: 18, zone: 'plaza' },        // user7

  // 洋葱公园 (top-right) — moderate users
  { x: 30, y: 5, zone: 'park' },          // user8
  { x: 35, y: 8, zone: 'park' },          // user9
  { x: 32, y: 10, zone: 'park' },         // user10

  // 静心湖畔 (bottom-left) — introspective users
  { x: 6, y: 24, zone: 'lake' },          // user11
  { x: 10, y: 26, zone: 'lake' },         // user12

  // 迷雾森林 (bottom-right) — explorers
  { x: 30, y: 24, zone: 'forest' },       // userx
];

export const MAP_WIDTH = W;
export const MAP_HEIGHT = H;
