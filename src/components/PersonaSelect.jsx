import { useRef, useEffect } from 'react';

const FRAME_SIZE = 32;
const COLS_PER_CHAR = 3;
const ROWS_PER_CHAR = 4;

function AvatarPreview({ avatarIndex, size = 72 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/assets/characters.png';
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      const col = avatarIndex % 4;
      const row = Math.floor(avatarIndex / 4);
      const sx = col * COLS_PER_CHAR * FRAME_SIZE + 1 * FRAME_SIZE;
      const sy = row * ROWS_PER_CHAR * FRAME_SIZE + 0 * FRAME_SIZE;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, FRAME_SIZE, FRAME_SIZE, 0, 0, size, size);
    };
  }, [avatarIndex, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export default function PersonaSelect({ personas, onSelect, onCreate, onDelete }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10, 7, 3, 0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 520, maxWidth: '92vw',
        animation: 'fadeIn 0.4s ease-out',
      }}>
        <h2 style={{
          color: '#d4a24e', textAlign: 'center', fontSize: 24,
          marginBottom: 6, fontWeight: 'bold',
        }}>
          Bo-Town
        </h2>
        <p style={{
          color: '#8b7355', textAlign: 'center', fontSize: 13,
          marginBottom: 28,
        }}>
          {personas.length > 0 ? '选择你的角色，或创建一个新的' : '创建你的第一个角色吧'}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 14,
          maxHeight: '55vh',
          overflowY: 'auto',
          padding: '4px 2px',
        }}>
          {personas.map(p => (
            <div
              key={p.id}
              className="rpg-panel"
              onClick={() => onSelect(p)}
              style={{
                padding: 16, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 10, transition: 'all 0.15s', position: 'relative',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#d4a24e';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.transform = '';
              }}
            >
              {personas.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                  style={{
                    position: 'absolute', top: 4, right: 6,
                    background: 'none', border: 'none',
                    color: '#8b7355', cursor: 'pointer', fontSize: 13,
                    padding: '2px 4px', lineHeight: 1,
                  }}
                  title="删除角色"
                  onMouseEnter={e => e.target.style.color = '#c44b3f'}
                  onMouseLeave={e => e.target.style.color = '#8b7355'}
                >
                  x
                </button>
              )}
              <AvatarPreview avatarIndex={p.avatarIndex || 0} />
              <div style={{ color: '#f0d78c', fontWeight: 'bold', fontSize: 15 }}>
                {p.name}
              </div>
              {p.persona && (
                <div style={{
                  color: '#8b7355', fontSize: 11, textAlign: 'center',
                  lineHeight: 1.4, maxHeight: 32, overflow: 'hidden',
                  wordBreak: 'break-all',
                }}>
                  {p.persona.length > 30 ? p.persona.slice(0, 30) + '...' : p.persona}
                </div>
              )}
            </div>
          ))}

          {/* New persona card */}
          <div
            className="rpg-panel"
            onClick={onCreate}
            style={{
              padding: 16, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              minHeight: 140, transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#d4a24e';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.transform = '';
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              border: '2px dashed #5c3a1e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: '#5c3a1e',
            }}>
              +
            </div>
            <div style={{ color: '#8b7355', fontSize: 13 }}>新建角色</div>
          </div>
        </div>
      </div>
    </div>
  );
}
