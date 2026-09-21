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
    // deepseek-chat / deepseek-reasoner 已于 2026-07-24 下线，
    // 再用这两个名字请求会直接报 400/404。现在只有 v4-flash / v4-pro。
    models: ['deepseek-v4-flash', 'deepseek-v4-pro'],
    defaultModel: 'deepseek-v4-flash',
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

/**
 * 已下线的模型名 → 现在可用的名字。
 *
 * 配置存在 localStorage 里，老用户的浏览器里还留着 deepseek-chat。
 * 不迁移的话他们升级后会一直用一个必然报错的模型，
 * 而且界面上看不出问题出在哪（下拉框里那个值看着挺正常）。
 */
const RETIRED_MODELS = {
  'deepseek-chat': 'deepseek-v4-flash',
  'deepseek-reasoner': 'deepseek-v4-flash',
};

function migrateModel(name) {
  if (!name) return name;
  return RETIRED_MODELS[name] || name;
}

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
  model: migrateModel(saved?.model) || PROVIDERS.deepseek.defaultModel,
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
 * 生成「思考模式」请求参数。
 *
 * V4 把「选模型」和「是否思考」拆开了：v4-flash / v4-pro 都同时支持两种模式，
 * 由 thinking 字段控制。旧版的 deepseek-reasoner 恒为思考模式，那个特例
 * 随着模型下线已经没有意义。
 *
 * 其它提供商不识别该字段，故仅对 DeepSeek 生效。
 */
