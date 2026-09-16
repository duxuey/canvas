import { useCanvasStore } from '../../store/canvasStore';
import { useSystemStore } from '../../store/systemStore';
import { usePageStore } from '../../store/pageStore';
import { pageTemplateApi } from '../../api/pageTemplateApi';
import { useState, useEffect } from 'react';
import Icon from '../common/Icon';

export default function PageProperties() {
  const store = useCanvasStore();
  const sysStore = useSystemStore();
  const pageStore = usePageStore();
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    pageTemplateApi.queryBySystem(store.systemCode).then((data) => {
      setTemplates(data?.templates || []);
    }).catch(() => { setTemplates([]); });
  }, [store.systemCode]);

  const pages = pageStore.getBySystem(store.systemCode);
  const currentPageExists = pages.some((p) => p.code === store.pageCode);

  const tableCount = store.items.filter((x) => x.itemType === 'table').length;
  const compCount = store.items.filter((x) => x.itemType === 'component').length;
  const elemCount = store.items.filter((x) => x.itemType === 'element').length;

  return (
    <div>
      <h3 style={panelTitle}><Icon name="detail" size={15} /> 页面属性</h3>

      <div className="hb-section" style={{ padding: 12, marginBottom: 12 }}>
        <SectionTitle>基础信息</SectionTitle>
        <Field label="页面名称" value={store.canvasName}
          onChange={(v) => store.setMeta({ canvasName: v })} />
        <Field label="页面代码" value={store.canvasCode}
          onChange={(v) => store.setMeta({ canvasCode: v })} />
        <Field label="英文名称" value={store.canvasEname}
          onChange={(v) => store.setMeta({ canvasEname: v })} />
        <Select label="系统代码" value={store.systemCode}
          onChange={(v) => store.setMeta({ systemCode: v })}>
          {sysStore.systems.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
          {!sysStore.systems.some((s) => s.code === store.systemCode) && (
            <option value={store.systemCode}>{store.systemCode}</option>
          )}
        </Select>
      </div>

      <div className="hb-section" style={{ padding: 12, marginBottom: 12 }}>
        <SectionTitle>页面与模板</SectionTitle>
        <Select label="页面代码" value={store.pageCode}
          onChange={(v) => store.setMeta({ pageCode: v })}>
          {pages.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
          {!currentPageExists && store.pageCode && (
            <option value={store.pageCode}>{store.pageCode}</option>
          )}
        </Select>
        <Select label="模板代码" value={store.templateCode}
          onChange={(v) => store.setMeta({ templateCode: v })}>
          <option value="">-- 无模板 --</option>
          {templates.map((t) => (
            <option key={t.c_template_code} value={t.c_template_code}>{t.c_template_name || t.c_template_code}</option>
          ))}
          {!templates.some((t) => t.c_template_code === store.templateCode) && store.templateCode && (
            <option value={store.templateCode}>{store.templateCode}</option>
          )}
        </Select>
        <Field label="表单列数 (Columns)" value={String(store.columns)} type="number"
          onChange={(v) => store.setColumns(Number(v))} />
      </div>

      <div className="hb-section" style={{ padding: 12, marginBottom: 12 }}>
        <SectionTitle>页面级按钮</SectionTitle>
        <PageButtonsEditor />
      </div>

      <div style={{ padding: '12px', background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)', borderRadius: 9, border: '1px solid #e2e8f0' }}>
        <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="stat" size={14} /> 画布统计
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatCell icon="list" label="表格" value={tableCount} />
          <StatCell icon="components" label="组件" value={compCount} />
          <StatCell icon="elements" label="元件" value={elemCount} />
        </div>
      </div>
    </div>
  );
}

/** 页面级按钮编辑器 —— 增删改画布顶部按钮 */
function PageButtonsEditor() {
  const store = useCanvasStore();
  const buttons = store.buttons || [];

  const addBtn = () => {
    store.addButton({ btn_name: '新按钮', btn_code: '', btn_event_type: '' });
  };

  return (
    <div>
      {buttons.length === 0 && (
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>暂无页面级按钮</div>
      )}
      {buttons.map((b) => (
        <div key={b._id} style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          padding: '6px 8px', background: '#f8fafc', borderRadius: 8, border: '1px solid #eef2f7',
        }}>
          <input
            value={b.btn_name || ''}
            onChange={(e) => store.updateButton(b._id, { btn_name: e.target.value })}
            placeholder="按钮名称"
            className="hb-input"
            style={{ flex: 1, padding: '5px 8px', fontSize: 12 }}
          />
          <input
            value={b.btn_code || ''}
            onChange={(e) => store.updateButton(b._id, { btn_code: e.target.value })}
            placeholder="事件代码"
            className="hb-input"
            style={{ flex: 1, padding: '5px 8px', fontSize: 12, fontFamily: 'monospace' }}
          />
          <button onClick={() => store.removeButton(b._id)}
            title="删除按钮"
            style={{
              flexShrink: 0, width: 22, height: 22, borderRadius: 6,
              background: '#fff', color: '#ff4d4f', border: '1px solid #ffccc7',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, lineHeight: 1, padding: 0,
            }}>
            ✕
          </button>
        </div>
      ))}
      <button onClick={addBtn}
        style={{
          width: '100%', padding: '6px', background: '#fff', border: '1px dashed #b3d4f7',
          borderRadius: 8, cursor: 'pointer', color: '#5d9cec', fontSize: 12, fontFamily: 'inherit',
        }}>
        + 添加页面级按钮
      </button>
    </div>
  );
}

function StatCell({ icon, label, value }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '8px 4px', background: '#fff',
      borderRadius: 8, border: '1px solid #e8ecf1',
    }}>
      <div style={{ color: '#5d9cec', marginBottom: 3, display: 'flex', justifyContent: 'center' }}>
        <Icon name={icon} size={14} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{label}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>
      {children}
    </div>
  );
}

const panelTitle = {
  color: '#1e293b', fontSize: 14, fontWeight: 600, margin: '0 0 14px',
  display: 'flex', alignItems: 'center', gap: 7,
};

const selStyle = {
  width: '100%', padding: '6px 9px', background: '#fff', color: '#334155',
  border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, cursor: 'pointer',
  outline: 'none', transition: 'border-color .15s, box-shadow .15s',
};
selStyle[':focus'] = { borderColor: '#5d9cec', boxShadow: '0 0 0 3px rgba(93,156,236,.15)' };

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <label style={{ color: '#64748b', fontSize: 11.5, display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="hb-input" style={{ padding: '6px 9px', fontSize: 12.5 }} />
    </div>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <label style={{ color: '#64748b', fontSize: 11.5, display: 'block', marginBottom: 4 }}>{label}</label>
      <select className="hb-select" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: '6px 9px', fontSize: 12.5 }}>
        {children}
      </select>
    </div>
  );
}
