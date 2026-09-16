import { useState, useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useUiStore } from '../../store/uiStore';
import { canvasPublishApi } from '../../api/canvasPublishApi';
import Icon from '../common/Icon';

export default function PublishDialog({ onClose }) {
  const store = useCanvasStore();
  const ui = useUiStore();
  const publishJson = store.getPublishJson();
  const jsonStr = JSON.stringify(publishJson, null, 2);
  const [copied, setCopied] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [publishNote, setPublishNote] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState(null);
  const textareaRef = useRef(null);

  const { page } = publishJson;
  const componentCount = page.components?.length || 0;
  const elementCount = page.elements?.length || 0;
  const buttonCount = page.buttons?.length || 0;

  const handlePublish = async () => {
    if (!store.canvasCode) {
      // Save first if no canvas code
      ui.addToast('请先保存画布再发布', 'error');
      return;
    }
    setPublishing(true);
    try {
      const result = await canvasPublishApi.publish({
        canvasCode: store.canvasCode,
        versionName: versionName || undefined,
        publishNote: publishNote || undefined,
        systemCode: store.systemCode,
      });
      setPublishedVersion(result?.version || '?');
      ui.addToast(`发布成功！版本 v${result?.version}`, 'success');
    } catch (e) {
      ui.addToast('发布失败: ' + (e.message || ''), 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `${page.canvasCode || page.name || 'canvas'}_v${publishedVersion || 'publish'}.json`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      textareaRef.current?.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', borderRadius: 12, padding: 20, width: 780, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0',
        boxShadow: '0 16px 48px rgba(15,23,42,.18)',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ color: '#1e293b', fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: publishedVersion ? '#f0fdf4' : 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
              color: publishedVersion ? '#16a34a' : '#5d9cec',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={publishedVersion ? 'checkCircle' : 'publish'} size={15} />
            </span>
            {publishedVersion ? '发布成功' : '发布画布'}
          </h3>
          <button onClick={onClose} className="hb-icon-btn"><Icon name="close" size={16} /></button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <SummaryBadge label="页面名称" value={page.name || '—'} />
          <SummaryBadge label="页面代码" value={page.code || '—'} />
          <SummaryBadge label="类型" value={page.type === 'form' ? '表单' : page.type === 'table' ? '表格' : page.type} />
          <SummaryBadge label="布局" value={`${page.layout?.columns || 2}列 · ${page.layout?.buttonPosition || 'bottom'}`} />
          {componentCount > 0 && <SummaryBadge label="组件" value={String(componentCount)} />}
          <SummaryBadge label="元件" value={String(elementCount)} />
          {buttonCount > 0 && <SummaryBadge label="按钮" value={String(buttonCount)} />}
          {publishedVersion && <SummaryBadge label="版本" value={`v${publishedVersion}`} />}
        </div>

        {/* Version inputs (before publishing) */}
        {!publishedVersion && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>版本名称</span>
              <input
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="v1.0"
                style={{
                  padding: '5px 8px', border: '1px solid #d9d9d9', borderRadius: 4,
                  fontSize: 12, width: 110, outline: 'none', color: '#334155',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>变更说明</span>
              <input
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                placeholder="本次发布的变更内容..."
                style={{
                  padding: '5px 8px', border: '1px solid #d9d9d9', borderRadius: 4,
                  fontSize: 12, flex: 1, outline: 'none', color: '#334155',
                }}
              />
            </div>
          </div>
        )}

        {/* JSON Preview */}
        <div style={{
          flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          marginBottom: 14, minHeight: 280,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="list" size={13} /> 发布 JSON 预览
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {jsonStr.length.toLocaleString()} 字符
            </span>
          </div>
          <textarea
            ref={textareaRef}
            readOnly
            value={jsonStr}
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
            padding: '7px 16px', border: '1px solid #dce3ea', borderRadius: 6,
            background: '#fff', color: '#475569', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit', lineHeight: 1.4,
            transition: 'all .15s', whiteSpace: 'nowrap',
          }}>
            <Icon name="download" size={14} /> 下载 JSON
          </button>
          {!publishedVersion && (
            <button onClick={handlePublish} disabled={publishing} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 18px', border: 'none', borderRadius: 6,
              background: publishing ? '#94a3b8' : 'linear-gradient(135deg, #5d9cec, #4a8ad4)',
              color: '#fff', cursor: publishing ? 'not-allowed' : 'pointer',
              fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', lineHeight: 1.4,
              boxShadow: '0 1px 3px rgba(93,156,236,.35)',
              transition: 'all .15s', whiteSpace: 'nowrap', opacity: publishing ? .7 : 1,
            }}>
              {publishing ? '发布中…' : '确认发布'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small summary badge for the header row */
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
