/**
 * AI Assistant API — calls LLM with tool definitions for canvas operations.
 *
 * Default provider: DeepSeek (domestic, OpenAI-compatible, supports tool calling)
 * Also supports any OpenAI-compatible endpoint (Qwen, GLM, etc.)
 *
 * API key is stored in localStorage and configured via the AI panel settings (⚙ button).
 */

// ============================================================
// PROVIDER CONFIGURATIONS
// ============================================================
const PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
  openai: {
    name: 'OpenAI Compatible',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini'],
    defaultModel: 'gpt-4o-mini',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
  custom: {
    name: 'Custom',
    endpoint: '',
    models: [],
    defaultModel: '',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
};

// ============================================================
// RUNTIME CONFIG — persisted to localStorage
// ============================================================
function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem('ai_config') || 'null');
  } catch { return null; }
}

function saveConfig(cfg) {
  try { localStorage.setItem('ai_config', JSON.stringify(cfg)); } catch {}
}

const saved = loadConfig();
const AI_CONFIG = {
  provider: saved?.provider || 'deepseek',
  endpoint: saved?.endpoint || PROVIDERS.deepseek.endpoint,
  model: saved?.model || PROVIDERS.deepseek.defaultModel,
  apiKey: saved?.apiKey || '',
  thinking: saved?.thinking ?? false, // 思考模式：默认关闭
};

/** Update runtime config and persist */
export function setAiConfig(updates) {
  Object.assign(AI_CONFIG, updates);
  saveConfig({ provider: AI_CONFIG.provider, endpoint: AI_CONFIG.endpoint,
               model: AI_CONFIG.model, apiKey: AI_CONFIG.apiKey, thinking: AI_CONFIG.thinking });
}

/** Get current config for UI display */
export function getAiConfig() {
  const prov = PROVIDERS[AI_CONFIG.provider] || PROVIDERS.custom;
  return {
    provider: AI_CONFIG.provider,
    providerName: prov.name,
    endpoint: AI_CONFIG.endpoint,
    model: AI_CONFIG.model,
    apiKey: AI_CONFIG.apiKey ? '••••' + AI_CONFIG.apiKey.slice(-4) : '',
    availableModels: prov.models,
    thinking: AI_CONFIG.thinking,
  };
}

/** Get available providers list */
export function getProviders() {
  return Object.entries(PROVIDERS).map(([id, p]) => ({ id, name: p.name }));
}

/** Switch provider and reset defaults */
export function switchProvider(providerId) {
  const prov = PROVIDERS[providerId];
  if (!prov) return;
  AI_CONFIG.provider = providerId;
  AI_CONFIG.endpoint = prov.endpoint;
  AI_CONFIG.model = prov.defaultModel;
  saveConfig({ provider: AI_CONFIG.provider, endpoint: AI_CONFIG.endpoint,
               model: AI_CONFIG.model, apiKey: AI_CONFIG.apiKey, thinking: AI_CONFIG.thinking });
}

/**
 * 生成「思考模式」请求参数。DeepSeek 的 deepseek-chat（V3.1+）默认开启思考，
 * 通过 thinking:{type:'disabled'} 可关闭以加速响应；deepseek-reasoner 恒为思考模式，不传该参数。
 * 其它提供商不识别该字段，故仅对 DeepSeek 生效。
 */
function buildThinkingParam() {
  if (AI_CONFIG.provider !== 'deepseek') return null;
  if (AI_CONFIG.model === 'deepseek-reasoner') return null;
  return { type: AI_CONFIG.thinking ? 'enabled' : 'disabled' };
}

// ============================================================
// TOOL DEFINITIONS — OpenAI-compatible format
// ============================================================

