import { useState, useEffect, useRef, useCallback } from 'react';
import { Application, Assets, Container, Sprite, Graphics, Text, TextStyle, Texture, Rectangle } from 'pixi.js';
import { bgtiles, objmap, screenxtiles, screenytiles, tilesetpxw, tilesetpxh } from './game/gentleMap.js';
import { ZONES } from './game/townMap.js';
import { getCharacters, getCharacterById } from './data/characterAdapter';
import ChatPanel from './components/ChatPanel';
import Mailbox from './components/Mailbox';
import BirthModal from './components/BirthModal';
import PersonaSelect from './components/PersonaSelect';
import NotificationBadge from './components/NotificationBadge';
import {
  getUnreadCounts,
  addUnread,
  markAsRead,
  getPersona,
  savePersona,
  getAllPersonas,
  addPersona,
  updatePersona,
  deletePersona,
  setActivePersona,
  shouldRunDailyLetterCron,
  markDailyLetterCronRun,
  collectDailyLetterPayload,
} from './utils/memory';
import { triggerTick, runDailyLetter } from './utils/api';
import './index.css';

const WANG_DAFAN_ID = 'wang-dafan';

const TS = 32;
const TILESET_COLS = 45;

function App() {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [panelMode, setPanelMode] = useState('chat'); // 'chat' | 'mailbox'
  const [timeStr, setTimeStr] = useState('');
  const [isNight, setIsNight] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [screen, setScreen] = useState('select'); // 'select' | 'create' | 'game'
  const [persona, setPersona] = useState(() => getPersona());
  const [editingPersona, setEditingPersona] = useState(null);
  const musicRef = useRef(null);

  const characters = getCharacters();

  const destroyPixi = useCallback(() => {
    if (appRef.current) {
      appRef.current.destroy(true);
      appRef.current = null;
      if (canvasRef.current) canvasRef.current.innerHTML = '';
    }
  }, []);

  const handleSelectPersona = useCallback((p) => {
    setActivePersona(p.id);
    setPersona(p);
    setScreen('game');
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingPersona(null);
    setScreen('create');
  }, []);

  const handleEditCurrent = useCallback(() => {
    setEditingPersona(persona);
    setScreen('create');
  }, [persona]);

  const handleBirthComplete = useCallback((data) => {
    let saved;
    if (data.id) {
      updatePersona(data.id, data);
      saved = data;
    } else {
      saved = addPersona(data);
    }
    setActivePersona(saved.id);
    setPersona(saved);
    setScreen('game');
    destroyPixi();
  }, [destroyPixi]);

  const handleBirthBack = useCallback(() => {
    setScreen('select');
    setEditingPersona(null);
  }, []);

  const [, forceUpdate] = useState(0);
  const handleDeletePersona = useCallback((id) => {
    deletePersona(id);
    forceUpdate(n => n + 1);
  }, []);

  // Music toggle
  const toggleMusic = () => {
    if (!musicRef.current) {
      musicRef.current = new Audio('/assets/town-bgm.mp3');
      musicRef.current.loop = true;
      musicRef.current.volume = 0.3;
    }
    if (musicPlaying) {
      musicRef.current.pause();
    } else {
      musicRef.current.play().catch(() => {});
    }
    setMusicPlaying(!musicPlaying);
  };

  // Time update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
      const hour = now.getHours();
      setIsNight(hour < 6 || hour >= 20);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load unread counts
  useEffect(() => {
    setUnreadCounts(getUnreadCounts());
  }, []);

  // Scheduler tick on mount
  useEffect(() => {
    triggerTick().catch(() => {});
  }, []);

  // Daily letter (王大凡 → Bo): 每个本地日最多一次；有未读信则跳过；否则由模型决定是否写信
  useEffect(() => {
    if (screen !== 'game' || !persona?.id) return;
    let cancelled = false;
    (async () => {
      try {
        if (!shouldRunDailyLetterCron(persona.id, WANG_DAFAN_ID)) return;
        const payload = await collectDailyLetterPayload(WANG_DAFAN_ID);
        if (!payload || cancelled) return;
        if (payload.has_unread) {
          markDailyLetterCronRun(persona.id, WANG_DAFAN_ID);
          return;
        }
        const res = await runDailyLetter(payload);
        if (cancelled) return;
        markDailyLetterCronRun(persona.id, WANG_DAFAN_ID);
        if (res?.letter) {
          addUnread(WANG_DAFAN_ID, 1);
          setUnreadCounts(getUnreadCounts());
        }
      } catch {
        /* API 失败不标记今日已跑，下次进入游戏会重试 */
      }
    })();
    return () => { cancelled = true; };
  }, [screen, persona?.id]);

  // PixiJS initialization
  useEffect(() => {
    if (appRef.current || screen !== 'game') return;
    const init = async () => {
      const app = new Application();
      await app.init({
        width: Math.floor(window.innerWidth * 0.7),
        height: window.innerHeight,
        backgroundColor: isNight ? 0x1a1f2a : 0x4a7a3a,
        antialias: false,
        resolution: 1,
      });
      appRef.current = app;
      canvasRef.current.appendChild(app.canvas);
      app.canvas.style.imageRendering = 'pixelated';

      const world = new Container();
      app.stage.addChild(world);

      // Load tileset
      const tilesetTex = await Assets.load('/assets/gentle-obj.png');
      const baseTex = tilesetTex.source;

      function getTileTex(index) {
        if (index < 0) return null;
        const col = index % TILESET_COLS;
        const row = Math.floor(index / TILESET_COLS);
        return new Texture({ source: baseTex, frame: new Rectangle(col * TS, row * TS, TS, TS) });
      }

      // Render map
      const allLayers = [...bgtiles, ...objmap];
      const numCols = bgtiles[0]?.length || 0;
      const numRows = bgtiles[0]?.[0]?.length || 0;
      for (let x = 0; x < numCols; x++) {
        for (let y = 0; y < numRows; y++) {
          for (const layer of allLayers) {
            const tileIndex = layer[x]?.[y];
            if (tileIndex == null || tileIndex === -1) continue;
            const tex = getTileTex(tileIndex);
            if (tex) {
              const s = new Sprite(tex);
              s.x = x * TS;
              s.y = y * TS;
              world.addChild(s);
            }
          }
        }
      }

      // Entity layer
      const entityLayer = new Container();
      entityLayer.sortableChildren = true;
      world.addChild(entityLayer);

      // Character sprites
      const charTex = await Assets.load('/assets/characters.png');
      const charBase = charTex.source;
      function getCharFrame(ci, dir = 0, frame = 1) {
        return new Texture({
          source: charBase,
          frame: new Rectangle((ci % 4) * 3 * 32 + frame * 32, Math.floor(ci / 4) * 4 * 32 + dir * 32, 32, 32),
        });
      }

      // Place characters on map (custom portraitUrl or sprite sheet)
      for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const pos = char.pos || { x: 20 + i * 3, y: 16 };
        const container = new Container();
        container.x = pos[0] * TS;
        container.y = pos[1] * TS;
        container.zIndex = pos[1] * TS + TS;

        let sprite;
        if (char.portraitUrl) {
          const ptex = await Assets.load(char.portraitUrl);
          sprite = new Sprite(ptex);
          const w = sprite.texture.width;
          const h = sprite.texture.height;
          const scale = TS / Math.max(w, h);
          sprite.width = w * scale;
          sprite.height = h * scale;
          sprite.anchor.set(0.5, 1);
          sprite.x = TS / 2;
          sprite.y = TS;
        } else {
          sprite = new Sprite(getCharFrame(i % 8));
        }
        container.addChild(sprite);

        // Name label
        const nt = new Text({
          text: char.name,
          style: new TextStyle({
            fontSize: 9,
            fill: '#fff',
            fontFamily: 'monospace',
            stroke: { color: '#000', width: 3 },
            fontWeight: 'bold',
          }),
        });
        nt.anchor.set(0.5, 1);
        nt.x = TS / 2;
        nt.y = -6;
        container.addChild(nt);

        container.eventMode = 'static';
        container.cursor = 'pointer';
        container.hitArea = new Rectangle(-4, -16, TS + 8, TS + 20);
        container.on('pointerover', () => {
          sprite.tint = 0xffffcc;
          container.scale.set(1.15);
        });
        container.on('pointerout', () => {
          sprite.tint = 0xffffff;
          container.scale.set(1.0);
        });
        container.on('pointertap', () => {
          setSelectedCharacter(char);
          setPanelMode('chat');
        });

        entityLayer.addChild(container);
      }

      // Player sprite — use characters.png avatar if persona is set, else player.png fallback
      const currentPersona = getPersona();
      let playerFrames;

      if (currentPersona) {
        const ci = currentPersona.avatarIndex || 0;
        const makeCharRow = (dir) =>
          [0, 1, 2].map(frame => getCharFrame(ci, dir, frame));
        playerFrames = {
          left: makeCharRow(1),
          up: makeCharRow(3),
          down: makeCharRow(0),
          right: makeCharRow(2),
        };
      } else {
        const playerTex = await Assets.load('/assets/player.png');
        const playerBase = playerTex.source;
        const makeRow = (row) =>
          [0, 1, 2].map(col => new Texture({ source: playerBase, frame: new Rectangle(col * 16, row * 16, 16, 16) }));
        playerFrames = {
          left: makeRow(0),
          up: makeRow(1),
          down: makeRow(2),
          right: makeRow(3),
        };
      }

      const playerSprite = new Sprite(playerFrames.down[1]);
      if (!currentPersona) playerSprite.scale.set(2);
      playerSprite.x = 22 * TS;
      playerSprite.y = 16 * TS;
      playerSprite.zIndex = 16 * TS + TS;
      entityLayer.addChild(playerSprite);

      const pName = new Text({
        text: currentPersona?.name || 'YOU',
        style: new TextStyle({
          fontSize: 10,
          fill: '#FFD700',
          fontFamily: 'monospace',
          stroke: { color: '#000', width: 3 },
          fontWeight: 'bold',
        }),
      });
      pName.anchor.set(0.5, 1);
      pName.x = TS / 2;
      pName.y = currentPersona ? -6 : -4;
      playerSprite.addChild(pName);

      // Camera
      const mapW = numCols * TS;
      const mapH = numRows * TS;
      const centerCamera = () => {
        world.x = -playerSprite.x + app.canvas.width / 2;
        world.y = -playerSprite.y + app.canvas.height / 2;
        world.x = Math.min(0, Math.max(-(mapW - app.canvas.width), world.x));
        world.y = Math.min(0, Math.max(-(mapH - app.canvas.height), world.y));
      };
      centerCamera();

      // Drag to pan
      let dragging = false,
        ds = { x: 0, y: 0 };
      app.canvas.addEventListener('pointerdown', e => {
        dragging = true;
        ds = { x: e.clientX - world.x, y: e.clientY - world.y };
      });
      app.canvas.addEventListener('pointermove', e => {
        if (dragging) {
          world.x = e.clientX - ds.x;
          world.y = e.clientY - ds.y;
        }
      });
      app.canvas.addEventListener('pointerup', () => {
        dragging = false;
      });

      // WASD movement
      const keys = {};
      const isTyping = e => ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);
      document.addEventListener('keydown', e => {
        if (!isTyping(e)) keys[e.key.toLowerCase()] = true;
      });
      document.addEventListener('keyup', e => {
        if (!isTyping(e)) keys[e.key.toLowerCase()] = false;
      });

      let playerDir = 'down';
      let playerFrame = 1;
      let walkTimer = 0;

      app.ticker.add(() => {
        let dx = 0,
          dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -3;
        if (keys['s'] || keys['arrowdown']) dy = 3;
        if (keys['a'] || keys['arrowleft']) dx = -3;
        if (keys['d'] || keys['arrowright']) dx = 3;

        if (dx || dy) {
          playerSprite.x = Math.max(0, Math.min(mapW - TS, playerSprite.x + dx));
          playerSprite.y = Math.max(0, Math.min(mapH - TS, playerSprite.y + dy));
          playerSprite.zIndex = playerSprite.y + TS;
          centerCamera();

          // Animation
          walkTimer += 1;
          if (walkTimer > 12) {
            walkTimer = 0;
            playerFrame = (playerFrame + 1) % 3;
          }
          if (dx < 0) playerDir = 'left';
          if (dx > 0) playerDir = 'right';
          if (dy < 0) playerDir = 'up';
          if (dy > 0) playerDir = 'down';
          playerSprite.texture = playerFrames[playerDir][playerFrame];
        } else {
          playerFrame = 1;
          playerSprite.texture = playerFrames[playerDir][playerFrame];
          walkTimer = 0;
        }

        // Day/night tint
        const hour = new Date().getHours();
        const nightAlpha = hour < 6 || hour >= 20 ? 0.4 : 0;
        world.alpha = 1 - nightAlpha * 0.3;
      });
    };

    init().catch(console.error);
  }, [characters, isNight, screen, persona]);

  const currentChar = selectedCharacter && getCharacterById(selectedCharacter.uid);

  const handleChatClose = () => {
    if (currentChar) {
      markAsRead(currentChar.uid);
    }
    setSelectedCharacter(null);
  };

  const unreadTotal = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#1a1207' }}>
      {/* Canvas */}
      <div ref={canvasRef} style={{ flex: '0 0 70%', position: 'relative', overflow: 'hidden' }}>
        {/* HUD */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: '#f0d78c', fontWeight: 'bold', fontSize: 18 }}>🎪 Bo-Town</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ color: '#d4a24e', fontSize: 12 }}>{timeStr}</div>
            <button
              onClick={handleEditCurrent}
              style={{
                background: 'rgba(42, 31, 20, 0.8)',
                border: '2px solid #5c3a1e',
                color: '#f0d78c',
                padding: '6px 10px',
                cursor: 'pointer',
                borderRadius: 4,
                fontSize: 12,
                pointerEvents: 'auto',
              }}
              title="修改角色设定"
            >
              ⚙️
            </button>
            <button
              onClick={() => { destroyPixi(); setScreen('select'); }}
              style={{
                background: 'rgba(42, 31, 20, 0.8)',
                border: '2px solid #5c3a1e',
                color: '#f0d78c',
                padding: '6px 10px',
                cursor: 'pointer',
                borderRadius: 4,
                fontSize: 12,
                pointerEvents: 'auto',
              }}
              title="切换角色"
            >
              👤
            </button>
            <button
              onClick={toggleMusic}
              style={{
                background: 'rgba(42, 31, 20, 0.8)',
                border: '2px solid #5c3a1e',
                color: '#f0d78c',
                padding: '6px 12px',
                cursor: 'pointer',
                borderRadius: 4,
                fontSize: 12,
                pointerEvents: 'auto',
              }}
            >
              {musicPlaying ? '🔊 Music' : '🔇 Muted'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{
          flex: '0 0 30%',
          display: 'flex',
          flexDirection: 'column',
          background: '#1a1207',
          borderLeft: '2px solid #5c3a1e',
          overflow: 'hidden',
        }}
      >
        {/* Character list / Mailbox toggle */}
        <div className="rpg-panel" style={{ margin: 8, padding: 8, display: 'flex', gap: 4 }}>
          <button
            onClick={() => setPanelMode('chat')}
            className={panelMode === 'chat' ? 'rpg-btn rpg-btn-primary' : 'rpg-btn'}
            style={{ flex: 1, fontSize: 11 }}
          >
            💬 对话
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setPanelMode('mailbox');
                if (unreadTotal > 0 && selectedCharacter) {
                  markAsRead(selectedCharacter.uid);
                }
              }}
              className={panelMode === 'mailbox' ? 'rpg-btn rpg-btn-primary' : 'rpg-btn'}
              style={{ flex: 1, fontSize: 11, padding: '6px 16px' }}
            >
              📮 信箱
            </button>
            <NotificationBadge count={unreadTotal} />
          </div>
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {panelMode === 'chat' && !currentChar ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b7355',
                fontSize: 12,
                padding: 20,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              在左边的小镇上点击角色来聊天
            </div>
          ) : panelMode === 'chat' && currentChar ? (
            <ChatPanel character={currentChar} personaId={persona?.id} onClose={handleChatClose} />
          ) : currentChar ? (
            <Mailbox
              characterId={currentChar.uid}
              characterName={currentChar.name}
              personaId={persona?.id}
              onClose={() => setPanelMode('chat')}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b7355' }}>
              选择一个角色
            </div>
          )}
        </div>
      </div>

      {screen === 'select' && (
        <PersonaSelect
          personas={getAllPersonas()}
          onSelect={handleSelectPersona}
          onCreate={handleCreateNew}
          onDelete={handleDeletePersona}
        />
      )}

      {screen === 'create' && (
        <BirthModal
          onComplete={handleBirthComplete}
          initial={editingPersona}
          onBack={handleBirthBack}
        />
      )}
    </div>
  );
}

export default App;
