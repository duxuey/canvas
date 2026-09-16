import { useState, useEffect, useRef } from 'react';
import { useUiStore } from '../../store/uiStore';
import { canvasPublishApi } from '../../api/canvasPublishApi';
import Icon from '../common/Icon';

export default function PublishDetailDialog({ pkId, onClose }) {
  const ui = useUiStore();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await canvasPublishApi.getDetail(pkId);
      setDetail(data?.detail || null);
    } catch (e) {
      ui.addToast('加载详情失败: ' + (e.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [pkId]);

  const handleCopy = async () => {
    if (!detail?.publishJson) return;
    try {
      await navigator.clipboard.writeText(detail.publishJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      textareaRef.current?.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!detail?.publishJson) return;
    const blob = new Blob([detail.publishJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detail.canvasCode || 'canvas'}_v${detail.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pretty-print the JSON
  let formattedJson;
  try {
    formattedJson = JSON.stringify(JSON.parse(detail?.publishJson || '{}'), null, 2);
  } catch {
    formattedJson = detail?.publishJson || '';
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', borderRadius: 12, padding: 20, width: 780, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0',
        boxShadow: '0 16px 48px rgba(15,23,42,.18)',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
              color: '#5d9cec', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="detail" size={15} />
            </span>
            <div>
              <h3 style={{ color: '#1e293b', fontSize: 16, margin: 0 }}>版本详情</h3>
              {detail && (
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>
                  {detail.versionName || `v${detail.version}`} · {detail.canvasCode}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="hb-icon-btn"><Icon name="close" size={16} /></button>
        </div>

        {loading ? (
          <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 40 }}>加载中...</p>
        ) : !detail ? (
          <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 40 }}>未找到发布记录</p>
        ) : (
          <>
            {/* Metadata */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <SummaryBadge label="版本号" value={`v${detail.version}`} />
              <SummaryBadge label="版本名" value={detail.versionName || '—'} />
              <SummaryBadge label="状态" value={detail.status === 'deprecated' ? '已废弃' : '已发布'} />
              <SummaryBadge label="发布时间" value={detail.createdAt ? new Date(detail.createdAt).toLocaleString('zh-CN') : '—'} />
              {detail.publishNote && <SummaryBadge label="变更说明" value={detail.publishNote} />}
            </div>

            {/* JSON Preview */}
            <div style={{
              flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
              marginBottom: 14, minHeight: 300,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="list" size={13} /> 发布 JSON
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  {formattedJson.length.toLocaleString()} 字符
                </span>
              </div>
              <textarea
                ref={textareaRef}
                readOnly
                value={formattedJson}
                style={{
                  flex: 1, width: '100%', padding: 12,
                  fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
                  fontSize: 12, lineHeight: 1.55,
                  color: '#334155', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: 6,
                  resize: 'none', outline: 'none',
                  tabSize: 2,
                }}
                spellCheck={false}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={handleCopy} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 16px', border: '1px solid #dce3ea', borderRadius: 6,
                background: copied ? '#ecfdf5' : '#fff',
                color: copied ? '#059669' : '#475569',
                cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
                fontFamily: 'inherit', lineHeight: 1.4,
                transition: 'all .15s', whiteSpace: 'nowrap',
              }}>
                <Icon name={copied ? 'check' : 'copy'} size={13} /> {copied ? '已复制' : '复制'}
              </button>
              <button onClick={handleDownload} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 18px', border: 'none', borderRadius: 6,
                background: 'linear-gradient(135deg, #5d9cec, #4a8ad4)',
                color: '#fff', cursor: 'pointer',
                fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', lineHeight: 1.4,
                boxShadow: '0 1px 3px rgba(93,156,236,.35)',
                transition: 'all .15s', whiteSpace: 'nowrap',
              }}>
                <Icon name="download" size={14} /> 下载 JSON
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryBadge({ label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: '#f8fafc', borderRadius: 6, padding: '5px 10px',
      border: '1px solid #e8ecf1',
    }}>
      <span style={{ fontSize: 10.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
