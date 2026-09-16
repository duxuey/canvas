import { useState, useEffect } from 'react';
import { useTemplateStore } from '../store/templateStore';
import { useCanvasStore } from '../store/canvasStore';
import { useUiStore } from '../store/uiStore';
import { useSystemStore } from '../store/systemStore';
import { pageTemplateApi } from '../api/pageTemplateApi';
import { canvasApi } from '../api/canvasApi';
import { Hero, heroAction, Toolbar, Card, EmptyState, Tag, btnPrimary, btnDefault, Pagination } from '../components/common/FormFields';
import Icon from '../components/common/Icon';

const TYPE_TONE = { page: 'blue', form: 'green', table: 'amber' };

export default function Templates() {
  const tplStore = useTemplateStore();
  const canvasStore = useCanvasStore();
  const ui = useUiStore();
  const sysStore = useSystemStore();
  const [sysCode, setSysCode] = useState('SYS01');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    templateCode: '', templateName: '', templateDesc: '', templateType: 'page', systemCode: 'SYS01',
  });
  const [expanded, setExpanded] = useState(null);
  const [canvases, setCanvases] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    tplStore.loadTemplates(sysCode).catch((e) => {
      console.error('模板加载失败:', e);
      ui.addToast('加载模板列表失败: ' + (e.message || '网络错误'), 'error');
    });
  }, [sysCode]);

  const handleSave = async () => {
    if (!form.templateName.trim()) {
      ui.addToast('请输入模板名称', 'error');
      return;
    }
    setSaving(true);
    try {
      const result = await tplStore.saveTemplate({ ...form, systemCode: sysCode });
      if (!result || result.success === false) {
        const msg = (result && result.message) || '保存失败，未返回有效数据';
        ui.addToast(msg, 'error');
        console.error('模板保存失败 - API返回:', result);
        return;
      }
      ui.addToast('模板保存成功', 'success');
      setShowNew(false);
      setForm({ templateCode: '', templateName: '', templateDesc: '', templateType: 'page', systemCode: sysCode });
      await tplStore.loadTemplates(sysCode);
    } catch (e) {
      console.error('模板保存失败:', e);
      ui.addToast('保存失败: ' + (e.message || '未知错误'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateCode) => {
    try {
      await tplStore.deleteTemplate(templateCode);
      ui.addToast('模板已删除', 'success');
      await tplStore.loadTemplates(sysCode);
    } catch (e) {
      ui.addToast('删除失败: ' + (e.message || '未知错误'), 'error');
    }
  };

  // Expand template to show canvases
  const handleExpand = async (templateCode) => {
    if (expanded === templateCode) { setExpanded(null); setCanvases([]); return; }
    setExpanded(templateCode);
    try {
      const data = await pageTemplateApi.queryCanvases(templateCode);
      setCanvases(data?.canvases || []);
    } catch {
      setCanvases([]);
    }
  };

  // Load a canvas into the designer
  const handleLoadToDesigner = async (canvasCode) => {
    try {
      const data = await canvasApi.queryByCode(canvasCode);
      const c = data?.canvas;
      if (!c) { ui.addToast('画布未找到', 'error'); return; }
      const json = typeof c.c_canvas_json === 'string' ? JSON.parse(c.c_canvas_json || '{}') : (c.c_canvas_json || {});
      canvasStore.setFromCanvas(json, {
        canvasCode: c.c_canvas_code,
        canvasName: c.c_canvas_name,
        canvasEname: c.c_canvas_ename,
        canvasType: c.c_canvas_type,
        systemCode: c.c_system_code,
        pageCode: c.c_page_code,
      });
      canvasStore.setMeta({ templateCode: expanded || '' });
      ui.addToast('画布已加载到设计器', 'success');
      window.location.hash = 'designer';
    } catch (e) {
      ui.addToast('加载失败: ' + (e.message || ''), 'error');
    }
  };

  const tpls = tplStore.templates || [];
  const totalPages = Math.max(1, Math.ceil(tpls.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pagedTpls = tpls.slice((curPage - 1) * pageSize, curPage * pageSize);
  const stats = [
    { icon: 'templates', label: '模板总数', value: tpls.length },
    { icon: 'detail', label: '页面模板', value: tpls.filter((t) => t.c_template_type === 'page').length },
    { icon: 'type', label: '表单模板', value: tpls.filter((t) => t.c_template_type === 'form').length },
    { icon: 'list', label: '表格模板', value: tpls.filter((t) => t.c_template_type === 'table').length },
  ];

  return (
    <div className="hb-page">
      <div className="hb-page-inner" style={{ maxWidth: 940, margin: '0 auto' }}>
        <Hero
          icon="templates"
          title="页面模板管理"
          desc="管理可复用的页面模板，按系统归类"
          actions={
            <button onClick={() => setShowNew(!showNew)} className={heroAction}>
              <Icon name="plus" size={14} /> 新建模板
            </button>
          }
          stats={stats}
        />

        <Toolbar
          systemCode={sysCode}
          systems={sysStore.systems}
          count={(tplStore.templates || []).length}
          onSystemChange={(e) => {
            if (e.target.value === '__manage__') { window.location.hash = 'system'; return; }
            setSysCode(e.target.value);
            setPage(1);
          }}
          onRefresh={() => tplStore.loadTemplates(sysCode)}
        />

        {showNew && (
          <Card title="新建模板" icon="templates" style={{ marginBottom: 16 }}
            actions={<button onClick={() => setShowNew(false)} className="hb-icon-btn"><Icon name="close" size={15} /></button>}>
            <input placeholder="模板代码 (留空自动生成)" value={form.templateCode}
              onChange={(e) => setForm({ ...form, templateCode: e.target.value })}
              className="hb-input" style={{ marginBottom: 10 }} />
            <input placeholder="模板名称 *必填" value={form.templateName}
              onChange={(e) => setForm({ ...form, templateName: e.target.value })}
              className="hb-input" style={{ marginBottom: 10 }} />
            <input placeholder="模板描述" value={form.templateDesc}
              onChange={(e) => setForm({ ...form, templateDesc: e.target.value })}
              className="hb-input" style={{ marginBottom: 10 }} />
            <select value={form.templateType}
              onChange={(e) => setForm({ ...form, templateType: e.target.value })}
              className="hb-select" style={{ width: 'auto' }}>
              <option value="page">page - 页面模板</option>
              <option value="form">form - 表单模板</option>
              <option value="table">table - 表格模板</option>
            </select>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? '保存中...' : '保存'}</button>
              <button onClick={() => setShowNew(false)} className={btnDefault}>取消</button>
            </div>
          </Card>
        )}

        {tplStore.loading && <p style={{ color: '#94a3b8', fontSize: 13 }}>加载中...</p>}
        {(tplStore.templates || []).length === 0 && !tplStore.loading && (
          <EmptyState icon="templates" title="暂无模板" hint="点击「新建模板」开始" />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pagedTpls.map((tpl, i) => {
            const isOpen = expanded === tpl.c_template_code;
            return (
              <Card key={i} hoverable bodyStyle={{ padding: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  background: isOpen ? 'linear-gradient(90deg, #eff5fd, #fbfcfe)' : 'transparent',
                }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
                    color: '#5d9cec', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="templates" size={16} />
                  </span>
                  <button onClick={() => handleExpand(tpl.c_template_code)}
                    style={{ color: '#1e293b', flex: 1, fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}>
                    {tpl.c_template_name || tpl.c_template_code}
                  </button>
                  <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>{tpl.c_template_code}</span>
                  <Tag tone={TYPE_TONE[tpl.c_template_type] || 'gray'}>{tpl.c_template_type}</Tag>
                  <button onClick={() => handleExpand(tpl.c_template_code)} className="hb-btn sm">
                    {isOpen ? '收起' : '展开'} <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={12} />
                  </button>
                  <button onClick={() => {
                    setForm({
                      templateCode: tpl.c_template_code || '',
                      templateName: tpl.c_template_name || '',
                      templateDesc: tpl.c_template_desc || '',
                      templateType: tpl.c_template_type || 'page',
                      systemCode: sysCode,
                    });
                    setShowNew(true);
                  }} className="hb-btn sm tone-blue">
                    <Icon name="edit" size={12} /> 编辑
                  </button>
                  <button onClick={() => handleDelete(tpl.c_template_code)} className="hb-btn danger sm">删除</button>
                </div>

                {isOpen && (
                  <div style={{ padding: '4px 16px 16px 62px', borderTop: '1px solid #eef2f7' }}>
                    {canvases.length === 0 && (
                      <div style={{ padding: '10px 0', color: '#94a3b8', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>该模板下暂无画布</span>
                        <button
                          onClick={() => {
                            canvasStore.reset();
                            canvasStore.setMeta({ templateCode: tpl.c_template_code, systemCode: tpl.c_system_code || sysCode });
                            window.location.hash = 'designer';
                          }}
                          className={btnPrimary} style={{ fontSize: 12 }}>
                          在模板下新建画布
                        </button>
                      </div>
                    )}
                    {canvases.map((cv, ci) => (
                      <div key={ci} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        background: '#fff', borderRadius: 8, marginBottom: 6, border: '1px solid #eef2f7',
                      }}>
                        <span style={{ color: '#334155', flex: 1, fontSize: 13 }}>
                          {cv.c_canvas_name || cv.c_canvas_code}
                        </span>
                        <Tag tone={TYPE_TONE[cv.c_canvas_type] || 'gray'}>{cv.c_canvas_type}</Tag>
                        <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>{cv.c_canvas_code}</span>
                        <button onClick={() => handleLoadToDesigner(cv.c_canvas_code)} className={btnPrimary} style={{ fontSize: 12 }}>
                          打开到设计器
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {!tplStore.loading && tpls.length > 0 && (
          <Card bodyStyle={{ padding: 0 }} style={{ marginTop: 8 }}>
            <Pagination
              page={curPage}
              pageSize={pageSize}
              total={tpls.length}
              onPageChange={setPage}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
