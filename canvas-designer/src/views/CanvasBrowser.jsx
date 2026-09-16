import { useState, useEffect } from 'react';
import { useSystemStore } from '../store/systemStore';
import { useCanvasStore } from '../store/canvasStore';
import { useUiStore } from '../store/uiStore';
import { canvasApi } from '../api/canvasApi';
import PublishHistoryDialog from '../components/dialogs/PublishHistoryDialog';
import { Hero, heroAction, Toolbar, Card, EmptyState, Tag, btnDefault, btnDanger, Pagination } from '../components/common/FormFields';
import Icon from '../components/common/Icon';

const CANVAS_TYPE_LABELS = { form: '表单', table: '表格', dashboard: '仪表板', custom: '自定义' };
const CANVAS_TYPE_TONE = { form: 'blue', table: 'green', dashboard: 'amber', custom: 'gray' };

/** 格式化创建时间（兼容时间戳 / ISO 字符串 / 无时区 datetime），无值返回 — */
function formatTime(v) {
  if (v === null || v === undefined || v === '') return '—';
  let d = null;
  if (typeof v === 'number') {
    d = new Date(v);
  } else if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '—';
    if (/^\d+$/.test(s)) {
      d = new Date(Number(s));
    } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
      // 无时区的本地时间（后端 d_crtr_time 是 datetime，序列化可能不带时区）→ 按本地解析
      d = new Date(s.replace(' ', 'T'));
    } else {
      // 带时区的 ISO 字符串 → 正常解析（会自动转本地）
      d = new Date(s);
    }
  } else if (v instanceof Date) {
    d = v;
  }
  if (!d || isNaN(d.getTime())) return '—';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function CanvasBrowser() {
  const sysStore = useSystemStore();
  const canvasStore = useCanvasStore();
  const ui = useUiStore();
  const [sysCode, setSysCode] = useState('SYS01');
  const [canvases, setCanvases] = useState([]);
  const [total, setTotal] = useState(0);
  const [allCanvases, setAllCanvases] = useState([]); // 全量，仅用于统计
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [publishCanvas, setPublishCanvas] = useState(null); // { canvasCode, canvasName }
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  // 关键词变化时回到第一页
  const handleKeywordChange = (v) => {
    setKeyword(v);
    setPage(1);
  };

  // 分页加载
  useEffect(() => {
    let cancelled = false;
    let timer = setTimeout(() => { if (!cancelled) setLoading(true); }, 0);
    canvasApi.queryByPage({
      systemCode: sysCode,
      keyword: debouncedKeyword || undefined,
      pageNum: page,
      pageSize,
    }).then((data) => {
      if (cancelled) return;
      const pg = data?.page || {};
      setCanvases(pg.data || []);
      setTotal(pg.total || 0);
    }).catch((e) => {
      if (cancelled) return;
      setCanvases([]);
      setTotal(0);
      ui.addToast('加载画布列表失败: ' + (e.message || '网络错误'), 'error');
    }).finally(() => {
      if (cancelled) return;
      clearTimeout(timer);
      setLoading(false);
    });
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sysCode, page, pageSize, debouncedKeyword, refreshKey]);

  // 全量统计
  useEffect(() => {
    canvasApi.queryBySystem(sysCode)
      .then((d) => setAllCanvases(d?.canvases || []))
      .catch(() => setAllCanvases([]));
  }, [sysCode, refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);

  const handleOpen = async (cv) => {
    try {
      const data = await canvasApi.queryByCode(cv.c_canvas_code);
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
      canvasStore.setMeta({ templateCode: c.c_template_code || '' });
      ui.addToast('画布已加载到设计器', 'success');
      window.location.hash = 'designer';
    } catch (e) {
      ui.addToast('加载失败: ' + (e.message || ''), 'error');
    }
  };

  const handleDelete = async (canvasCode) => {
    try {
      await canvasApi.delete(canvasCode);
      ui.addToast('画布已删除', 'success');
      setDeleteConfirm(null);
      // 当前页删空则回退一页，否则刷新
      if (canvases.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (e) {
      ui.addToast('删除失败: ' + (e.message || ''), 'error');
    }
  };

  const handleCopy = async (cv) => {
    const newName = prompt('新画布名称:', (cv.c_canvas_name || '') + '-副本');
    if (!newName) return;
    try {
      const result = await canvasApi.copy({
        sourceCanvasCode: cv.c_canvas_code,
        targetSystemCode: cv.c_system_code || sysCode,
        targetPageCode: cv.c_page_code || '',
        targetCanvasName: newName,
      });
      if (result?.newCanvasCode) {
        ui.addToast('画布已复制: ' + result.newCanvasCode, 'success');
        reload();
      }
    } catch (e) {
      ui.addToast('复制失败: ' + (e.message || ''), 'error');
    }
  };

  const [syncingCode, setSyncingCode] = useState(null);

  const handleSync = async (cv) => {
    if (syncingCode) return; // 防止重复点击
    setSyncingCode(cv.c_canvas_code);
    try {
      const result = await canvasApi.syncToProd(cv.c_canvas_code);
      if (result?.success) {
        ui.addToast('同步成功: ' + cv.c_canvas_name, 'success');
      } else {
        ui.addToast('同步失败: ' + (result?.message || '未知错误'), 'error');
      }
    } catch (e) {
      ui.addToast('同步失败: ' + (e.message || ''), 'error');
    } finally {
      setSyncingCode(null);
    }
  };

  const stats = [
    { icon: 'canvases', label: '画布总数', value: allCanvases.length },
    { icon: 'type', label: '表单画布', value: allCanvases.filter((c) => c.c_canvas_type === 'form').length },
    { icon: 'list', label: '表格画布', value: allCanvases.filter((c) => c.c_canvas_type === 'table').length },
    { icon: 'stat', label: '其他类型', value: allCanvases.filter((c) => !['form', 'table'].includes(c.c_canvas_type)).length },
  ];

  return (
    <div className="hb-page">
      <div className="hb-page-inner" style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Hero
          icon="canvases"
          title="画布浏览"
          desc="查看和管理所有已保存的画布"
          actions={
            <button onClick={() => {
              canvasStore.reset();
              canvasStore.setMeta({ systemCode: sysCode });
              window.location.hash = 'designer';
            }} className={heroAction}>
              <Icon name="plus" size={14} /> 新建画布
            </button>
          }
          stats={stats}
        />

        <Toolbar
          systemCode={sysCode}
          systems={sysStore.systems}
          count={total}
          onSystemChange={(e) => {
            if (e.target.value === '__manage__') { window.location.hash = 'system'; return; }
            setSysCode(e.target.value);
            setPage(1);
          }}
          onRefresh={reload}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <input
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              placeholder="搜索名称或代码..."
              className="hb-input"
              style={{ width: 180, padding: '5px 10px', fontSize: 12 }}
            />
            {keyword && (
              <button onClick={() => handleKeywordChange('')} className="hb-icon-btn" style={{ width: 22, height: 22 }} title="清除">
                <Icon name="close" size={13} />
              </button>
            )}
          </div>
        </Toolbar>

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="hb-note tone-red" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: '#ff4d4f', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="alert" size={15} /> 确定删除画布 <strong>"{deleteConfirm.name}"</strong> ({deleteConfirm.code})？
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleDelete(deleteConfirm.code)} className={btnDanger}>确认删除</button>
              <button onClick={() => setDeleteConfirm(null)} className={btnDefault}>取消</button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>加载中...</div>
        ) : canvases.length === 0 ? (
          <EmptyState
            icon="canvases"
            title={debouncedKeyword ? '未找到匹配的画布' : '暂无画布'}
            hint={debouncedKeyword ? `没有名称或代码包含 "${debouncedKeyword}" 的画布` : '在该系统下还没有保存的画布，去设计器创建一个吧'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {canvases.map((cv, i) => (
              <div key={i} className="hb-card hoverable" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                  background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
                  color: '#5d9cec', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="canvases" size={19} />
                </span>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                      {cv.c_canvas_name || '未命名画布'}
                    </span>
                    <Tag tone={CANVAS_TYPE_TONE[cv.c_canvas_type] || 'gray'}>
                      {CANVAS_TYPE_LABELS[cv.c_canvas_type] || cv.c_canvas_type || 'form'}
                    </Tag>
                    {cv.c_template_code && (
                      <Tag tone="violet"><Icon name="templates" size={11} /> {cv.c_template_code}</Tag>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                    <span>Code: {cv.c_canvas_code}</span>
                    {cv.c_page_code && <span>页面: {cv.c_page_code}</span>}
                    {cv.c_canvas_ename && <span>EN: {cv.c_canvas_ename}</span>}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title="创建时间">
                      <Icon name="clock" size={12} /> {formatTime(cv.d_crtr_time)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title="更新时间">
                      <Icon name="refresh" size={12} /> {formatTime(cv.d_uptr_time)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                  <button onClick={() => setPublishCanvas({ canvasCode: cv.c_canvas_code, canvasName: cv.c_canvas_name })} className="hb-btn sm tone-violet">
                    <Icon name="publish" size={12} /> 发布记录
                  </button>
                  <button onClick={() => handleOpen(cv)} className="hb-btn sm tone-blue">
                    <Icon name="eye" size={12} /> 打开
                  </button>
                  <button onClick={() => handleSync(cv)} disabled={syncingCode === cv.c_canvas_code}
                    className="hb-btn sm tone-green" title="同步到产品工厂"
                    style={{ opacity: syncingCode === cv.c_canvas_code ? 0.6 : 1 }}>
                    <Icon name="refresh" size={12} /> {syncingCode === cv.c_canvas_code ? '同步中…' : '同步'}
                  </button>
                  <button onClick={() => handleCopy(cv)} className="hb-btn sm"><Icon name="copy" size={12} /> 复制</button>
                  <button onClick={() => setDeleteConfirm({ code: cv.c_canvas_code, name: cv.c_canvas_name })} className="hb-btn danger sm">删除</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && total > 0 && (
          <Card bodyStyle={{ padding: 0 }} style={{ marginTop: 10 }}>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            />
          </Card>
        )}
      </div>

      {/* Publish history dialog */}
      {publishCanvas && (
        <PublishHistoryDialog
          canvasCode={publishCanvas.canvasCode}
          canvasName={publishCanvas.canvasName}
          onClose={() => setPublishCanvas(null)}
        />
      )}
    </div>
  );
}
