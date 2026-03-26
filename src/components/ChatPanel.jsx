import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { buildCharacterPrompt } from '../data/characterAdapter';
import { sendChat, reflect } from '../utils/api';
import {
  getChatHistory, saveChatHistory, clearChatHistory, getPersona,
  buildMemoryPrompt, getAllMemory, applyReflect, truncateMessages,
  getMemFile, isDiaryUnlocked,
} from '../utils/memory';
import { MessageBody } from '../utils/chatMessageRender.jsx';

const FRAME_SIZE = 32;

function CharAvatar({ avatarIndex = 0, size = 48 }) {
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
      const sx = col * 3 * FRAME_SIZE + 1 * FRAME_SIZE;
      const sy = row * 4 * FRAME_SIZE + 0 * FRAME_SIZE;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, FRAME_SIZE, FRAME_SIZE, 0, 0, size, size);
    };
  }, [avatarIndex, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering: 'pixelated', borderRadius: 4 }} />;
}

const EXTRACT_EVERY_N = 10;

export default function ChatPanel({ character, personaId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const scrollRef = useRef(null);
  const userMsgCountRef = useRef(0);

  // Load chat for this persona + character (layout first so save effect sees the right thread)
  useLayoutEffect(() => {
    if (!character?.uid) return;
    try {
      const saved = getChatHistory(character.uid, personaId);
      setMessages(saved);
      userMsgCountRef.current = saved.filter(m => m.role === 'user').length;
    } catch {
      setMessages([]);
      userMsgCountRef.current = 0;
    }
  }, [character?.uid, personaId]);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (!character?.uid || messages.length === 0) return;
    saveChatHistory(character.uid, messages, personaId);
  }, [messages, character?.uid, personaId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const charContext = character?._raw ? {
    name: character.name,
    traits: character._raw.personality.traits.join('、'),
    speaking_style: character._raw.personality.speaking_style,
  } : null;

  // Reflect — Rin-style: update all memory files after N messages
  const maybeReflect = useCallback(async (allMsgs) => {
    if (!character?.uid) return;
    userMsgCountRef.current += 1;
    if (userMsgCountRef.current % EXTRACT_EVERY_N !== 0) return;

    try {
      const currentMemory = getAllMemory(character.uid);
      const result = await reflect(allMsgs, charContext, currentMemory);
      if (result && !result.error) {
        applyReflect(character.uid, result);
      }
    } catch { /* background task, don't block chat */ }
  }, [character?.uid, charContext]);

  const send = useCallback(async () => {
    if (!input.trim() || sending || !character) return;
    const msg = input.trim();
    setInput('');
    setSending(true);

    const now = Date.now();
    const newMsgs = [...messages, { role: 'user', content: msg, ts: now }];
    setMessages(newMsgs);

    try {
      const memoryText = buildMemoryPrompt(character.uid);
      const systemPrompt = buildCharacterPrompt(character, memoryText, getPersona());
      const apiMessages = truncateMessages(newMsgs);
      const data = await sendChat(character.uid, apiMessages, systemPrompt);
      const allMsgs = [...newMsgs, { role: 'assistant', content: data.reply, ts: Date.now() }];
      setMessages(allMsgs);
      maybeReflect(allMsgs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `（出错了：${msg}）`,
        ts: Date.now(),
      }]);
    }
    setSending(false);
  }, [input, messages, character, sending, maybeReflect]);

  const clearChat = () => {
    if (!character?.uid) return;
    setMessages([]);
    clearChatHistory(character.uid, personaId);
    userMsgCountRef.current = 0;
  };

  if (!character) return null;

  const avatarIdx = (character.avatar?.row || 0) * 4 + (character.avatar?.col || 0);
  const hasHistory = messages.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header — always visible */}
      <div className="rpg-panel" style={{ margin: 8, padding: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            border: '2px solid #5c3a1e', borderRadius: 6, padding: 2,
            background: '#1a1207', flexShrink: 0, alignSelf: 'start',
          }}>
            {character.portraitUrl ? (
              <img
                src={character.portraitUrl}
                alt=""
                width={44}
                height={44}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 4,
                  objectFit: 'cover',
                  display: 'block',
                  imageRendering: 'auto',
                }}
              />
            ) : (
              <CharAvatar avatarIndex={avatarIdx} size={44} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 16, whiteSpace: 'nowrap' }}>{character.name}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  className="rpg-btn"
                  style={{ fontSize: 10, padding: '3px 7px' }}
                  onClick={() => { setShowInfo(!showInfo); setShowDiary(false); }}
                >{showInfo ? '收起' : '资料'}</button>
                <button
                  className="rpg-btn"
                  style={{ fontSize: 10, padding: '3px 7px' }}
                  onClick={() => { setShowDiary(!showDiary); setShowInfo(false); }}
                >{showDiary ? '收起' : '日记'}</button>
                <button className="rpg-btn" style={{ fontSize: 10, padding: '3px 7px' }} onClick={onClose}>✕</button>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#8b7355', marginTop: 4 }}>
              {character.title && <>{character.title} · </>}
              {character.districtName} · {character.activeHours[0]}:00-{character.activeHours[1]}:00
            </div>
          </div>
        </div>
      </div>

      {/* Info card — expandable */}
      {showInfo && (
        <div className="rpg-panel" style={{
          margin: '0 8px 4px', padding: 14,
          maxHeight: '45vh', overflowY: 'auto',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Bio */}
          {character.bio && (
            <div style={{ fontSize: 12, color: '#c4b090', lineHeight: 1.8, marginBottom: 14 }}>
              {character.bio}
            </div>
          )}

          {/* Traits */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 6, fontWeight: 600 }}>性格</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {character.traits?.map((t, i) => (
                <span key={i} style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 10,
                  background: 'rgba(212,162,78,0.1)', border: '1px solid rgba(212,162,78,0.2)',
                  color: '#d4a24e',
                }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Topics */}
          {character.topics?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 6, fontWeight: 600 }}>聊什么都行</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {character.topics.map((t, i) => (
                  <span key={i} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 10,
                    background: 'rgba(74,127,181,0.1)', border: '1px solid rgba(74,127,181,0.2)',
                    color: '#7ab0d4',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quirks */}
          {character.quirks?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 6, fontWeight: 600 }}>小习惯</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {character.quirks.map((q, i) => (
                  <div key={i} style={{
                    fontSize: 11, color: '#a89070', lineHeight: 1.5,
                    paddingLeft: 10, borderLeft: '2px solid #3d2b1a',
                  }}>{q}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diary panel */}
      {showDiary && (() => {
        const unlocked = isDiaryUnlocked(character.uid);
        if (!unlocked) {
          return (
            <div className="rpg-panel" style={{
              margin: '0 8px 4px', padding: 20,
              animation: 'fadeIn 0.2s ease-out', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>🔒</div>
              <div style={{ color: '#8b7355', fontSize: 13, lineHeight: 1.7 }}>
                {character.name}拒绝了你查看日记的请求
              </div>
              <div style={{ color: '#665544', fontSize: 11, marginTop: 6 }}>
                "这是我的私人日记，还不到给你看的时候。"
              </div>
            </div>
          );
        }
        const diary = getMemFile(character.uid, 'diary');
        const entries = Array.isArray(diary) ? diary : [];
        return (
          <div className="rpg-panel" style={{
            margin: '0 8px 4px', padding: 14,
            maxHeight: '45vh', overflowY: 'auto',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 10, fontWeight: 600 }}>
              {character.name}的日记
            </div>
            {entries.length === 0 ? (
              <div style={{ color: '#665544', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                还没有日记……聊多一些，他会开始写的
              </div>
            ) : (
              [...entries].reverse().map((entry, i) => (
                <div key={i} style={{ marginBottom: i < entries.length - 1 ? 14 : 0 }}>
                  <div style={{ fontSize: 10, color: '#d4a24e', marginBottom: 4 }}>{entry.date}</div>
                  <div style={{
                    fontSize: 12, color: '#c4b090', lineHeight: 1.8,
                    paddingLeft: 10, borderLeft: '2px solid #3d2b1a',
                    whiteSpace: 'pre-wrap',
                  }}>{entry.content}</div>
                </div>
              ))
            )}
          </div>
        );
      })()}

      {/* Messages */}
      <div ref={scrollRef} className="rpg-panel" style={{ margin: 8, flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#8b7355', fontSize: 12, padding: '40px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            跟 {character.name} 聊聊天吧
            <div style={{ fontSize: 10, marginTop: 4 }}>试试问：「你最喜欢哪个角色？」</div>
          </div>
        )}
        {hasHistory && messages.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: 10, color: '#665544', marginBottom: 4 }}>
            — 对话记录 ({messages.length} 条) —
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: '85%', padding: '8px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            ...(m.role === 'user'
              ? { marginLeft: 'auto', background: '#5c3a1e', color: '#f0d78c', borderBottomRightRadius: 2 }
              : { background: '#3d2b1a', color: '#e8d5b5', borderBottomLeftRadius: 2 }),
          }}><MessageBody text={m.content} /></div>
        ))}
        {sending && <div style={{ background: '#3d2b1a', padding: '8px 12px', borderRadius: 10, fontSize: 12, color: '#8b7355', width: 'fit-content' }}>正在输入...</div>}
      </div>

      {/* Input + Clear */}
      <div className="rpg-panel" style={{ margin: 8, padding: 8, display: 'flex', gap: 6 }}>
        {hasHistory && (
          <button className="rpg-btn" style={{ fontSize: 10, padding: '6px 8px', color: '#c44b3f' }}
            onClick={clearChat} title="清除对话记录">🗑️</button>
        )}
        <input
          style={{ flex: 1, background: '#1a1207', border: '1px solid #5c3a1e', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#e8d5b5', outline: 'none' }}
          placeholder="输入消息..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={sending}
        />
        <button className="rpg-btn rpg-btn-primary" style={{ fontSize: 12 }} onClick={send} disabled={sending}>发送</button>
      </div>
    </div>
  );
}
