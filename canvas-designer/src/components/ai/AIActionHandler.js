import { useAiStore } from '../../store/aiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useUiStore } from '../../store/uiStore';
import { useSystemStore } from '../../store/systemStore';
import { canvasApi } from '../../api/canvasApi';
import { canvasPublishApi } from '../../api/canvasPublishApi';
import { elementDefApi } from '../../api/elementDefApi';
import { elementGroupApi } from '../../api/elementGroupApi';
import { pageTemplateApi } from '../../api/pageTemplateApi';

/**
 * 需要人工确认的工具：不可逆、且影响当前画布之外（上生产 / 删除）。
 *
 * 为什么只拦这几个：日常编辑（addElement / updateElement / saveCanvas）
 * 改错了当场就能看见、也能再改回来，每次都拦只会让人习惯性点"允许"——
 * 那样审批就变成走过场，反而比不拦更危险（给人一种有保护伞的错觉）。
 * 真正该拦的是"点错了收不回来"的那些。
 */
export const APPROVAL_REQUIRED_TOOLS = new Set([
  'publishCanvas',
  'syncToProd',
  'deleteCanvas',
  'deleteElementDef',
  'deleteComponent',
  'deleteTemplate',
  'deleteSystem',
]);

/** 给人看的一句话说明，显示在确认卡片上。 */
export const APPROVAL_HINTS = {
  publishCanvas: '发布画布 —— 发布后对外可见',
  syncToProd: '同步到产品工厂 —— 会影响生产环境',
  deleteCanvas: '删除画布 —— 不可恢复',
  deleteElementDef: '删除元件定义 —— 不可恢复',
  deleteComponent: '删除组件 —— 不可恢复',
  deleteTemplate: '删除模板 —— 不可恢复',
  deleteSystem: '删除系统 —— 不可恢复',
};

export function requiresApproval(name) {
  return APPROVAL_REQUIRED_TOOLS.has(name);
}

/**
 * Execute AI tool calls against the canvas store and backend APIs.
 * 支持两类操作：
 *   - 同步画布操作（改内存 canvas store，不落库）
 *   - 异步后端操作（元件/组件/画布/模板/系统等模块，直接落库）
 *
 * @param {Array} toolCalls
 * @param {object} [opts]
 * @param {Function} [opts.requestApproval] async (call, hint) => boolean，
 *        返回 true 表示用户放行。不传则不启用人工闸门。
 * @param {Function} [opts.onEvent] 埋点钩子，用于上报审批事件
 * Returns a Promise resolving to an array of result strings.
 */
