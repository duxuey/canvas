import { elementDefApi } from '../../api/elementDefApi';
import { elementGroupApi } from '../../api/elementGroupApi';
import { canvasApi } from '../../api/canvasApi';

/**
 * Execute AI page-generation tool calls by calling backend APIs.
 * Each tool creates/reads persistent entities (element defs, components, pages).
 *
 * Returns an array of result strings describing what was done.
 */
export async function executePageGenToolCalls(toolCalls) {
  const results = [];

  for (const call of toolCalls) {
    try {
      const result = await executeOne(call.name, call.input);
      results.push(result);
    } catch (e) {
      results.push(`❌ 执行 ${call.name} 失败: ${e.message}`);
    }
  }

  return results;
}

async function executeOne(name, input) {
  switch (name) {
    // ================================================================
    // createElementDef
    // ================================================================
    case 'createElementDef': {
      const result = await elementDefApi.save({
        elemCode: input.elemCode || '',
        elemName: input.elemName,
        elemEname: input.elemEname || '',
        controlType: input.controlType || 'text',
        relTableName: input.tableName || input.relTableName || '',
        relFieldName: input.fieldName || input.relFieldName || '',
        dataType: input.dataType || 'varchar',
        placeholder: input.placeholder || '',
        requiredFlag: input.required ? '1' : '0',
        checkType: input.checkType || 'none',
        defaultValue: input.defaultValue || '',
        systemCode: input.systemCode || 'SYS01',
      });
      return `✅ 已创建元件定义「${input.elemName}」(${result?.elemCode || ''})`;
    }

    // ================================================================
    // queryElementDefs
    // ================================================================
    case 'queryElementDefs': {
      const data = await elementDefApi.queryBySystem(input.systemCode || 'SYS01');
      const defs = data?.defs || [];
      if (defs.length === 0) return '📋 当前系统暂无元件定义';
      const list = defs.map(d => `  • ${d.elem_code} — ${d.elem_name} [${d.control_type}]`).join('\n');
      return `📋 已有元件定义 (${defs.length}个):\n${list}`;
    }

    // ================================================================
    // createComponent
    // ================================================================
    case 'createComponent': {
      const saveResult = await elementGroupApi.save({
        groupName: input.groupName,
        groupCode: input.groupCode || '',
        groupDesc: input.groupDesc || '',
        groupType: input.groupType || 'form',
        groupTag: input.groupTag || '',
        systemCode: input.systemCode || 'SYS01',
      });

      const groupCode = saveResult?.groupCode || saveResult?.code || '';
      const elements = input.elements || [];
      const addedElems = [];

      // Add elements to the component if provided
      for (const el of elements) {
        try {
          await elementGroupApi.addItem({
            groupCode,
            elemCode: el.elemCode || el.code || el.elem_code || '',
            canvasCode: '',
            systemCode: input.systemCode || 'SYS01',
          });
          addedElems.push(el.elemName || el.name || el.elem_code || el.elemCode);
        } catch (e) {
          console.warn(`Failed to add element ${el.elemCode} to component:`, e);
        }
      }

      let msg = `✅ 已创建组件「${input.groupName}」(${groupCode})`;
      if (addedElems.length > 0) {
        msg += `，包含 ${addedElems.length} 个元件: ${addedElems.join(', ')}`;
      }
      return msg;
    }

    // ================================================================
    // queryComponents
    // ================================================================
    case 'queryComponents': {
      const data = await elementGroupApi.queryBySystem(input.systemCode || 'SYS01');
      const groups = data?.groups || [];
      if (groups.length === 0) return '📋 当前系统暂无组件';
      const list = groups.map(g => `  • ${g.c_group_code} — ${g.c_group_name} [${g.c_group_type}]`).join('\n');
      return `📋 已有组件 (${groups.length}个):\n${list}`;
    }

    // ================================================================
    // createPage
    // ================================================================
    case 'createPage': {
      const pageName = input.pageName || '未命名页面';
      const pageCode = input.pageCode || `page_${Date.now()}`;
      const columns = input.columns || 2;

      // Build a canvas JSON with proper structure
      const canvasJson = {
        c_canvas_name: pageName,
        c_canvas_code: pageCode,
        canvasType: input.pageType || 'form',
        columns,
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
        showOrder: 1,
        relJsFile: '',
        baseFlag: '0',
        systemCode: input.systemCode || 'SYS01',
        pageCode: pageCode,
        templateCode: '',
      });

      return `✅ 已创建页面「${pageName}」(${result?.canvasCode || pageCode})\n   页面代码: ${result?.canvasCode || pageCode}\n   类型: ${input.pageType || 'form'} | 列数: ${columns}`;
    }

    // ================================================================
    // addToCanvas (from CANVAS_TOOLS — handles in-designer additions)
    // ================================================================
    case 'addElement': {
      // This is only meaningful in the designer context — skip for page gen
      return `ℹ️ 已记录: 添加元素「${input.elemName || input.controlType}」`;
    }

    default:
      return `⚠️ 未知操作: ${name}`;
  }
}

/**
 * Fetch current state of all entities in a system (for context display).
 */
export async function fetchSystemState(systemCode) {
  const [defsRes, compsRes] = await Promise.all([
    elementDefApi.queryBySystem(systemCode).catch(() => ({ defs: [] })),
    elementGroupApi.queryBySystem(systemCode).catch(() => ({ groups: [] })),
  ]);

  return {
    defs: defsRes?.defs || [],
    components: compsRes?.groups || [],
  };
}
