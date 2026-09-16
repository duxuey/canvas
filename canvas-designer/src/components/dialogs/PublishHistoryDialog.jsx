import { useState, useEffect } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { canvasPublishApi } from '../../api/canvasPublishApi';
import PublishDetailDialog from './PublishDetailDialog';
import Icon from '../common/Icon';

export default function PublishHistoryDialog({ canvasCode, canvasName, onClose }) {
  const ui = useUiStore();
  const canvasStore = useCanvasStore();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailPkId, setDetailPkId] = useState(null);
  const [rollbackConfirm, setRollbackConfirm] = useState(null);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await canvasPublishApi.getVersions(canvasCode);
      setVersions(data?.versions || []);
    } catch (e) {
      ui.addToast('加载发布记录失败: ' + (e.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [canvasCode]);

  const handleRollback = async (version) => {
    try {
      // Fetch full detail with JSON
      const data = await canvasPublishApi.getDetail(version.pkId);
      const detail = data?.detail;
      if (!detail?.publishJson) {
        ui.addToast('版本数据为空', 'error');
        return;
      }
      const publishJson = JSON.parse(detail.publishJson);
      canvasStore.loadFromPublishJson(publishJson);
      ui.addToast(`已回滚到版本 v${version.version}，请在设计器中编辑后重新发布`, 'success');
      setRollbackConfirm(null);
      onClose();
      // Navigate to designer
      window.location.hash = 'designer';
    } catch (e) {
      ui.addToast('回滚失败: ' + (e.message || ''), 'error');
    }
  };

  const statusStyle = (status) => {
    if (status === 'deprecated') {
      return { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' };
    }
    return { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
  };

  const statusLabel = (status) => status === 'deprecated' ? '已废弃' : '已发布';

  // If showing detail
  if (detailPkId) {
    return <PublishDetailDialog pkId={detailPkId} onClose={() => setDetailPkId(null)} />;
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998,
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', borderRadius: 12, padding: 20, width: 720, maxHeight: '85vh',
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
              <Icon name="publish" size={15} />
            </span>
            <div>
              <h3 style={{ color: '#1e293b', fontSize: 16, margin: 0 }}>发布记录</h3>
              <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>
                {canvasName || canvasCode}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hb-icon-btn"><Icon name="close" size={16} /></button>
        </div>

        {/* Rollback confirm */}
        {rollbackConfirm && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '10px 14px', marginBottom: 12,
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6,
          }}>
            <span style={{ color: '#d97706', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="alert" size={15} /> 确定回滚到版本 v{rollbackConfirm.version}？画布将替换为该版本的 JSON。
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleRollback(rollbackConfirm)} style={{
                padding: '5px 12px', background: '#f59e0b', color: '#fff', border: 'none',
                borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>确认回滚</button>
              <button onClick={() => setRollbackConfirm(null)} style={{
                padding: '5px 12px', background: '#f5f5f5', color: '#666',
                border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer', fontSize: 12,
              }}>取消</button>
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 200 }}>
          {loading ? (
            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 40 }}>加载中...</p>
          ) : versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>暂无发布记录</p>
              <p style={{ color: '#c0c0c0', fontSize: 12, margin: '4px 0 0' }}>
                在设计器中点击"发布"来创建第一个版本
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {versions.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', background: i === 0 ? '#f8fafc' : '#ffffff',
                  borderRadius: 6, border: i === 0 ? '1px solid #5d9cec' : '1px solid #e2e8f0',
                }}>
                  {/* Version */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 44, height: 44, borderRadius: 22,
                    background: i === 0 ? 'linear-gradient(135deg, #5d9cec, #4a8ad4)' : '#f1f5f9',
                    color: i === 0 ? '#fff' : '#64748b',
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    v{v.version}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                        {v.versionName || `v${v.version}`}
                      </span>
                      {i === 0 && (
                        <span style={{
                          padding: '1px 7px', borderRadius: 3, fontSize: 10,
                          background: '#dbeafe', color: '#2563eb',
                        }}>最新</span>
                      )}
                      <span style={{
                        padding: '1px 7px', borderRadius: 3, fontSize: 10,
                        ...statusStyle(v.status),
                      }}>
                        {statusLabel(v.status)}
                      </span>
                    </div>
                    {v.publishNote && (
                      <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0' }}>
                        {v.publishNote}
                      </p>
                    )}
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {v.createdAt ? new Date(v.createdAt).toLocaleString('zh-CN') : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button onClick={() => setDetailPkId(v.pkId)} style={{
                      padding: '5px 10px', background: '#fff', color: '#5d9cec',
                      border: '1px solid #b3d4f7', borderRadius: 4, cursor: 'pointer', fontSize: 11,
                    }}>查看</button>
                    <button onClick={async () => {
                      // Download this version's JSON
                      try {
                        const data = await canvasPublishApi.getDetail(v.pkId);
                        const detail = data?.detail;
                        if (detail?.publishJson) {
                          const blob = new Blob([detail.publishJson], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${canvasCode}_v${v.version}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }
                      } catch {
                        ui.addToast('下载失败', 'error');
                      }
                    }} style={{
                      padding: '5px 10px', background: '#fff', color: '#64748b',
                      border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', fontSize: 11,
                    }}>下载</button>
                    <button onClick={() => setRollbackConfirm(v)} style={{
                      padding: '5px 10px', background: '#fff', color: '#f59e0b',
                      border: '1px solid #fde68a', borderRadius: 4, cursor: 'pointer', fontSize: 11,
                    }}>回滚</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