function buildThinkingParam() {
  if (AI_CONFIG.provider !== 'deepseek') return null;
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
      name: 'update_plan',
      description:
        '声明或更新当前任务的执行计划。任务需要多步（大约 3 步以上）才能完成时，'
        + '先规划再动手；每完成一步就再调用一次，把 done 往前推。'
        + '单步任务不需要用它。',
      parameters: {
        type: 'object',
        properties: {
          goal: { type: 'string', description: '这次任务要达成的一句话目标' },
          steps: {
            type: 'array',
            items: { type: 'string' },
            description: '有序的步骤清单，每条是一句能判断完成与否的话',
          },
          done: {
            type: 'integer',
            description: '已完成的步骤数，即 steps 里前几条已完成。刚开始规划时填 0',
          },
        },
        required: ['goal', 'steps'],
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
/**
 * 量一下画布状态各部分占多少字符。
 *
 * 为什么要单独量：整个 canvasState 会被 stringify 进 system prompt，
 * 而且每轮 LLM 调用都重发一次。之前只知道总量很大（trace 里看得到
 * input_tokens 约 28 万），但不知道是哪一段占的——items 是全量、
 * 其余几个是摘要，不量就没法判断该动哪里。
 *
 * 注意：这个值只反映字符数，不等同于 token（中英混排差异大），
 * 但用来比较各部分之间的相对大小足够了。
 */
export function measureCanvasState(canvasState) {
  // 空段算 0 而不是 4——JSON.stringify(null) 是 "null"（4 字符），
  // 如果照算，一个没有 buttons 的画布会显示"buttons 占 20%"这种假数据
  const size = (v) => {
    if (v == null) return 0;
    try { return JSON.stringify(v).length; } catch { return 0; }
  };
  const parts = {
    containers: size(canvasState?.containers),
    elements: size(canvasState?.elements),
    blocks: size(canvasState?.blocks),
    items: size(canvasState?.items),
    buttons: size(canvasState?.buttons),
  };
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  return { parts, total, ratio: total ? Object.fromEntries(
    Object.entries(parts).map(([k, v]) => [k, +(v / total * 100).toFixed(1)])
  ) : {} };
}

export function buildSystemPrompt(canvasState) {
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
10. 如果用户的请求无法通过已有工具完成，请解释原因并建议替代方案
11. **任务需要多步（大约 3 步以上）才能完成时，先用 update_plan 列出步骤再动手**，每完成一步更新一次 done。单步任务（如"把某字段设为必填"）不需要规划。
    这不只是给别人看的：你的迭代次数有限，万一没做完，计划会留在对话里，用户说"继续"时你能知道还剩什么。所以宁可把步骤拆细一点。
12. 如果这次确实没做完，在回复里说清楚：完成了哪几步、卡在哪一步、下一步该做什么`;
}

/**
 * 把当前计划拼成一段提示词，附在系统提示词后面。
 *
 * 计划要注入（而聊天历史本来就带着）是因为：下一轮对话的历史里只有
 * 助手回复的文本，没有工具调用的细节。用户说"继续"时，模型只能靠
 * 这段计划知道还剩什么没做。
 */
export function formatPlanForPrompt(plan) {
  if (!plan || !Array.isArray(plan.steps) || !plan.steps.length) return '';
  const done = Math.max(0, Math.min(plan.done || 0, plan.steps.length));
  if (done >= plan.steps.length) return '';   // 已完成的计划不必再提
  const lines = plan.steps.map((s, i) => `- [${i < done ? 'x' : ' '}] ${s}`);
  return `\n\n## 上一次未完成的计划\n目标：${plan.goal}\n${lines.join('\n')}\n`
    + `用户如果要求继续，请从上面第一个未打勾的步骤接着做，并继续用 update_plan 更新进度。\n`
    + `如果当前请求和这个计划无关，直接忽略它，并用 update_plan 覆盖成新任务的计划。`;
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
// ============================================================
// LLM 调用的重试
//
// 以前一次失败就整个请求报错，用户白等——而网络抖动、限流、网关 5xx
// 都是"等一下就好"的类型。这里做指数退避重试。
//
// 三个要点：
//   1. 错误分类。分错的代价不对称：把永久错误当可重试只是浪费时间，
//      把临时错误当永久错误会让用户直接看到报错。
//   2. 请求超时。没有超时的话，卡住的请求会一直挂着，
//      重试根本没机会发生——重试救不了"永不返回"。
//   3. 重试要可见。看不见的重试等于没有：你不知道失败率有多高，
//      也不知道用户其实等了三次才成功。
// ============================================================

const MAX_LLM_ATTEMPTS = 3;        // 含首次，即最多重试 2 次
const RETRY_BASE_DELAY_MS = 800;
const RETRY_MAX_DELAY_MS = 5000;
// 单次请求超时。画布类的 prompt 很大（可达百万字符），给得宽松些，
// 但必须有个上限——否则网络挂起时请求永远不返回。
const LLM_REQUEST_TIMEOUT_MS = 90000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 区分「等一下就好」和「再试也没用」。 */
function isRetryable(err) {
  if (err && typeof err.status === 'number') {
    return err.status === 429 || err.status >= 500;
  }
  // fetch 在网络层失败时抛 TypeError；超时由我们自己的 AbortController 触发
  return err instanceof TypeError || (err && err.name === 'AbortError');
}

/** 服务端给了 Retry-After 就听它的，别自己拍脑袋退避。 */
function retryAfterMs(err) {
  const s = err && err.retryAfter;
  if (typeof s === 'number' && s > 0) return Math.min(s * 1000, RETRY_MAX_DELAY_MS);
  return null;
}

/**
 * 带重试的 relay 请求。
 * @param {object} body      请求体
 * @param {Function} [onRetry] (info) => void，每次「将要重试」时调用
 */
async function relayWithRetry(body, onRetry) {
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt++) {
    try {
      return await relayOnce(body);
    } catch (e) {
      lastErr = e;
      const retryable = isRetryable(e);
      const lastTry = attempt >= MAX_LLM_ATTEMPTS;
      if (!retryable || lastTry) {
        if (onRetry) {
          onRetry({ attempt, error: e, retryable, willRetry: false });
        }
        break;
      }
      const delayMs =
        retryAfterMs(e) ?? Math.min(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), RETRY_MAX_DELAY_MS);
      if (onRetry) {
        onRetry({ attempt, error: e, retryable, willRetry: true, delayMs });
      }
      await sleep(delayMs);
    }
  }
  throw lastErr;
}

/** 单次 relay 请求。失败时抛出的 Error 带 status / retryAfter，供上层分类。 */
async function relayOnce(body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LLM_REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch('/canvas-service/ai/relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ai-Api-Key': AI_CONFIG.apiKey,
        'X-Ai-Endpoint': AI_CONFIG.endpoint,
        'X-Ai-Model': AI_CONFIG.model,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    // 超时被 abort 时，把它换成一个说得清楚的错误
    if (e && e.name === 'AbortError') {
      const t = new Error(`请求超时（${LLM_REQUEST_TIMEOUT_MS / 1000}s）`);
      t.name = 'AbortError';
      throw t;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errText;
    } catch { /* 非 JSON 错误体，直接用原文 */ }
    const e = new Error(`${res.status}: ${errMsg}`);
    e.status = res.status;                       // 供 isRetryable 分类
    const ra = res.headers.get('Retry-After');
    if (ra && !Number.isNaN(Number(ra))) e.retryAfter = Number(ra);
    throw e;
  }
  return res;
}

/**
 * 单次 LLM 调用原语（多轮循环的底层）。
 * 返回完整信息，其中 rawMessage 保留 tool_calls 结构，供多轮回填。
 * 内部带指数退避重试；onRetry 用于把重试上报出去。
 */
export async function chatCompletion(messages, { toolChoice = 'auto', onRetry } = {}) {
  if (!AI_CONFIG.apiKey) {
    throw new Error('AI API key 未配置。请点击 ⚙ 按钮设置');
  }
  if (!AI_CONFIG.endpoint) {
    throw new Error('AI endpoint 未配置。请点击 ⚙ 按钮设置');
  }

  const body = {
    model: AI_CONFIG.model,
    max_tokens: 4096,
    temperature: 0.1,
    messages,
    tools: CANVAS_TOOLS,
    tool_choice: toolChoice,
  };
  const thinking = buildThinkingParam();
  if (thinking) body.thinking = thinking;

  console.log('[AI API] Provider:', AI_CONFIG.provider);
  console.log('[AI API] Endpoint:', AI_CONFIG.endpoint);
  console.log('[AI API] Model:', AI_CONFIG.model);

  // Use backend relay to avoid CORS
  const res = await relayWithRetry(body, onRetry);

  const data = await res.json();

  // Parse OpenAI-format response
  const choice = data.choices?.[0];
  const rawMessage = choice?.message || {};
  const text = rawMessage.content || '';

  // Extract tool calls (OpenAI format)
  const toolCalls = [];
  for (const tc of rawMessage.tool_calls || []) {
    if (tc.type === 'function') {
      let input = {};
      try { input = JSON.parse(tc.function.arguments); } catch {}
      toolCalls.push({ id: tc.id, name: tc.function.name, input });
    }
  }

  return {
    text,
    toolCalls,
    rawMessage,
    finishReason: choice?.finish_reason,
    usage: {
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
    },
  };
}

/**
 * 兼容旧接口的单次调用封装：返回 { text, toolCalls }。
 * （保留给可能的历史调用方；新逻辑请用 runAgentLoop。）
 */
export async function sendAiMessage(history, canvasState, options = {}) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(canvasState) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];
  const r = await chatCompletion(messages, { toolChoice: options.toolChoice || 'auto' });
  return { text: r.text, toolCalls: r.toolCalls };
}