export async function executeToolCalls(toolCalls, { requestApproval, onEvent } = {}) {
  const store = useCanvasStore.getState();
  const ui = useUiStore.getState();
  const results = [];

  for (const call of toolCalls) {
    // 人工闸门：模型请求之后、真正执行之前
    if (requiresApproval(call.name) && requestApproval) {
      const approvalId = `ap_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
      const hint = APPROVAL_HINTS[call.name] || call.name;
      const reqEvId = onEvent
        ? onEvent({
            type: 'approval_request',
            name: `approval_request: ${call.name}`,
            input: { tool: call.name, arguments: call.input, description: hint },
            meta: { approval_id: approvalId, source: 'canvas' },
          })
        : null;

      let approved = false;
      try {
        approved = await requestApproval(call, hint);
      } catch {
        // 确认环节自身出错（比如 UI 崩了）。approved 保持 false，
        // 也就是按拒绝处理——宁可拦下，也不要因为出错就放行。
      }

      // 决策挂在请求之下（parentId），与 Python 侧一致：
      // 这样看板上点开决策节点能顺着 parent 链看到当时要批准的内容
      if (onEvent) {
        onEvent({
          type: 'approval_decision',
          name: `approval_decision: ${approved ? 'approved' : 'rejected'}`,
          parentId: reqEvId,
          output: { approved, decided_by: 'human' },
          meta: { approval_id: approvalId, source: 'canvas' },
        });
      }

      if (!approved) {
        // 拒绝当作观察回灌给模型，让它自己调整——和工具报错是同一套机制。
        // 必须明说"不要重试"，否则模型很可能原样再问一次。
        results.push(
          `⛔ 用户拒绝执行 ${call.name}。`
          + `不要重复请求同一个操作，请直接说明情况或改用其它方式。`
        );
        continue;
      }
    }

    try {
      const result = await executeOne(call.name, call.input, store, ui);
      results.push(result);
    } catch (e) {
      results.push(`❌ 执行 ${call.name} 失败: ${e.message}`);
    }
  }

  return results;
}

async function executeOne(name, input, store, ui) {
  switch (name) {
    // ================================================================
    // update_plan —— 不碰画布，只记录进度
    // ================================================================
    case 'update_plan': {
      const goal = String(input?.goal || '').trim();
      const steps = (input?.steps || []).map((s) => String(s).trim()).filter(Boolean);
      if (!goal || !steps.length) {
        return '❌ update_plan 需要 goal 和至少一条 steps';
      }
      const done = Math.max(0, Math.min(Number(input?.done) || 0, steps.length));
      useAiStore.getState().setPlan({ goal, steps, done });

      const remaining = steps.slice(done);
      return `📋 已更新计划：${goal}（${done}/${steps.length} 步）`
        + (remaining.length
          ? `\n剩余：${remaining.map((s, i) => `${done + i + 1}. ${s}`).join('；')}`
          : '\n全部步骤已完成');
    }


    // ================================================================
    // addElement
    // ================================================================
    case 'addElement': {
      const { controlType, elemName, elemCode, placeholder, required, rowIdx, targetContainerId, targetTabId } = input;

      const ref = {
        controlType: controlType || 'text',
        code: elemCode || `elem_${Date.now()}`,
        name: elemName || controlType,
        fieldName: elemCode || '',
        placeholder: placeholder || '',
        required: required || false,
      };

      const typeNames = {
        text: '文本框', number: '数字框', textarea: '文本域', select: '下拉框',
        datePicker: '日期时间', checkbox: '复选框', radio: '单选框',
        label: '标签文字', divider: '分割线', button: '按钮',
      };
      const typeLabel = typeNames[controlType] || controlType;

      // 指定了目标容器 → 加到容器内部
      if (targetContainerId != null) {
        const container = store.findItem(targetContainerId);
        if (!container) {
          return `⚠️ 未找到目标容器 id=${targetContainerId}，已跳过添加`;
        }
        if (container.itemType === 'section') {
          const id = store.addSectionChild(targetContainerId, 'element', ref);
          ui.select(id, 'element', 'element');
          return `✅ 已在区块「${container.refName || '区块'}」内添加${typeLabel}「${elemName || controlType}」(id=${id})`;
        }
        if (container.itemType === 'component') {
          const id = store.addComponentChild(targetContainerId, 'element', ref);
          ui.select(id, 'element', 'element');
          return `✅ 已在组件「${container.refName || '组件'}」内添加${typeLabel}「${elemName || controlType}」(id=${id})`;
        }
        if (container.itemType === 'tabGroup') {
          const tabs = container.tabs || [];
          const tabId = targetTabId ?? (container.activeTabId ?? tabs[0]?._id);
          if (tabId == null) {
            return `⚠️ 标签页容器「${container.refName || '标签页'}」内没有可用的标签，请先添加标签`;
          }
          const id = store.addTabChild(targetContainerId, tabId, 'element', ref);
          ui.select(id, 'element', 'element');
          const tabName = tabs.find((t) => t._id === tabId)?.name || '标签';
          return `✅ 已在标签「${tabName}」内添加${typeLabel}「${elemName || controlType}」(id=${id})`;
        }
        return `⚠️ 目标容器 id=${targetContainerId} 不是区块/组件/标签页，已跳过添加`;
      }

      // 未指定容器 → 追加到画布底部（原有逻辑）
      const last = store.items.length > 0 ? store.items[store.items.length - 1] : null;
      const ri = rowIdx ?? (last ? last._rowIdx || 0 : 0);
      const ci = last ? (last._colIdx || 0) + 1 : 0;
      const cols = store.columns || 2;
      const id = store.addItem('element', ref, ri, ci >= cols ? 0 : ci);
      ui.select(id, 'element', 'element');

      return `✅ 已添加${typeLabel}「${elemName || controlType}」(id=${id})`;
    }

    // ================================================================
    // removeElement
    // ================================================================
    case 'removeElement': {
      const { elementId } = input;
      const item = store.findItem(elementId);
      if (!item) return `⚠️ 未找到 id=${elementId} 的元素`;
      const name = item.elem_name || item.refName || item.control_type || '未命名';
      store.removeItem(elementId);
      ui.clearSelection();
      return `✅ 已删除「${name}」(id=${elementId})`;
    }

    // ================================================================
    // updateElement
    // ================================================================
    case 'updateElement': {
      const { elementId, ...patch } = input;
      const item = store.findItem(elementId);
      if (!item) return `⚠️ 未找到 id=${elementId} 的元素`;

      // Normalize patch keys from AI format to store format
      const normalized = {};
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'elemName') normalized.elem_name = v;
        else if (k === 'elemCode') normalized.elem_code = v;
        else if (k === 'controlType') normalized.control_type = v;
        else if (k === 'fieldName') normalized.rel_field_name = v;
        else if (k === 'required') normalized.required_flag = v ? '1' : '0'; // 兼容布尔 required
        else if (k === 'requiredFlag') normalized.required_flag = v ? '1' : '0';
        else if (k === 'required_flag' && typeof v === 'boolean') normalized.required_flag = v ? '1' : '0';
        else normalized[k] = v;
      }
      store.updateItem(elementId, normalized);

      const name = item.elem_name || item.refName || '未命名';
      const changes = Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(', ');
      return `✅ 已更新「${name}」: ${changes}`;
    }

    // ================================================================
    // updateCanvasMeta
    // ================================================================
    case 'updateCanvasMeta': {
      const meta = {};
      let desc = [];
      if (input.canvasName !== undefined) { meta.canvasName = input.canvasName; desc.push(`名称→"${input.canvasName}"`); }
      if (input.canvasType !== undefined) { meta.canvasType = input.canvasType; desc.push(`类型→${input.canvasType}`); }
      if (input.columns !== undefined) { meta.columns = input.columns; desc.push(`列数→${input.columns}`); }
      if (input.pageCode !== undefined) { meta.pageCode = input.pageCode; desc.push(`页面代码→${input.pageCode}`); }
      store.setMeta(meta);
      return `✅ 已更新画布: ${desc.join(', ')}`;
    }

    // ================================================================
    // addButton
    // ================================================================
    case 'addButton': {
      const { buttonName, buttonCode, eventName } = input;
      const btn = {
        c_button_code: buttonCode || `btn_${Date.now()}`,
        c_button_name: buttonName,
        c_button_ename: '',
        c_button_type: 'custom',
        c_event_name: eventName || '',
      };
      store.addButton(btn);
      return `✅ 已添加按钮「${buttonName}」`;
    }

    // ================================================================
    // addSection —— 添加区块
    // ================================================================
    case 'addSection': {
      const name = input.sectionName || input.name || '区块';
      const id = store.addSection(name);
      ui.select(id, 'section', 'section');
      return `✅ 已添加区块「${name}」(id=${id})`;
    }

    // ================================================================
    // addComponent —— 向当前画布添加组件块
    // ================================================================
    case 'addComponent': {
      const name = input.componentName || input.name || '组件';
      const id = store.addItem('component', { name });
      ui.select(id, 'component', 'component');
      return `✅ 已添加组件块「${name}」(id=${id})`;
    }

    // ================================================================
    // addTabGroup —— 添加标签页容器
    // ================================================================
    case 'addTabGroup': {
      const name = input.tabGroupName || input.name || '标签页';
      const id = store.addTabGroup(name);
      ui.select(id, 'tabGroup', 'tabGroup');
      return `✅ 已添加标签页容器「${name}」(id=${id})`;
    }

    // ================================================================
    // reorderBlock —— 调整顶层功能块顺序
    // ================================================================
    case 'reorderBlock': {
      const { blockId, position, targetBlockId } = input;
      const blocks = topLevelBlocks(store);
      const moved = blocks.find((b) => b._id === blockId);
      if (!moved) return `⚠️ 未找到要移动的块 id=${blockId}`;

      const posLabel = { top: '最上面', bottom: '最下面', above: '上方', below: '下方' }[position] || position;
      let targetName = '';
      if (position === 'above' || position === 'below') {
        const target = blocks.find((b) => b._id === targetBlockId);
        if (!target) return `⚠️ 未找到参考块 id=${targetBlockId}`;
        targetName = target.name;
      }

      store.moveBlockTo(blockId, position, targetBlockId);
      const name = moved.name;
      if (position === 'top') return `✅ 已将「${name}」移到最上面`;
      if (position === 'bottom') return `✅ 已将「${name}」移到最下面`;
      return `✅ 已将「${name}」移到「${targetName}」${position === 'above' ? '上面' : '下面'}`;
    }

    // ================================================================
    // saveCanvas —— 保存当前画布（落库）
    // ================================================================
    case 'saveCanvas': {
      const savedCode = await saveCurrentCanvas(store, { canvasName: input.canvasName });
      if (savedCode) return `✅ 画布已保存: ${savedCode}`;
      return `⚠️ 保存未返回画布代码，请重试`;
    }

    // ================================================================
    // previewCanvas —— 预览当前画布
    // ================================================================
    case 'previewCanvas': {
      // 幂等地打开预览视图（若已在预览则不重复 toggle 导致误关）
      useUiStore.setState({ previewOpen: true });
      return `✅ 已打开画布预览`;
    }

    // ================================================================
    // publishCanvas —— 发布当前画布（未保存先保存）
    // ================================================================
    case 'publishCanvas': {
      let code = store.canvasCode;
      if (!code) {
        code = await saveCurrentCanvas(store);
        if (!code) return `⚠️ 发布失败：画布保存未返回代码`;
      }
      const fresh = useCanvasStore.getState();
      const result = await canvasPublishApi.publish({
        canvasCode: code,
        versionName: input.versionName || undefined,
        publishNote: input.publishNote || undefined,
        systemCode: fresh.systemCode,
      });
      return `✅ 发布成功！版本 v${result?.version || '?'}`;
    }

    // ================================================================
    // syncToProd —— 同步画布到产品工厂
    // ================================================================
    case 'syncToProd': {
      let code = input.canvasCode || store.canvasCode;
      if (!code) {
        code = await saveCurrentCanvas(store);
        if (!code) return `⚠️ 同步失败：画布保存未返回代码`;
      }
      const result = await canvasApi.syncToProd(code);
      if (result?.success) {
        const n = result?.count;
        if (n === 0) {
          return `⚠️ ${result?.message || '该画布没有可同步的组件（仅组件会回写到产品工厂）'}`;
        }
        return `✅ 已将画布「${code}」同步到产品工厂（回写组件数=${n}）`;
      }
      return `⚠️ 同步失败: ${result?.message || '未知错误'}`;
    }

    // ================================================================
    // createElementDef —— 元件管理：创建元件定义
    // ================================================================
    case 'createElementDef': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      await elementDefApi.save({
        elem_code: input.elemCode || '',
        elem_name: input.elemName,
        elem_ename: input.elemEname || '',
        control_type: input.controlType || 'text',
        rel_table_name: input.tableName || input.relTableName || '',
        rel_field_name: input.fieldName || input.relFieldName || '',
        data_type: input.dataType || 'varchar',
        placeholder: input.placeholder || '',
        required_flag: input.required ? '1' : '0',
        check_type: input.checkType || 'none',
        default_value: input.defaultValue || '',
        systemCode: sysCode,
      });
      return `✅ 已创建元件定义「${input.elemName}」`;
    }

    // ================================================================
    // queryElementDefs —— 元件管理：查询元件定义
    // ================================================================
    case 'queryElementDefs': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      const data = await elementDefApi.queryBySystem(sysCode);
      const defs = data?.defs || data?.elements || [];
      if (defs.length === 0) return '📋 当前系统暂无元件定义';
      const list = defs.map((d) => `  • ${d.elem_code || d.code} — ${d.elem_name || d.name} [${d.control_type || d.controlType}]`).join('\n');
      return `📋 已有元件定义 (${defs.length}个):\n${list}`;
    }

    // ================================================================
    // deleteElementDef —— 元件管理：删除元件定义
    // ================================================================
    case 'deleteElementDef': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      await elementDefApi.delete(input.elemCode, sysCode);
      return `✅ 已删除元件定义「${input.elemCode}」`;
    }

    // ================================================================
    // createComponent —— 组件管理：创建组件
    // ================================================================
    case 'createComponent': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      const result = await elementGroupApi.save({
        groupName: input.groupName,
        groupCode: input.groupCode || '',
        groupDesc: input.groupDesc || '',
        groupType: input.groupType || 'form',
        groupTag: input.groupTag || '',
        systemCode: sysCode,
      });
      const groupCode = result?.groupCode || result?.code || input.groupCode || '';
      return `✅ 已创建组件「${input.groupName}」(${groupCode || '未返回代码'})`;
    }

    // ================================================================
    // queryComponents —— 组件管理：查询组件
    // ================================================================
    case 'queryComponents': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      const data = await elementGroupApi.queryBySystem(sysCode);
      const groups = data?.groups || [];
      if (groups.length === 0) return '📋 当前系统暂无组件';
      const list = groups.map((g) => `  • ${g.c_group_code} — ${g.c_group_name} [${g.c_group_type}]`).join('\n');
      return `📋 已有组件 (${groups.length}个):\n${list}`;
    }

    // ================================================================
    // deleteComponent —— 组件管理：删除组件
    // ================================================================
    case 'deleteComponent': {
      await elementGroupApi.delete(input.groupCode);
      return `✅ 已删除组件「${input.groupCode}」`;
    }

    // ================================================================
    // createPage —— 画布管理：创建空白画布页面
    // ================================================================
    case 'createPage': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      const pageName = input.pageName || '未命名页面';
      const pageCode = input.pageCode || `page_${Date.now()}`;
      const canvasJson = {
        c_canvas_name: pageName,
        c_canvas_code: pageCode,
        canvasType: input.pageType || 'form',
        columns: input.columns || 2,
        items: [],
        buttons: [],
        elements: [],
      };
      const result = await canvasApi.save({
        canvasCode: pageCode,
        canvasName: pageName,
        canvasEname: input.pageEname || '',
        canvasType: input.pageType || 'form',
        canvasJson: JSON.stringify(canvasJson),
        showOrder: 1, relJsFile: '', baseFlag: '0',
        systemCode: sysCode, pageCode, templateCode: '',
      });
      return `✅ 已创建画布「${pageName}」(${result?.canvasCode || pageCode})`;
    }

    // ================================================================
    // queryCanvases —— 画布管理：查询画布
    // ================================================================
    case 'queryCanvases': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      const data = await canvasApi.queryBySystem(sysCode);
      const canvases = data?.canvases || [];
      if (canvases.length === 0) return '📋 当前系统暂无画布';
      const list = canvases.map((c) => `  • ${c.c_canvas_code} — ${c.c_canvas_name || '未命名'}`).join('\n');
      return `📋 已有画布 (${canvases.length}个):\n${list}`;
    }

    // ================================================================
    // loadCanvas —— 打开/加载已有画布到设计器
    // ================================================================
    case 'loadCanvas': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      const query = input.canvasCode || input.canvasName || input.name || '';
      const canvas = await resolveCanvas(query, sysCode);
      if (!canvas) {
        return `⚠️ 未找到画布「${query}」，可先用「查询画布」确认代码或名称`;
      }
      const json = typeof canvas.c_canvas_json === 'string'
        ? JSON.parse(canvas.c_canvas_json || '{}')
        : (canvas.c_canvas_json || {});
      store.openCanvas(json, {
        canvasCode: canvas.c_canvas_code,
        canvasName: canvas.c_canvas_name,
        canvasEname: canvas.c_canvas_ename,
        canvasType: canvas.c_canvas_type,
        systemCode: canvas.c_system_code || sysCode,
        pageCode: canvas.c_page_code || 'PAGE01',
      });
      store.setMeta({ templateCode: canvas.c_template_code || '' });
      useUiStore.getState().clearSelection();
      return `✅ 已在设计器中打开画布「${canvas.c_canvas_name || canvas.c_canvas_code}」(${canvas.c_canvas_code})`;
    }

    // ================================================================
    // deleteCanvas —— 画布管理：删除画布
    // ================================================================
    case 'deleteCanvas': {
      await canvasApi.delete(input.canvasCode);
      return `✅ 已删除画布「${input.canvasCode}」`;
    }

    // ================================================================
    // createTemplate —— 模板管理：创建模板
    // ================================================================
    case 'createTemplate': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      const result = await pageTemplateApi.save({
        templateCode: input.templateCode || '',
        templateName: input.templateName,
        templateDesc: input.templateDesc || '',
        templateType: input.templateType || 'page',
        systemCode: sysCode,
      });
      if (result && result.success === false) {
        return `⚠️ 模板保存失败: ${result.message || '未返回有效数据'}`;
      }
      return `✅ 已创建模板「${input.templateName}」(${input.templateCode || ''})`;
    }

    // ================================================================
    // queryTemplates —— 模板管理：查询模板
    // ================================================================
    case 'queryTemplates': {
      const sysCode = input.systemCode || store.systemCode || 'SYS01';
      const data = await pageTemplateApi.queryBySystem(sysCode);
      const templates = data?.templates || [];
      if (templates.length === 0) return '📋 当前系统暂无模板';
      const list = templates.map((t) => `  • ${t.c_template_code} — ${t.c_template_name} [${t.c_template_type}]`).join('\n');
      return `📋 已有模板 (${templates.length}个):\n${list}`;
    }

    // ================================================================
    // deleteTemplate —— 模板管理：删除模板
    // ================================================================
    case 'deleteTemplate': {
      await pageTemplateApi.delete(input.templateCode);
      return `✅ 已删除模板「${input.templateCode}」`;
    }

    // ================================================================
    // addSystem / updateSystem / deleteSystem —— 系统管理
    // ================================================================
    case 'addSystem': {
      useSystemStore.getState().addSystem({
        code: input.code,
        name: input.name,
        description: input.description || '',
      });
      return `✅ 已新增系统「${input.name}」(${input.code})`;
    }

    case 'updateSystem': {
      const patch = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;
      useSystemStore.getState().updateSystem(input.code, patch);
      return `✅ 已更新系统「${input.code}」`;
    }

    case 'deleteSystem': {
      useSystemStore.getState().deleteSystem(input.code);
      return `✅ 已删除系统「${input.code}」`;
    }

    default:
      return `⚠️ 未知操作: ${name}`;
  }
}

/** 取当前画布的顶层功能块（区块/组件/表格/标签页），含名称。 */
function topLevelBlocks(store) {
  const label = (it) => {
    if (it.refName) return it.refName;
    switch (it.itemType) {
      case 'section': return '区块';
      case 'component': return '组件';
      case 'table': return '数据列表';
      case 'tabGroup': return '标签页';
      default: return '块';
    }
  };
  return (store.items || [])
    .filter((it) => ['section', 'component', 'table', 'tabGroup'].includes(it.itemType))
    .map((it) => ({ _id: it._id, type: it.itemType, name: label(it) }));
}

/** 保存当前画布到后端，返回画布代码（失败抛异常由上层捕获）。 */
async function saveCurrentCanvas(store, overrides = {}) {
  const json = store.getCanvasJson();
  const result = await canvasApi.save({
    canvasCode: store.canvasCode || undefined,
    canvasName: overrides.canvasName || store.canvasName,
    canvasEname: overrides.canvasEname || store.canvasEname,
    canvasType: overrides.canvasType || store.canvasType,
    canvasJson: JSON.stringify(json),
    showOrder: 1, relJsFile: '', baseFlag: '0',
    systemCode: store.systemCode, pageCode: store.pageCode, templateCode: store.templateCode,
  });
  const savedCode = result?.canvasCode;
  if (savedCode) {
    store.setMeta({ canvasCode: savedCode });
  }
  return savedCode;
}

/** 归一化：去除 - / _ / 空格，转小写，用于模糊比对。 */
function norm(s) {
  return String(s ?? '').replace(/[-\s_]/g, '').toLowerCase();
}

/**
 * 按「代码或名称/展示标签」定位画布：
 *   1. 先按代码精确查（canvasApi.queryByCode）
 *   2. 未命中则遍历系统画布列表，按 code/name/展示 label 做模糊匹配
 * 命中后尽量重新按精确代码拉取全量（含 c_canvas_json）。
 */
async function resolveCanvas(codeOrName, sysCode) {
  const query = String(codeOrName || '').trim();
  if (!query) return null;

  // 1) 精确代码
  try {
    const d = await canvasApi.queryByCode(query);
    if (d?.canvas) return d.canvas;
  } catch { /* 忽略，继续模糊匹配 */ }

  // 2) 模糊匹配
  let list = [];
  try {
    const listData = await canvasApi.queryBySystem(sysCode);
    list = listData?.canvases || [];
  } catch { /* 忽略 */ }

  const q = norm(query);
  let best = null;
  for (const c of list) {
    const code = String(c.c_canvas_code || '');
    const name = String(c.c_canvas_name || '');
    const prodCode = code.replace('_', '-');
    const label = (name && !name.startsWith(prodCode)) ? `${prodCode}-${name}` : (name || code);
    const ncode = norm(code);
    const nname = norm(name);
    const nlabel = norm(label);

    if (nlabel === q || ncode === q) { best = c; break; }                        // 完整 label 或 code 相等
    if (ncode && nname && q.includes(ncode) && q.includes(nname)) { best = c; break; } // 同时含 code + name
    if (!best && q && nlabel.includes(q)) best = c;                              // label 包含 query
    if (!best && ncode && q.includes(ncode)) best = c;                           // query 包含 code
  }

  if (!best) return null;

  // 命中后按精确代码拉全量
  try {
    const d2 = await canvasApi.queryByCode(best.c_canvas_code);
    if (d2?.canvas) return d2.canvas;
  } catch { /* 忽略 */ }
  return best;
}
