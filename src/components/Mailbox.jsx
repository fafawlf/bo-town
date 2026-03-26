import { useState, useEffect } from 'react';
import { getLetters } from '../utils/api.js';
import { getReadLetterIds, markLetterRead } from '../utils/memory.js';

export default function Mailbox({ characterId, characterName, personaId, onClose }) {
  const [letters, setLetters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const readIds = getReadLetterIds();

  useEffect(() => {
    setLoading(true);
    getLetters(characterId, personaId ?? 'default')
      .then(setLetters)
      .catch(() => setLetters([]))
      .finally(() => setLoading(false));
  }, [characterId, personaId]);

  const openLetter = (letter) => {
    setSelected(letter);
    markLetterRead(letter.id);
  };

  if (selected) {
    return (
      <div className="flex flex-col h-full bg-amber-50 p-4">
        <button
          onClick={() => setSelected(null)}
          className="self-start text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          ← 返回信箱
        </button>
        <div className="bg-white rounded-lg p-6 shadow-inner flex-1 overflow-y-auto"
             style={{ fontFamily: 'serif' }}>
          <div className="text-center text-gray-400 text-sm mb-4">
            {selected.date}
          </div>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {selected.content}
          </div>
          <div className="text-right text-gray-500 mt-6 italic">
            —— {characterName}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-amber-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-amber-900">📮 信箱</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      {loading ? (
        <div className="text-center text-gray-400 mt-8">加载中...</div>
      ) : letters.length === 0 ? (
        <div className="text-center text-gray-400 mt-8">还没有收到信哦</div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {letters.map(letter => (
            <button
              key={letter.id}
              onClick={() => openLetter(letter)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                readIds.includes(letter.id)
                  ? 'bg-white text-gray-500'
                  : 'bg-amber-100 text-amber-900 font-medium'
              } hover:bg-amber-200`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {readIds.includes(letter.id) ? '📄' : '✉️'} {letter.subject || '一封信'}
                </span>
                <span className="text-xs text-gray-400">{letter.date}</span>
              </div>
              {letter.preview && (
                <div className="text-xs text-gray-400 mt-1 truncate">{letter.preview}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