/**
 * 多轮 tool-use 循环：LLM 返回工具调用 → 本地执行 → 结果喂回 → 直到不再调工具。
 *
 * @param {Array} history         aiStore 里的 [{role, content}]（纯文本，不含 tool 消息）
 * @param {Function} getContext   () => canvasState，每次迭代现取，避免画布状态陈旧
 * @param {Function} buildSystem  (canvasState) => systemPrompt
 * @param {string} toolChoice     'required' | 'auto'，仅首轮生效
 * @param {Function} executeTools async (toolCalls) => string[]（对齐索引）
 * @param {Function} onEvent      (ev) => eventId|null，埋点钩子
 * @param {number} maxIterations  硬上限，防死循环
 */
export async function runAgentLoop({
  history,
  getContext,
  buildSystem = buildSystemPrompt,
  toolChoice = 'auto',
  executeTools,
  onEvent,
  maxIterations = 8,
}) {
  const messages = [
    { role: 'system', content: buildSystem(getContext()) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  let finalText = '';
  let toolResults = [];
  let iterations = 0;
  let timedOut = false;
  let inTok = 0;
  let outTok = 0;
  // 怎么结束的。与看板的 ended_by 同义（见 AI_project/app/tracer.py）：
  //   text_response  模型不再请求工具，给出了文本
  //   iteration_cap  跑满 maxIterations 仍未收尾
  //   empty_output   既没调工具也没给内容
  // 「模型不再调工具」只是循环的退出条件，不等于任务完成——
  // 模型卡住、放弃、被上限截断都长这个样子。
  let endedBy = null;

  for (let iter = 1; iter <= maxIterations; iter++) {
    iterations = iter;
    // 每轮刷新画布上下文（工具执行后画布已变化）
    messages[0].content = buildSystem(getContext());

    const t0 = performance.now();
    const r = await chatCompletion(messages, {
      toolChoice: iter === 1 ? toolChoice : 'auto',
      // 把重试上报到看板。事件名与 Python 侧（app/agent.py 的 llm_retry）一致，
      // 看板已有的渲染逻辑直接复用。
      onRetry: onEvent
        ? ({ attempt, error, willRetry, delayMs, retryable }) => {
            if (!willRetry) return;   // 放弃重试时让错误照常抛出，由上层统一处理
            onEvent({
              type: 'llm_retry',
              name: `llm_retry #${attempt}: ${error.name || 'Error'}`,
              output: { error: String(error.message || error).slice(0, 500) },
              meta: { attempt, delay_ms: delayMs, retryable, source: 'canvas' },
            });
            onEvent({
              type: 'log',
              name: `${error.message || error}，${Math.round(delayMs / 1000)}s 后第 ${attempt + 1} 次尝试`,
              meta: { level: 'warn' },
            });
          }
        : undefined,
    });
    const latencyMs = Math.round(performance.now() - t0);
    inTok += r.usage.input_tokens;
    outTok += r.usage.output_tokens;

    const llmCallId = onEvent
      ? onEvent({
          type: 'llm_call',
          name: `llm_call #${iter}`,
          input: messages,
          meta: {
            model: AI_CONFIG.model,
            iteration: iter,
            tool_choice: iter === 1 ? toolChoice : 'auto',
          },
        })
      : null;

    // 追加 assistant 消息（保留 tool_calls 结构，content 为 null 时省略）
    const assistantMsg = { role: 'assistant' };
    if (r.rawMessage.content != null) assistantMsg.content = r.rawMessage.content;
    if (r.toolCalls.length) assistantMsg.tool_calls = r.rawMessage.tool_calls;
    // 思考模式下发生过工具调用，后续请求必须完整回传 reasoning_content，
    // 否则 API 直接返回 400。这个字段不在 OpenAI 标准里，容易被漏掉——
    // 而且只在「开着思考 + 用工具」这个组合下才暴露，平时看不出来。
    if (r.rawMessage.reasoning_content != null) {
      assistantMsg.reasoning_content = r.rawMessage.reasoning_content;
    }
    messages.push(assistantMsg);

    if (onEvent) {
      onEvent({
        type: 'llm_response',
        name: `llm_response #${iter}`,
        parentId: llmCallId,
        output: { content: r.text, tool_calls: r.toolCalls },
        meta: {
          input_tokens: r.usage.input_tokens,
          output_tokens: r.usage.output_tokens,
          latency_ms: latencyMs,
          finish_reason: r.finishReason,
        },
      });
    }

    // 终止条件：模型不再请求工具
    if (r.toolCalls.length === 0) {
      finalText = r.text;
      endedBy = finalText && finalText.trim() ? 'text_response' : 'empty_output';
      break;
    }

    // 埋点 tool_call（父=llm_call）→ 执行 → 埋点 tool_result（父=tool_call）→ 回喂
    const callEvIds = r.toolCalls.map((tc) =>
      onEvent
        ? onEvent({
            type: 'tool_call',
            name: `tool_call: ${tc.name}`,
            parentId: llmCallId,
            input: tc.input,
            meta: { tool_call_id: tc.id },
          })
        : null,
    );

    const results = await executeTools(r.toolCalls);

    r.toolCalls.forEach((tc, i) => {
      if (onEvent) {
        onEvent({
          type: 'tool_result',
          name: `tool_result: ${tc.name}`,
          parentId: callEvIds[i],
          output: results[i],
        });
      }
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: typeof results[i] === 'string' ? results[i] : JSON.stringify(results[i]),
      });
    });

    toolResults = toolResults.concat(results);
  }

  // 循环自然跑完（没 break）＝ 跑满上限仍未收尾。
  // endedBy 仍是 null 就是这种情况——不要把它当成正常结束。
  if (!endedBy) {
    endedBy = 'iteration_cap';
    timedOut = true;
  }
  if (endedBy === 'iteration_cap' && onEvent) {
    onEvent({
      type: 'log',
      name: `达到最大迭代次数 ${maxIterations} 仍未完成，已强制终止`,
      meta: { level: 'warn' },
    });
  }

  return {
    text: finalText,
    toolResults,
    iterations,
    timedOut,
    endedBy,          // 调用方据此决定怎么向用户交代
    inputTokens: inTok,
    outputTokens: outTok,
  };
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
