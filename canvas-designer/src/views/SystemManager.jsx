import { useState, useEffect } from 'react';
import { useSystemStore } from '../store/systemStore';
import { useUiStore } from '../store/uiStore';
import { Hero, heroAction, Card, EmptyState, Tag, btnPrimary, btnDefault, btnDanger } from '../components/common/FormFields';
import Icon from '../components/common/Icon';
import { syncConfigApi } from '../api/syncConfigApi';

export default function SystemManager() {
  const sysStore = useSystemStore();
  const ui = useUiStore();
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // 同步配置（前端以「分钟」为单位，保存时换算为毫秒传给后端）
  const [syncCfg, setSyncCfg] = useState({ enabled: false, pullMinutes: 5, pushMinutes: 10 });
  const [syncLoaded, setSyncLoaded] = useState(false);
  const [syncSaving, setSyncSaving] = useState(false);

  useEffect(() => {
    syncConfigApi.get().then((res) => {
      const d = res?.data || res || {};
      setSyncCfg({
        enabled: d.enabled === true || d.enabled === '1' || d.enabled === 1,
        pullMinutes: Math.round((d.pullInterval ?? 300000) / 60000),
        pushMinutes: Math.round((d.pushInterval ?? 600000) / 60000),
      });
      setSyncLoaded(true);
    }).catch(() => setSyncLoaded(true));
  }, []);

  const handleSyncSave = async () => {
    setSyncSaving(true);
    try {
      await syncConfigApi.save({
        enabled: syncCfg.enabled,
        pullInterval: Number(syncCfg.pullMinutes) * 60000,
        pushInterval: Number(syncCfg.pushMinutes) * 60000,
      });
      ui.addToast('同步配置已保存', 'success');
    } catch (e) {
      ui.addToast('保存失败: ' + (e.message || ''), 'error');
    } finally {
      setSyncSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ code: '', name: '', description: '' });
    setEditingCode(null);
    setShowForm(false);
  };

  const handleEdit = (sys) => {
    setForm({ code: sys.code, name: sys.name, description: sys.description || '' });
    setEditingCode(sys.code);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.code.trim()) { ui.addToast('请输入系统代码', 'error'); return; }
    if (!form.name.trim()) { ui.addToast('请输入系统名称', 'error'); return; }

    if (editingCode) {
      if (form.code.trim() !== editingCode && sysStore.exists(form.code.trim())) {
        ui.addToast('系统代码已存在', 'error'); return;
      }
      sysStore.updateSystem(editingCode, { code: form.code.trim(), name: form.name.trim(), description: form.description.trim() });
      ui.addToast('系统已更新', 'success');
    } else {
      if (sysStore.exists(form.code.trim())) { ui.addToast('系统代码已存在', 'error'); return; }
      sysStore.addSystem({ code: form.code.trim(), name: form.name.trim(), description: form.description.trim() });
      ui.addToast('系统已添加', 'success');
    }
    resetForm();
  };

  const handleDelete = (code) => {
    sysStore.deleteSystem(code);
    ui.addToast('系统已删除', 'success');
    setDeleteConfirm(null);
  };

  const systems = sysStore.systems;

  const stats = [
    { icon: 'system', label: '系统总数', value: systems.length },
    { icon: 'user', label: '有描述', value: systems.filter((s) => s.description).length },
  ];

  return (
    <div className="hb-page">
      <div className="hb-page-inner" style={{ maxWidth: 840, margin: '0 auto' }}>
        <Hero
          icon="system"
          title="系统管理"
          desc="管理系统租户，不同系统的模板和画布相互隔离"
          actions={
            <button onClick={() => { resetForm(); setShowForm(true); }} className={heroAction}>
              <Icon name="plus" size={14} /> 新建系统
            </button>
          }
          stats={stats}
        />

        {/* 同步设置面板 */}
        <Card title="产品工厂同步设置" icon="refresh" style={{ marginBottom: 16 }}>
          {/* 开关行 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            padding: '12px 14px', marginBottom: 14,
            background: syncCfg.enabled ? 'linear-gradient(135deg, #eff5fd, #f5f3ff)' : '#f8fafc',
            borderRadius: 10, border: syncCfg.enabled ? '1px solid #dbeafe' : '1px solid #eef2f7',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: syncCfg.enabled ? 'linear-gradient(135deg, #5d9cec, #4a8ad4)' : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: syncCfg.enabled ? '0 2px 6px rgba(93,156,236,.3)' : 'none',
              }}>
                <Icon name="refresh" size={16} />
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>同步总开关</div>
                <div style={{ fontSize: 11, color: syncCfg.enabled ? '#16a34a' : '#94a3b8' }}>
                  {syncCfg.enabled ? '已开启，定时任务运行中' : '已关闭，所有同步暂停'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSyncCfg({ ...syncCfg, enabled: !syncCfg.enabled })}
              style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                background: syncCfg.enabled ? 'linear-gradient(135deg, #5d9cec, #4a8ad4)' : '#cbd5e1',
                position: 'relative', transition: 'background .2s', flexShrink: 0,
                boxShadow: syncCfg.enabled ? '0 2px 6px rgba(93,156,236,.35)' : 'none',
              }}>
              <span style={{
                position: 'absolute', top: 3, left: syncCfg.enabled ? 25 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s',
              }} />
            </button>
          </div>

          {/* 频率设置 */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={lbl}>拉取同步间隔（分钟）</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" min={1} step={1}
                  value={syncCfg.pullMinutes}
                  onChange={(e) => setSyncCfg({ ...syncCfg, pullMinutes: Number(e.target.value) })}
                  className="hb-input" style={{ textAlign: 'center' }} />
                <span style={{ fontSize: 13, color: '#64748b', flexShrink: 0 }}>分钟</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                产品工厂 → 画布系统
              </div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={lbl}>回写同步间隔（分钟）</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" min={1} step={1}
                  value={syncCfg.pushMinutes}
                  onChange={(e) => setSyncCfg({ ...syncCfg, pushMinutes: Number(e.target.value) })}
                  className="hb-input" style={{ textAlign: 'center' }} />
                <span style={{ fontSize: 13, color: '#64748b', flexShrink: 0 }}>分钟</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                画布系统 → 产品工厂
              </div>
            </div>
          </div>

          {/* 保存 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
            <button onClick={handleSyncSave} disabled={syncSaving || !syncLoaded} className={btnPrimary}>
              <Icon name="save" size={13} /> {syncSaving ? '保存中…' : '保存同步配置'}
            </button>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              保存后立即生效，无需重启服务
            </span>
          </div>
        </Card>

        <div className="hb-note" style={{ padding: '12px 16px', marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 9 }}>
          <Icon name="info" size={15} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>系统列表存储在浏览器本地。切换系统代码后，可在各管理页面按系统筛选查看模板、元件、模块和画布。</span>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card
            title={editingCode ? '编辑系统' : '新建系统'}
            icon="system"
            style={{ marginBottom: 16 }}
            actions={<button onClick={resetForm} className="hb-icon-btn" title="关闭"><Icon name="close" size={15} /></button>}
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: '1 1 160px' }}>
                <label style={lbl}>系统代码 *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="如: SYS01" disabled={!!editingCode}
                  className="hb-input" style={{ background: editingCode ? '#f6f9fc' : '#fff', color: editingCode ? '#94a3b8' : '#334155' }} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={lbl}>系统名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如: 用户中心系统" className="hb-input" />
              </div>
              <div style={{ flex: '2 1 300px' }}>
                <label style={lbl}>描述</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="系统用途说明（可选）" className="hb-input" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} className={btnPrimary}>{editingCode ? '更新' : '保存'}</button>
              <button onClick={resetForm} className={btnDefault}>取消</button>
            </div>
          </Card>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="hb-note tone-red" style={{ padding: 16, marginBottom: 16 }}>
            <p style={{ color: '#ff4d4f', fontSize: 14, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="alert" size={15} /> 确定要删除系统 <strong>"{deleteConfirm}"</strong> 吗？
            </p>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 14px' }}>
              此操作仅删除本地系统记录，不会删除该系统中的模板和画布数据。
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleDelete(deleteConfirm)} className={btnDanger}>确认删除</button>
              <button onClick={() => setDeleteConfirm(null)} className={btnDefault}>取消</button>
            </div>
          </div>
        )}

        {/* System List */}
        {systems.length === 0 ? (
          <EmptyState icon="system" title="暂无系统" hint='点击"新建系统"添加' />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {systems.map((sys) => (
              <Card key={sys.code} hoverable bodyStyle={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
                    color: '#5d9cec', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="system" size={18} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Tag tone="blue-solid">{sys.code}</Tag>
                      <span style={{ color: '#1e293b', fontSize: 15, fontWeight: 600 }}>{sys.name}</span>
                    </div>
                    {sys.description && <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{sys.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={() => handleEdit(sys)} className={btnDefault}><Icon name="edit" size={12} /> 编辑</button>
                    <button onClick={() => setDeleteConfirm(sys.code)} className={btnDanger}>删除</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { color: '#64748b', fontSize: 12, display: 'block', marginBottom: 5 };
