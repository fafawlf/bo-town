import { typeBadgeClass, renderMarkdown } from '../utils/prompts';

// Status badge styles
const statusStyle = {
  active:   { bg: 'rgba(90,158,75,0.2)', border: '#5a9e4b', color: '#81c784', label: '🟢 活跃' },
  inactive: { bg: 'rgba(212,162,78,0.2)', border: '#d4a24e', color: '#ffd54f', label: '🟡 不活跃' },
  churned:  { bg: 'rgba(196,75,63,0.2)',  border: '#c44b3f', color: '#ef9a9a', label: '🔴 已流失' },
};

export default function InfoPanel({ npc, onClose, onShowChat }) {
  if (!npc) return null;

  const raw = npc._raw; // full TownResident data
  const st = statusStyle[npc.status] || statusStyle.active;

  // Format date nicely
  const fmtDate = (iso) => {
    if (!iso) return '—';
    return iso.slice(0, 10);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="rpg-panel" style={{ margin: 8, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
          <div>
            <div style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 18 }}>{npc.display}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
              <span className={`type-badge ${typeBadgeClass(npc.type)}`}>{npc.type_cn}</span>
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>{st.label}</span>
            </div>
          </div>
          <button className="rpg-btn" style={{ fontSize: 10, padding: '4px 8px' }} onClick={onClose}>✕</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          {[
            [npc.total_messages?.toLocaleString(), '消息'],
            [npc.active_days, '活跃天'],
            [npc.total_bots, '角色'],
            [npc.days_since_last_chat != null ? `${npc.days_since_last_chat}天前` : '—', '最后活跃'],
          ].map(([v, l], i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 48 }}>
              <div style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 13 }}>{v}</div>
              <div style={{ fontSize: 8, color: '#8b7355' }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <button className="rpg-btn" style={{ flex: 1, fontSize: 11 }} onClick={onShowChat}>💬 对话</button>
          <button className="rpg-btn rpg-btn-primary" style={{ flex: 1, fontSize: 11 }}>📋 档案</button>
        </div>
      </div>

      {/* Profile content */}
      <div className="rpg-panel" style={{ margin: 8, flex: 1, overflowY: 'auto', padding: 12, fontSize: 12, lineHeight: 1.7 }}>

        {/* === 基本信息 === */}
        <h3 style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>👤 基本信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: 12, fontSize: 11 }}>
          <div><span style={{ color: '#8b7355' }}>ID：</span><span
            style={{ color: '#e8d5b5', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', borderBottom: '1px dashed #5c3a1e' }}
            title={`点击复制: ${npc.user_uid}`}
            onClick={() => { navigator.clipboard.writeText(npc.user_uid); const el = document.getElementById('copy-toast'); if(el){el.style.opacity=1; setTimeout(()=>el.style.opacity=0, 1200);} }}
          >{npc.user_uid?.slice(0, 12)}... 📋</span>
          <span id="copy-toast" style={{ fontSize: 9, color: '#5a9e4b', marginLeft: 4, opacity: 0, transition: 'opacity 0.3s' }}>已复制!</span></div>
          <div><span style={{ color: '#8b7355' }}>性别：</span><span style={{ color: '#e8d5b5' }}>{npc.gender === 'female' ? '♀ 女性' : npc.gender === 'male' ? '♂ 男性' : '未知'}</span></div>
          <div><span style={{ color: '#8b7355' }}>年龄：</span><span style={{ color: '#e8d5b5' }}>{npc.age || '未填'}</span></div>
          <div><span style={{ color: '#8b7355' }}>订阅：</span><span style={{ color: npc.sub_active ? '#81c784' : npc.sub_status === 'expired' ? '#ef9a9a' : '#8b7355' }}>
            {npc.sub_active ? `✅ ${npc.sub_days}天 (${npc.sub_expires})` : npc.sub_status === 'expired' ? `❌ 已过期 (${npc.sub_expires})` : '无订阅'}
          </span></div>
          <div><span style={{ color: '#8b7355' }}>首次使用：</span><span style={{ color: '#e8d5b5' }}>{fmtDate(npc.first_chat_at)}</span></div>
          <div><span style={{ color: '#8b7355' }}>最后活跃：</span><span style={{ color: '#e8d5b5' }}>{fmtDate(npc.last_chat_at)}</span></div>
        </div>

        {/* === 所在区域 === */}
        <div style={{ padding: '6px 10px', background: '#1a1207', borderRadius: 6, marginBottom: 12, fontSize: 11, border: '1px solid #3d2b1a' }}>
          <span style={{ color: '#8b7355' }}>📍 小镇位置：</span>
          <span style={{ color: '#e8d5b5' }}>{npc.landmark || npc.district || '未分配'}</span>
          {npc.tags?.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {npc.tags.map((t, i) => (
                <span key={i} style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 3, fontSize: 9, background: '#3d2b1a', color: '#8b7355', marginRight: 4, marginBottom: 2 }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* === 核心画像 === */}
        <h3 style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 13, marginBottom: 8, borderBottom: '1px solid #3d2b1a', paddingBottom: 4 }}>🧠 核心画像</h3>
        <p style={{ marginBottom: 6 }}>
          <span style={{ color: '#8b7355' }}>💡 核心需求：</span>
          <span style={{ color: '#e8d5b5' }}>{npc.core_need}</span>
        </p>
        <p style={{ marginBottom: 6 }}>
          <span style={{ color: '#8b7355' }}>🔄 行为模式：</span>
          <span style={{ color: '#e8d5b5' }}>{npc.key_behavior}</span>
        </p>

        {/* === 偏好角色 (with scores) === */}
        <h3 style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 13, marginTop: 12, marginBottom: 8, borderBottom: '1px solid #3d2b1a', paddingBottom: 4 }}>🎭 偏好角色 Top 5</h3>
        <div style={{ marginBottom: 12 }}>
          {(raw?.behavior?.top_chars || []).slice(0, 5).map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 11 }}>
              <span style={{ color: '#d4a24e', fontWeight: 'bold', width: 16 }}>{i + 1}.</span>
              <span style={{ color: '#e8d5b5', flex: 1 }}>{c.label}</span>
              {c.score && (
                <span style={{ color: '#8b7355', fontSize: 10 }}>{c.score.toLocaleString()} msgs</span>
              )}
            </div>
          ))}
          {(!raw?.behavior?.top_chars?.length) && (
            <div style={{ color: '#8b7355' }}>{(npc.top_chars || []).join('、') || '无数据'}</div>
          )}
        </div>

        {/* === 活跃度详情 === */}
        <h3 style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 13, marginTop: 12, marginBottom: 8, borderBottom: '1px solid #3d2b1a', paddingBottom: 4 }}>📊 活跃度</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 12, fontSize: 11 }}>
          <div style={{ padding: '6px 8px', background: '#1a1207', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 16 }}>{npc.total_messages?.toLocaleString()}</div>
            <div style={{ color: '#8b7355', fontSize: 9 }}>总消息</div>
          </div>
          <div style={{ padding: '6px 8px', background: '#1a1207', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 16 }}>{npc.active_days}</div>
            <div style={{ color: '#8b7355', fontSize: 9 }}>活跃天数</div>
          </div>
          <div style={{ padding: '6px 8px', background: '#1a1207', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 16 }}>{npc.total_bots}</div>
            <div style={{ color: '#8b7355', fontSize: 9 }}>互动角色</div>
          </div>
          <div style={{ padding: '6px 8px', background: '#1a1207', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ color: st.color, fontWeight: 'bold', fontSize: 16 }}>{npc.days_since_last_chat ?? '—'}</div>
            <div style={{ color: '#8b7355', fontSize: 9 }}>天未活跃</div>
          </div>
        </div>

        {/* === 完整分析报告 === */}
        <h3 style={{ color: '#d4a24e', fontWeight: 'bold', fontSize: 13, marginTop: 12, marginBottom: 8, borderBottom: '1px solid #3d2b1a', paddingBottom: 4 }}>
          📝 完整分析报告
        </h3>
        <div
          style={{ color: '#c0aa88', fontSize: 11, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(npc.synthesis) }}
        />

        {/* === 数据来源 === */}
        {raw?.evidence && (
          <div style={{ marginTop: 16, padding: '6px 10px', background: '#1a1207', borderRadius: 4, fontSize: 9, color: '#665544', borderTop: '1px solid #3d2b1a' }}>
            <div>📁 数据来源：{raw.evidence.synthesis_source} · pipeline {raw.evidence.pipeline_version}</div>
            <div>🕐 提取时间：{fmtDate(raw.evidence.extracted_at)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
