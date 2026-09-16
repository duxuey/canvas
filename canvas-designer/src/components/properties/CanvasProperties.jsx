import { useCanvasStore } from '../../store/canvasStore';
import { useSystemStore } from '../../store/systemStore';
import { usePageStore } from '../../store/pageStore';
import { pageTemplateApi } from '../../api/pageTemplateApi';
import { useState, useEffect } from 'react';

export default function CanvasProperties() {
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

  return (
    <div>
      <h3 style={{ color: '#333', fontSize: 14, marginBottom: 12 }}>画布属性</h3>
      <Field label="画布名称" value={store.canvasName}
        onChange={(v) => store.setMeta({ canvasName: v })} />
      <Field label="画布代码" value={store.canvasCode}
        onChange={(v) => store.setMeta({ canvasCode: v })} />
      <Field label="英文名称" value={store.canvasEname}
        onChange={(v) => store.setMeta({ canvasEname: v })} />
      <div style={{ marginBottom: 8 }}>
        <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 2 }}>系统代码</label>
        <select style={selStyle}
          value={store.systemCode}
          onChange={(e) => store.setMeta({ systemCode: e.target.value })}>
          {sysStore.systems.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
          {!sysStore.systems.some((s) => s.code === store.systemCode) && (
            <option value={store.systemCode}>{store.systemCode}</option>
          )}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 2 }}>页面代码</label>
        <select style={selStyle}
          value={store.pageCode}
          onChange={(e) => store.setMeta({ pageCode: e.target.value })}>
          {pages.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
          {!currentPageExists && store.pageCode && (
            <option value={store.pageCode}>{store.pageCode}</option>
          )}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 2 }}>模板代码</label>
        <select style={selStyle}
          value={store.templateCode}
          onChange={(e) => store.setMeta({ templateCode: e.target.value })}>
          <option value="">-- 无模板 --</option>
          {templates.map((t) => (
            <option key={t.c_template_code} value={t.c_template_code}>{t.c_template_name || t.c_template_code}</option>
          ))}
          {!templates.some((t) => t.c_template_code === store.templateCode) && store.templateCode && (
            <option value={store.templateCode}>{store.templateCode}</option>
          )}
        </select>
      </div>
      <div style={{ marginTop: 16 }}>
        <Field label="表单列数 (Columns)" value={String(store.columns)} type="number"
          onChange={(v) => store.setColumns(Number(v))} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 2 }}>{label}</label>
      <input type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '6px 8px', background: '#ffffff', color: '#333',
          border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13 }} />
    </div>
  );
}

const selStyle = {
  width: '100%', padding: '6px 8px', background: '#ffffff', color: '#333',
  border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13, marginTop: 2,
};
