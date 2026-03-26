import { useState, useRef, useEffect } from 'react';

const AVATAR_COUNT = 8;
const FRAME_SIZE = 32;
const COLS_PER_CHAR = 3;
const ROWS_PER_CHAR = 4;

function AvatarOption({ index, selected, onClick, imgSrc }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!imgSrc) return;
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      const col = index % 4;
      const row = Math.floor(index / 4);
      const sx = col * COLS_PER_CHAR * FRAME_SIZE + 1 * FRAME_SIZE;
      const sy = row * ROWS_PER_CHAR * FRAME_SIZE + 0 * FRAME_SIZE;
      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(img, sx, sy, FRAME_SIZE, FRAME_SIZE, 0, 0, 64, 64);
    };
  }, [imgSrc, index]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        border: selected ? '3px solid #d4a24e' : '3px solid transparent',
        borderRadius: 6,
        background: selected ? 'rgba(212,162,78,0.15)' : 'rgba(0,0,0,0.3)',
        imageRendering: 'pixelated',
        transition: 'all 0.15s',
      }}
    />
  );
}

export default function BirthModal({ onComplete, initial, onBack }) {
  const [name, setName] = useState(initial?.name || '');
  const [persona, setPersona] = useState(initial?.persona || '');
  const [avatarIndex, setAvatarIndex] = useState(initial?.avatarIndex ?? 0);

  const isValid = name.trim().length >= 1 && name.trim().length <= 8;
  const isEdit = !!initial;

  const handleSubmit = () => {
    if (!isValid) return;
    const data = { name: name.trim(), persona: persona.trim(), avatarIndex };
    if (initial?.id) data.id = initial.id;
    onComplete(data);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10, 7, 3, 0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="rpg-panel" style={{
        width: 420, maxWidth: '90vw', padding: 32,
        animation: 'fadeIn 0.4s ease-out',
      }}>
        {onBack && (
          <button
            onClick={onBack}
            className="rpg-btn"
            style={{ fontSize: 11, padding: '4px 10px', marginBottom: 12 }}
          >
            &larr; 返回
          </button>
        )}
        <h2 style={{
          color: '#d4a24e', textAlign: 'center', fontSize: 22,
          marginBottom: 4, fontWeight: 'bold',
        }}>
          {isEdit ? '修改设定' : '创建角色'}
        </h2>
        <p style={{
          color: '#8b7355', textAlign: 'center', fontSize: 12,
          marginBottom: 24,
        }}>
          {isEdit ? '更新你的角色信息' : '在开始之前，先告诉大家你是谁吧'}
        </p>

        {/* Name */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ color: '#e8d5b5', fontSize: 13, fontWeight: 600 }}>你的名字</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={8}
            placeholder="1-8 个字符"
            autoFocus
            style={{
              display: 'block', width: '100%', marginTop: 6,
              background: '#1a1207', border: '2px solid #5c3a1e', borderRadius: 4,
              padding: '10px 12px', fontSize: 14, color: '#e8d5b5', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#d4a24e'}
            onBlur={e => e.target.style.borderColor = '#5c3a1e'}
          />
        </label>

        {/* Persona */}
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ color: '#e8d5b5', fontSize: 13, fontWeight: 600 }}>关于你</span>
          <span style={{ color: '#8b7355', fontSize: 11, marginLeft: 8 }}>（NPC 会记住这些）</span>
          <textarea
            value={persona}
            onChange={e => setPersona(e.target.value)}
            placeholder="随便写写你的性格、爱好、近况…"
            rows={3}
            style={{
              display: 'block', width: '100%', marginTop: 6, resize: 'vertical',
              background: '#1a1207', border: '2px solid #5c3a1e', borderRadius: 4,
              padding: '10px 12px', fontSize: 13, color: '#e8d5b5', outline: 'none',
              lineHeight: 1.6, fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = '#d4a24e'}
            onBlur={e => e.target.style.borderColor = '#5c3a1e'}
          />
        </label>

        {/* Avatar selection */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ color: '#e8d5b5', fontSize: 13, fontWeight: 600 }}>选择形象</span>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
            marginTop: 10, justifyItems: 'center',
          }}>
            {Array.from({ length: AVATAR_COUNT }, (_, i) => (
              <AvatarOption
                key={i}
                index={i}
                selected={avatarIndex === i}
                onClick={() => setAvatarIndex(i)}
                imgSrc="/assets/characters.png"
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          className="rpg-btn rpg-btn-primary"
          disabled={!isValid}
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '12px 0', fontSize: 16,
            fontWeight: 'bold', letterSpacing: 2,
            opacity: isValid ? 1 : 0.4, cursor: isValid ? 'pointer' : 'not-allowed',
          }}
        >
          {isEdit ? '保存' : '进入小镇'}
        </button>
      </div>
    </div>
  );
}