/** Canvas-level tools (used in the Designer AI panel) */
const CANVAS_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'addElement',
      description: '向画布添加一个新元素。控件类型(controlType)对照：文本框=text, 数字框=number, 文本域=textarea, 下拉框=select, 日期时间=datePicker, 复选框=checkbox, 单选框=radio, 标签文字=label, 分割线=divider, 按钮=button。当用户指定要加到某个区块/组件/标签页时，用 targetContainerId 指向该容器（从画布状态 items 中找对应 _id）；若目标是标签页容器，还需用 targetTabId 指向具体标签。未指定目标容器时才默认加到画布底部。',
      parameters: {
        type: 'object',
        properties: {
          controlType: { type: 'string', enum: ['text','number','textarea','select','datePicker','checkbox','radio','label','divider','button'], description: '控件类型' },
          elemName: { type: 'string', description: '元素显示名称/标签' },
          elemCode: { type: 'string', description: '元素代码(可选)' },
          placeholder: { type: 'string', description: '占位提示文字(可选)' },
          required: { type: 'boolean', description: '是否为必填字段' },
          targetContainerId: { type: 'integer', description: '目标容器（区块/组件/标签页）的 _id。用户指定加到某个块/组件/tab 时必须传。未指定则加到画布底部。' },
          targetTabId: { type: 'integer', description: '当 targetContainerId 是标签页容器(itemType=tabGroup)时，目标标签页的 _id。' },
        },
        required: ['controlType', 'elemName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'removeElement',
      description: '从画布删除一个元素。',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'integer', description: '元素的 _id' },
        },
        required: ['elementId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateElement',
      description: '更新画布中某个元素的属性。只传要修改的字段。',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'integer', description: '元素的 _id' },
          elemName: { type: 'string', description: '新的元素名称' },
          elemCode: { type: 'string', description: '新的元素代码' },
          placeholder: { type: 'string', description: '新的占位提示' },
          required_flag: { type: 'string', enum: ['0','1'], description: '必填标志' },
          visible_flag: { type: 'string', enum: ['0','1'], description: '可见标志' },
          readonly_flag: { type: 'string', enum: ['0','1'], description: '只读标志' },
          control_type: { type: 'string', description: '控件类型' },
          rel_field_name: { type: 'string', description: '关联字段名' },
        },
        required: ['elementId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateCanvasMeta',
      description: '更新画布的元数据属性。',
      parameters: {
        type: 'object',
        properties: {
          canvasName: { type: 'string', description: '画布名称' },
          canvasType: { type: 'string', enum: ['form','table'], description: '画布类型: form=表单, table=表格' },
          columns: { type: 'integer', description: '表单列数(1-6)' },
          pageCode: { type: 'string', description: '页面代码' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addButton',
      description: '向画布添加一个操作按钮。',
      parameters: {
        type: 'object',
        properties: {
          buttonName: { type: 'string', description: '按钮显示文字' },
          buttonCode: { type: 'string', description: '按钮代码(可选)' },
          eventName: { type: 'string', description: '按钮事件名称(可选)' },
        },
        required: ['buttonName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addSection',
      description: '向画布添加一个区块(分组容器)。区块是用于把多个元件/组件按主题分组的容器，例如"被保人信息"区块、"投保人信息"区块。',
      parameters: {
        type: 'object',
        properties: {
          sectionName: { type: 'string', description: '区块标题，如"被保人信息"、"投保人信息"' },
        },
        required: ['sectionName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addComponent',
      description: '向画布添加一个组件(可复用布局单元)。',
      parameters: {
        type: 'object',
        properties: {
          componentName: { type: 'string', description: '组件名称' },
        },
        required: ['componentName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addTabGroup',
      description: '向画布添加一个标签页容器(多页签分组容器)。',
      parameters: {
        type: 'object',
        properties: {
          tabGroupName: { type: 'string', description: '标签页容器标题' },
        },
        required: ['tabGroupName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reorderBlock',
      description: '调整画布顶层功能块（区块/组件/表格/标签页）的顺序。position 含义：top=移到最上面，bottom=移到最下面，above=移到某块上面，below=移到某块下面。blockId 与 targetBlockId 都必须从画布状态里的 blocks 清单按名称查到其 _id，严禁编造。',
      parameters: {
        type: 'object',
        properties: {
          blockId: { type: 'integer', description: '要移动的功能块的 _id（从 blocks 清单按名称查）' },
          position: { type: 'string', enum: ['top', 'bottom', 'above', 'below'], description: '目标位置' },
          targetBlockId: { type: 'integer', description: '当 position 为 above/below 时，参考块的 _id' },
        },
        required: ['blockId', 'position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'saveCanvas',
      description: '保存当前画布到后端。用户要求"保存"、"保存画布"时调用。',
      parameters: {
        type: 'object',
        properties: {
          canvasName: { type: 'string', description: '可选：保存时覆盖画布名称' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'previewCanvas',
      description: '切换到画布预览视图。当用户说"预览/预览该画布/查看效果"时，必须调用此工具来实际打开预览页面，严禁仅用文字回复而不调用工具。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'publishCanvas',
      description: '发布当前画布（生成一个发布版本）。若画布尚未保存会先自动保存。',
      parameters: {
        type: 'object',
        properties: {
          versionName: { type: 'string', description: '版本名称，如 v1.0' },
          publishNote: { type: 'string', description: '变更说明' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'syncToProd',
      description: '将画布同步到产品工厂。用户说"同步到产品工厂/同步画布"时调用。默认同步当前画布（未保存会先自动保存）；也可传 canvasCode 同步指定画布。',
      parameters: {
        type: 'object',
        properties: {
          canvasCode: { type: 'string', description: '可选：指定要同步的画布代码；不传则同步当前画布' },
        },
      },
    },
  },

  // ── 元件管理 ──
  {
    type: 'function',
    function: {
      name: 'createElementDef',
      description: '在元件管理模块中创建一个元件定义（持久化到数据库，供组件/画布复用）。',
      parameters: {
        type: 'object',
        properties: {
          elemCode: { type: 'string', description: '元件代码(英文标识，留空自动生成)' },
          elemName: { type: 'string', description: '元件中文名称' },
          controlType: { type: 'string', enum: ['text','number','textarea','select','datePicker','checkbox','radio','switch','file','label','divider','button','search','hidden'], description: '控件类型' },
          fieldName: { type: 'string', description: '关联数据库字段名' },
          tableName: { type: 'string', description: '关联数据库表名' },
          placeholder: { type: 'string', description: '占位提示文字' },
          required: { type: 'boolean', description: '是否必填' },
          dataType: { type: 'string', description: '数据类型: varchar, int, date, datetime, decimal' },
          checkType: { type: 'string', description: '校验类型: none, email, phone, idCard, url, number' },
          defaultValue: { type: 'string', description: '默认值' },
        },
        required: ['elemName', 'controlType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'queryElementDefs',
      description: '查询当前系统下已有的元件定义列表。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteElementDef',
      description: '删除一个元件定义。',
      parameters: {
        type: 'object',
        properties: {
          elemCode: { type: 'string', description: '元件代码' },
        },
        required: ['elemCode'],
      },
    },
  },

  // ── 组件管理 ──
  {
    type: 'function',
    function: {
      name: 'createComponent',
      description: '在组件管理模块中创建一个可复用组件定义（持久化到数据库）。',
      parameters: {
        type: 'object',
        properties: {
          groupName: { type: 'string', description: '组件名称' },
          groupCode: { type: 'string', description: '组件代码(可选)' },
          groupDesc: { type: 'string', description: '组件描述' },
          groupType: { type: 'string', enum: ['form','table','search'], description: '组件类型' },
        },
        required: ['groupName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'queryComponents',
      description: '查询当前系统下已有的组件列表。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteComponent',
      description: '删除一个组件。',
      parameters: {
        type: 'object',
        properties: { groupCode: { type: 'string', description: '组件代码' } },
        required: ['groupCode'],
      },
    },
  },

  // ── 画布管理 ──
  {
    type: 'function',
    function: {
      name: 'createPage',
      description: '在画布管理模块中创建一个新的空白画布页面（持久化到数据库）。',
      parameters: {
        type: 'object',
        properties: {
          pageName: { type: 'string', description: '页面/画布名称' },
          pageCode: { type: 'string', description: '页面代码(英文标识)' },
          pageType: { type: 'string', enum: ['form','table'], description: '页面类型' },
          columns: { type: 'integer', description: '列数，默认2' },
        },
        required: ['pageName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'queryCanvases',
      description: '查询当前系统下已有的画布列表。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'loadCanvas',
      description: '按画布代码或名称，在当前系统中查找画布并加载到设计器（切换当前设计画布）。用户说"打开/加载某画布到设计器"时调用。可传完整代码，也可传展示名（如"01001-1-财险基本险-投保页"），系统会模糊匹配到实际画布。',
      parameters: {
        type: 'object',
        properties: {
          canvasCode: { type: 'string', description: '画布代码或名称/展示标签' },
        },
        required: ['canvasCode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteCanvas',
      description: '删除一个画布。',
      parameters: {
        type: 'object',
        properties: { canvasCode: { type: 'string', description: '画布代码' } },
        required: ['canvasCode'],
      },
    },
  },

  // ── 模板管理 ──
  {
    type: 'function',
    function: {
      name: 'createTemplate',
      description: '在模板管理模块中创建一个页面模板。',
      parameters: {
        type: 'object',
        properties: {
          templateName: { type: 'string', description: '模板名称' },
          templateCode: { type: 'string', description: '模板代码(可选)' },
          templateDesc: { type: 'string', description: '模板描述' },
          templateType: { type: 'string', enum: ['page','form','table'], description: '模板类型' },
        },
        required: ['templateName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'queryTemplates',
      description: '查询当前系统下已有的模板列表。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteTemplate',
      description: '删除一个模板。',
      parameters: {
        type: 'object',
        properties: { templateCode: { type: 'string', description: '模板代码' } },
        required: ['templateCode'],
      },
    },
  },

  // ── 系统管理 ──
  {
    type: 'function',
    function: {
      name: 'addSystem',
      description: '在系统管理模块中新增一个系统。',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: '系统代码(唯一标识)' },
          name: { type: 'string', description: '系统名称' },
          description: { type: 'string', description: '系统描述' },
        },
        required: ['code', 'name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateSystem',
      description: '更新一个系统的名称或描述。',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: '要更新的系统代码' },
          name: { type: 'string', description: '新名称' },
          description: { type: 'string', description: '新描述' },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteSystem',
      description: '删除一个系统。',
      parameters: {
        type: 'object',
        properties: { code: { type: 'string', description: '系统代码' } },
        required: ['code'],
      },
    },
  },
];

/** Page-generation tools (used in the AI Page Generator view) */
const PAGE_GEN_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'createElementDef',
      description: '创建一个元件定义。元件是最基本的表单控件，如文本框、下拉框、日期选择等。',
      parameters: {
        type: 'object',
        properties: {
          elemCode: { type: 'string', description: '元件代码(英文标识，留空自动生成)' },
          elemName: { type: 'string', description: '元件中文名称' },
          controlType: { type: 'string', enum: ['text','number','textarea','select','datePicker','checkbox','radio','switch','file','label','divider','button','search','hidden'], description: '控件类型' },
          fieldName: { type: 'string', description: '关联数据库字段名' },
          tableName: { type: 'string', description: '关联数据库表名' },
          placeholder: { type: 'string', description: '占位提示文字' },
          required: { type: 'boolean', description: '是否必填' },
          dataType: { type: 'string', description: '数据类型: varchar, int, date, datetime, decimal' },
          checkType: { type: 'string', description: '校验类型: none, email, phone, idCard, url, number' },
          defaultValue: { type: 'string', description: '默认值' },
          systemCode: { type: 'string', description: '系统代码，默认SYS01' },
        },
        required: ['elemName', 'controlType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'queryElementDefs',
      description: '查询当前系统下已有的元件定义列表，用于了解有哪些可用的元件。',
      parameters: {
        type: 'object',
        properties: {
          systemCode: { type: 'string', description: '系统代码' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createComponent',
      description: '创建一个组件。组件是将多个元件组合在一起的布局单元（如一个表单行、一个搜索栏）。',
      parameters: {
        type: 'object',
        properties: {
          groupName: { type: 'string', description: '组件名称' },
          groupType: { type: 'string', enum: ['form', 'table', 'search'], description: '组件类型' },
          groupDesc: { type: 'string', description: '组件描述' },
          columns: { type: 'integer', description: '组件列数，默认2' },
          elements: {
            type: 'array',
            description: '组件包含的元件数组',
            items: {
              type: 'object',
              properties: {
                elemCode: { type: 'string', description: '元件代码(引用已有的元件定义)' },
                elemName: { type: 'string', description: '元件名称' },
                controlType: { type: 'string', description: '控件类型' },
              },
            },
          },
          systemCode: { type: 'string', description: '系统代码' },
        },
        required: ['groupName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'queryComponents',
      description: '查询当前系统下已有的组件列表。',
      parameters: {
        type: 'object',
        properties: {
          systemCode: { type: 'string', description: '系统代码' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createPage',
      description: '创建一个完整的画布页面。页面由组件和元件组成，是最顶层的组织单元。',
      parameters: {
        type: 'object',
        properties: {
          pageName: { type: 'string', description: '页面/画布名称' },
          pageCode: { type: 'string', description: '页面代码(英文标识)' },
          pageType: { type: 'string', enum: ['form', 'table', 'dashboard', 'custom'], description: '页面类型' },
          columns: { type: 'integer', description: '页面列数，默认2' },
          systemCode: { type: 'string', description: '系统代码' },
          description: { type: 'string', description: '页面描述' },
        },
        required: ['pageName'],
      },
    },
  },
];

// ============================================================
// SYSTEM PROMPT
// ============================================================
function buildSystemPrompt(canvasState) {
  return `你是一个低代码画布设计助手，既能操作当前画布，也能管理系统的其它模块（元件、组件、画布、模板、系统）。

## 当前画布状态
\`\`\`json
${JSON.stringify(canvasState, null, 2)}
\`\`\`

## 当前系统
systemCode = ${canvasState.systemCode || 'SYS01'}。所有"元件管理/组件管理/画布管理/模板管理"的操作默认都作用于此系统。

## 能力范围（两类操作）
A. 当前画布操作（修改内存，不落库）：
   - addElement / updateElement / removeElement / updateCanvasMeta / addButton / addSection / addComponent / addTabGroup
   - 注意：addComponent / addSection 是向「当前画布」添加一个块，与「组件管理」里的 createComponent 是不同的两件事
B. 画布级动作（落库）：
   - saveCanvas（保存）、previewCanvas（预览）、publishCanvas（发布）、syncToProd（同步到产品工厂）
C. 其它模块操作（落库）：
   - 元件管理：createElementDef / queryElementDefs / deleteElementDef
   - 组件管理：createComponent / queryComponents / deleteComponent
   - 画布管理：createPage / queryCanvases / deleteCanvas
   - 模板管理：createTemplate / queryTemplates / deleteTemplate
   - 系统管理：addSystem / updateSystem / deleteSystem

## 规则
1. 理解用户的自然语言意图，调用合适的工具完成操作；一次请求可能需要多个工具（例如"保存并发布"= saveCanvas 后 publishCanvas）
2. 画布状态里 \`elements\` 数组列出了所有已存在元素（含 name、id、path、required）。elementId 必须从 \`elements\` 或 \`items\` 中的 \`_id\` 字段获取，严禁凭空编造 id
3. 当用户说"第一个"、"第2个"等序号时，按 items 数组的索引 0 开始数
4. 添加元素时，若用户指定了目标区块/组件/标签页，务必用 targetContainerId 指向该容器（区块/组件用其 _id；标签页容器还需 targetTabId 指向具体标签）。只有用户未指定目标位置时才加到画布底部
5. 画布状态中的 items 是层级结构：section 有 childItems，component 有 childItems 和 childElements，tabGroup 有 tabs（每个 tab 有 childItems）。要定位到某容器，先在 items 中找到它（可能在嵌套的 childItems/tabs 里），再用其 _id
6. **修改已存在元素（如"把某字段设为必填/非必填、改名、改占位符、改控件类型"）时，务必先按名称在 \`elements\` 清单中定位该元素拿到其 \`_id\`，然后调用 updateElement；严禁用 addElement 新建一个替代元素。** 若按名称找不到该元素，如实告知用户"未找到该字段"并列出相近字段，而不是编造或新建
7. 用户提到"保存/预览/发布/同步"等画布动作时，必须分别调用 saveCanvas / previewCanvas / publishCanvas / syncToProd 工具实际执行，严禁只回复文字说"已保存/已预览/已发布/已同步"而不调用工具；用户要求"打开/加载/切换到某个画布"时调用 loadCanvas
7a. 用户要求对画布功能块排序（如"把基本信息块移到最上面"、"把基本信息块移到 PML 块下面"）时，先从画布状态的 blocks 清单按名称查到相关块的 _id，再调用 reorderBlock（blockId=要移动的块，position=top/bottom/above/below，above/below 时还要 targetBlockId=参考块）。不要用 addElement 之类的新建操作替代排序
8. 用户提到"元件/组件/画布/模板/系统"的增删查时，调用对应的 C 类工具；若用户只说"创建元件/创建组件"等但信息不全，可先用 query* 查询现状，再补全参数创建
9. 执行完操作后，用中文简要回复做了什么
10. 如果用户的请求无法通过已有工具完成，请解释原因并建议替代方案`;
}

// ============================================================
// API CALL
// ============================================================

/**
 * Send a message to the LLM and get tool calls back.
 * @param {Array} history
 * @param {object} canvasState
 * @param {object} [options] { toolChoice?: 'auto'|'required' }
 */
export async function sendAiMessage(history, canvasState, options = {}) {
  if (!AI_CONFIG.apiKey) {
    throw new Error('AI API key 未配置。请点击 ⚙ 按钮设置');
  }
  if (!AI_CONFIG.endpoint) {
    throw new Error('AI endpoint 未配置。请点击 ⚙ 按钮设置');
  }

  const systemPrompt = buildSystemPrompt(canvasState);

  // Build messages in OpenAI format (system as a message role)
  const messages = [
    { role: 'system', content: systemPrompt },
  ];
  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }

  const body = {
    model: AI_CONFIG.model,
    max_tokens: 4096,
    temperature: 0.1,
    messages,
    tools: CANVAS_TOOLS,
    tool_choice: options.toolChoice || 'auto',
  };
  const thinking = buildThinkingParam();
  if (thinking) body.thinking = thinking;

  console.log('[AI API] Provider:', AI_CONFIG.provider);
  console.log('[AI API] Endpoint:', AI_CONFIG.endpoint);
  console.log('[AI API] Model:', AI_CONFIG.model);

  // Use backend relay to avoid CORS
  const res = await fetch('/canvas-service/ai/relay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ai-Api-Key': AI_CONFIG.apiKey,
      'X-Ai-Endpoint': AI_CONFIG.endpoint,
      'X-Ai-Model': AI_CONFIG.model,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errText;
    } catch {}
    throw new Error(`${res.status}: ${errMsg}`);
  }

  const data = await res.json();

  // Parse OpenAI-format response
  const choice = data.choices?.[0];
  const msg = choice?.message || {};
  const text = msg.content || '';

  // Extract tool calls (OpenAI format)
  const toolCalls = [];
  for (const tc of msg.tool_calls || []) {
    if (tc.type === 'function') {
      let input = {};
      try { input = JSON.parse(tc.function.arguments); } catch {}
      toolCalls.push({ id: tc.id, name: tc.function.name, input });
    }
  }

  return { text, toolCalls };
}

// ============================================================
// PAGE GENERATION AI
// ============================================================

/**
 * System prompt for the page generation AI.
 * This teaches the LLM about the low-code domain model.
 */
function buildPageGenSystemPrompt(systemCode, existingDefs, existingComponents) {
  return `你是一个低代码平台助手，帮助用户通过自然语言生成完整的页面。

## 领域模型（两层结构）

低代码平台采用两层抽象结构：

1. **元件 (Element)** — 最基础的原子级表单控件：文本框、下拉框、日期选择、复选框、按钮等。元件通过 element_def 管理，存储在 tb_canvas_element 表中（c_canvas_code 为 NULL 的记录即为元件定义）。

2. **组件 (Component)** — 由多个元件组合而成的可复用布局单元。例如：一个"搜索表单"组件包含"用户名"和"状态"两个元件。组件通过 element_group 管理，存储在 tb_element_group + tb_element_group_item 表中。

3. **页面 (Page/Canvas)** — 完整的功能页面，由组件和元件按顺序排列组成。页面通过 canvas 管理，存储在 tb_canvas 表中。

## 页面生成策略

当用户描述一个页面需求时，按以下步骤执行：

1. **分析需求** — 识别用户需要的功能区域（搜索、表格、表单等）
2. **创建元件定义** — 先用 queryElementDefs 查看是否已有合适的元件定义；没有则用 createElementDef 创建
3. **创建组件** — 用 createComponent 将元件组合成可复用的组件布局
4. **创建页面** — 用 createPage 创建最终的画布页面

## 当前上下文
- 系统代码 (systemCode): ${systemCode}
- 已有元件定义: ${JSON.stringify(existingDefs.map(d => ({ code: d.elem_code, name: d.elem_name, type: d.control_type })))}
- 已有组件: ${JSON.stringify(existingComponents.map(c => ({ code: c.c_group_code, name: c.c_group_name, type: c.c_group_type })))}

## 命名规范
- 元件代码 (elemCode): 英文驼峰，如 userName, custStatus, phoneNumber
- 页面代码 (pageCode): 英文驼峰+Page后缀，如 userManagePage
- 元件定义存储在 systemCode 指定的系统下

## 规则
1. 优先复用已有的元件定义和组件，避免重复创建
2. 创建页面时，按照用户体验合理排列组件顺序（搜索在上，表格在下，表单在侧边或弹窗中）
3. 执行完操作后，用中文总结创建了什么
4. 为每个页面适配合适的 columns（搜索区域通常1-3列，表格通常1列）
5. 创建组件时，合理设置列数（搜索表单通常3-4列，详情表单通常2列）`;
}

/**
 * Send a page generation message to the LLM.
 * Returns parsed tool calls for the page generator to execute.
 */
export async function sendPageGenMessage(userMessage, systemCode) {
  if (!AI_CONFIG.apiKey) {
    throw new Error('AI API key 未配置。请点击 ⚙ 按钮设置');
  }
  if (!AI_CONFIG.endpoint) {
    throw new Error('AI endpoint 未配置。请点击 ⚙ 按钮设置');
  }

  // Fetch existing data for context
  let existingDefs = [], existingComponents = [];
  try {
    const [defsRes, compsRes] = await Promise.all([
      fetch('/canvas-service/element_def/query_by_system', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemCode }),
      }).then(r => r.json()).catch(() => ({ defs: [] })),
      fetch('/canvas-service/element_group/query_by_system', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemCode }),
      }).then(r => r.json()).catch(() => ({ groups: [] })),
    ]);
    existingDefs = defsRes?.defs || [];
    existingComponents = compsRes?.groups || [];
  } catch (e) {
    console.warn('[PageGen] Failed to fetch existing data:', e);
  }

  const systemPrompt = buildPageGenSystemPrompt(systemCode, existingDefs, existingComponents);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const body = {
    model: AI_CONFIG.model,
    max_tokens: 4096,
    temperature: 0.3,
    messages,
    tools: PAGE_GEN_TOOLS,
    tool_choice: 'auto',
  };
  const thinking = buildThinkingParam();
  if (thinking) body.thinking = thinking;

  console.log('[PageGen AI] Generating page for system:', systemCode);

  const res = await fetch('/canvas-service/ai/relay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ai-Api-Key': AI_CONFIG.apiKey,
      'X-Ai-Endpoint': AI_CONFIG.endpoint,
      'X-Ai-Model': AI_CONFIG.model,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errText;
    } catch {}
    throw new Error(`${res.status}: ${errMsg}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const msg = choice?.message || {};
  const text = msg.content || '';

  const toolCalls = [];
  for (const tc of msg.tool_calls || []) {
    if (tc.type === 'function') {
      let input = {};
      try { input = JSON.parse(tc.function.arguments); } catch {}
      toolCalls.push({ id: tc.id, name: tc.function.name, input });
    }
  }

  return { text, toolCalls };
}
