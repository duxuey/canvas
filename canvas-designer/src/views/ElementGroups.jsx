import { useState, useEffect } from 'react';
import { useElementGroupStore } from '../store/elementGroupStore';
import { useSystemStore } from '../store/systemStore';
import { PageHeader, Toolbar, Card, EmptyState, Tag, btnPrimary, btnDefault, btnDanger } from '../components/common/FormFields';
import Icon from '../components/common/Icon';

export default function ElementGroups() {
  const grpStore = useElementGroupStore();
  const sysStore = useSystemStore();
  const [sysCode, setSysCode] = useState('SYS01');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    groupCode: '', groupName: '', groupDesc: '', groupType: 'form', groupTag: '', systemCode: 'SYS01',
  });

  useEffect(() => {
    grpStore.loadGroups(sysCode);
  }, [sysCode]);

  const handleSave = async () => {
    await grpStore.saveGroup({ ...form, systemCode: sysCode });
    grpStore.loadGroups(sysCode);
    setShowNew(false);
  };

  return (
    <div className="hb-page">
      <div className="hb-page-inner" style={{ maxWidth: 940, margin: '0 auto' }}>
        <PageHeader
          icon="groupFields"
          title="分组管理"
          desc="管理元件分组"
          actions={
            <button onClick={() => setShowNew(!showNew)} className={btnPrimary}>
              <Icon name="plus" size={13} /> 新建分组
            </button>
          }
        />

        <Toolbar
          systemCode={sysCode}
          systems={sysStore.systems}
          count={(grpStore.groups || []).length}
          onSystemChange={(e) => {
            if (e.target.value === '__manage__') { window.location.hash = 'system'; return; }
            setSysCode(e.target.value);
          }}
          onRefresh={() => grpStore.loadGroups(sysCode)}
        />

        {showNew && (
          <Card title="新建分组" icon="groupFields" style={{ marginBottom: 16 }}
            actions={<button onClick={() => setShowNew(false)} className="hb-icon-btn"><Icon name="close" size={15} /></button>}>
            <input placeholder="分组代码" value={form.groupCode}
              onChange={(e) => setForm({ ...form, groupCode: e.target.value })}
              className="hb-input" style={{ marginBottom: 10 }} />
            <input placeholder="分组名称" value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })}
              className="hb-input" style={{ marginBottom: 10 }} />
            <input placeholder="分组描述" value={form.groupDesc}
              onChange={(e) => setForm({ ...form, groupDesc: e.target.value })}
              className="hb-input" style={{ marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} className={btnPrimary}>保存</button>
              <button onClick={() => setShowNew(false)} className={btnDefault}>取消</button>
            </div>
          </Card>
        )}

        {(grpStore.groups || []).length === 0 ? (
          <EmptyState icon="groupFields" title="暂无分组" hint="点击「新建分组」开始" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(grpStore.groups || []).map((g, i) => (
              <Card key={i} hoverable bodyStyle={{ padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
                    color: '#5d9cec', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="groupFields" size={17} />
                  </span>
                  <span style={{ color: '#1e293b', flex: 1, fontSize: 14, fontWeight: 500 }}>{g.c_group_name || g.c_group_code}</span>
                  <Tag tone="gray">{g.c_group_type}</Tag>
                  <button onClick={async () => {
                    await grpStore.deleteGroup(g.c_group_code);
                    grpStore.loadGroups(sysCode);
                  }} className={btnDanger}>删除</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
