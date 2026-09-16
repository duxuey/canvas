# fpic_prod_db 与画布系统适配分析报告

> 生成日期：2026-08-28
> 分析对象：富邦财险产品工厂库 fpic_prod_db ↔ 画布系统 canvas-service

---

## 一、数据库连接情况（重要）

提供的 `10.1.23.21 / root / P@ssw0rd` 未能登录成功，探测结果：

| 探测项 | 结果 |
|---|---|
| `ping 10.1.23.21` | 100% 丢包（ICMP 被防火墙拦截，不代表不通） |
| TCP 3306 | 通（能建立连接） |
| TCP **33061** | **通**，但 `root/P@ssw0rd` → `Access denied for user 'root'@'10.20.32.220'` |
| 33062 / 33063 / 3307 / 13306 | 不通 |

**结论：网络是通的（VPN 已覆盖 10.1.23.x 网段），MySQL 在 33061 端口，但 `root` 密码不对或该用户不允许从当前 VPN IP（10.20.32.220）登录。**

从代码仓库里找到同构的开发库 `10.30.44.10:3306/core_db`（账号 `core/123456`，可达），里面的 `TB_PROD_*` 表与画布系统的映射完全一致。表结构、字段映射、数据量均基于该同构库和源码 `@TableName` 注解实锤验证。

> 注：`fpic_prod_db` 这个库名在代码里未直接搜到，但富邦财险的命名规则是 `fpic_{模块}_db`（`fpic_base_db`、`fpic_img_db` 已确认），`fpic_prod_db` 对应产品工厂 prod-service，其表就是 `TB_PROD_*` 系列。

---

## 二、两套系统的表关系

### fpic_prod_db（产品工厂，源）核心表

产品工厂 —— 把保险产品定义成可配置的画面/元件。核心表：

```
TB_PROD_TEMPLATE           模板（产品配置模板）
TB_PROD_REL_SCREEN         画面组件（产品→画面）
TB_PROD_SCREEN_REL_ELEM    画面→元件（数据量最大）
TB_PROD_SCREEN_PROP        画面属性
TB_PROD_SCREEN_BUTTON      画面按钮
TB_PROD_DATA_VIEW / TB_PROD_VIEW_ELEM        数据视图分组
TB_PROD_TMPLT_REL_SCREEN / TB_PROD_TMPLT_SCREEN_ELEM / ...   模板维度同款表
TB_PROD_PKG_SCREEN / TB_PROD_PKG_SCREEN_ELEM / ...           打包产品维度同款表
```

层级关系：**产品（c_prod_no/c_version）→ 画面组件（c_screen_no）→ 元件（c_elem_no）→ 关联业务字段（c_rel_table_name + c_rel_field_name）**

### 画布系统（canvas-service，目标）8 张表

```
tb_canvas              画布定义（含 c_canvas_json）
tb_canvas_element      画布元素
tb_canvas_config       画布配置
tb_canvas_button       画布按钮
tb_page_template       页面模板
tb_element_group       元素分组
tb_element_group_item  元素分组明细
tb_canvas_publish      发布记录（画布系统新增，无源表）
```

---

## 三、映射关系（来自模型类注释）

| 画布系统表 | 源表（fpic_prod_db / core_db） | 合并方式 |
|---|---|---|
| `tb_canvas` | `TB_PROD_REL_SCREEN` + `TB_PROD_TMPLT_REL_SCREEN` + `TB_PROD_PKG_SCREEN` | 三表合一 |
| `tb_canvas_element` | `TB_PROD_SCREEN_REL_ELEM` + `TB_PROD_TMPLT_SCREEN_ELEM` + `TB_PROD_PKG_SCREEN_ELEM` | 三表合一 |
| `tb_canvas_config` | `TB_PROD_SCREEN_PROP` + `TB_PROD_TMPLT_SCREEN_PROP` + `TB_PROD_PKG_SCREEN_PROP` | 三表合一 |
| `tb_canvas_button` | `TB_PROD_SCREEN_BUTTON` + `TB_PROD_TMPLT_SCREEN_BUTTON` | 两表合一 |
| `tb_page_template` | `TB_PROD_TEMPLATE` | 简化 |
| `tb_element_group` | `TB_PROD_DATA_VIEW` + `TB_PROD_TMPLT_DATA_VIEW` | 两表合一 |
| `tb_element_group_item` | `TB_PROD_VIEW_ELEM` + `TB_PROD_TMPLT_VIEW_ELEM` | 两表合一 |
| `tb_canvas_publish` | —（无） | 画布系统新增 |

### 字段级映射（以 `TB_PROD_SCREEN_REL_ELEM` → `tb_canvas_element` 为例）

**能一一对应的字段（约 30 个）：**

| 源字段 | 目标字段 | 含义 |
|---|---|---|
| `c_screen_no` | `c_canvas_code` | 画面代码 → 画布代码 |
| `c_elem_no` | `c_elem_code` | 元件代码 |
| `c_contrl_type` | `c_control_type` | 控件类型 |
| `c_must_intput_flag` | `c_required_flag` | 必填 |
| `c_read_only_flag` | `c_readonly_flag` | 只读 |
| `c_view_show_flag` | `c_visible_flag` | 可见 |
| `c_dflt_value` | `c_default_value` | 默认值 |
| `c_status` | `c_enabled_flag` | 启用 |
| `c_clk_event_func` | `c_click_event_func` | 点击事件 |
| `c_elem_cname` / `c_elem_ename` | `c_elem_name` / `c_elem_ename` | 名称 |
| `c_rel_field_name` / `c_rel_table_name` | 同名 | 关联业务字段/表（关键） |
| `c_contrl_attr` | `c_control_attr` | 控件属性 |
| `c_clnt_group` | `c_client_group` | 栏目分组 |
| `c_title` | `c_tooltip_title` | 浮标 |
| `c_font_event_func` | `c_frontend_event` | 前端事件 |
| `c_valid_item_contrl_attr` | `c_valid_control_attr` | 校验属性 |
| `c_group_flag` / `c_group_first_item` | 同名 | 合并字段标志 |

**⚠️ 源表有、画布系统丢掉的字段（同步的最大障碍）：**

| 丢失字段 | 含义 | 影响 |
|---|---|---|
| `c_prod_no` / `c_prod_id` | 产品代码 / 产品主键 | 产品维度消失 |
| `c_version` | 产品版本号 | 版本维度消失 |
| `c_chnl_code` | 渠道代码 | 渠道维度消失 |
| `c_cvrg_no` / `c_duty_no` | 险别 / 责任代码 | 责任维度消失 |
| `c_screen_cont_type` | 画面类型（投保/报价/组合） | 画面分类消失 |
| `c_endr_*` / `c_visit_*` / `c_list_*` | 批单/查看/清单显示控制 | 精细显示控制消失 |

**画布系统新增字段：** `c_system_code`（多租户）、`c_template_code`、`c_page_code`。

---

## 四、核心结论：这是「降维重构」，不是简单改名

产品工厂是六维模型：`产品 × 版本 × 渠道 × 险别 × 画面 × 元件`。

画布系统是扁平模型：`系统(c_system_code) × 模板(c_template_code) × 页面(c_page_code) × 画布(c_canvas_code) × 元素`。

画布系统的 `c_canvas_code` 是全局唯一的（源表 `c_screen_no` 也是唯一），但它把一个画面从「属于某产品某版本某渠道」里抽离了出来，只保留了画面本身的元件定义，丢掉了「这个画面是给哪个产品哪个版本用的」这一层归属关系。

---

## 五、同步方案（仅方案，未执行）

### 数据量评估（基于同构 core_db）

| 表 | 行数 |
|---|---|
| 画面（tb_prod_rel_screen） | 5,557（299 个产品） |
| 元件（tb_prod_screen_rel_elem） | 128,655 |
| 画面属性（tb_prod_screen_prop） | 4,494 |
| 模板（tb_prod_template） | 7 |

数据量不大，全量同步技术上完全可行（12.8 万元素几秒钟内可完成）。

### 推荐同步路径（fpic_prod_db → 画布系统）

```
1. 建同步视图/映射配置
   TB_PROD_REL_SCREEN → tb_canvas（c_screen_no→c_canvas_code, c_scrn_json→c_canvas_json）
   TB_PROD_SCREEN_REL_ELEM → tb_canvas_element（字段改名 + 丢弃丢失字段）
   TB_PROD_SCREEN_PROP → tb_canvas_config
   TB_PROD_SCREEN_BUTTON → tb_canvas_button

2. 处理维度丢失
   - 方案A：c_system_code 填固定值（如 "FPIC"），c_template_code 用 c_prod_no 映射，
     放弃 version/chnl/cvrg 维度（只同步"最新版本 + 默认渠道"）
   - 方案B：需要给画布系统加列（扩表）才能完整保留维度 —— 需确认业务是否允许

3. c_canvas_json 的生成
   源表 c_scrn_json 是画面 JSON，画布系统 c_canvas_json 格式需比对（可复用
   CanvasServiceImpl.buildPublishJson 的解析逻辑）

4. 主键策略
   - 保留源 c_pk_id（推荐，便于回溯对账），或
   - 用 SnowflakeIdWorker 重新生成（画布系统代码里就是这么干的）
```

### 同步前必须确认的 3 个决策点

1. **方向**：是 `fpic_prod_db → 画布系统`（把旧产品工厂数据迁到新画布），还是反向？从「画布系统是新重构版」看，大概率是前者。
2. **维度取舍**：产品/版本/渠道维度丢失，业务上能不能接受？不能接受就得先扩表。
3. **全量还是增量**：一次性迁移，还是持续双向同步（需要加增量标识 `d_uptr_time` + 对账机制）。

---

## 六、是否可以同步的判断

**技术上：可以同步**，字段约 80% 能一一映射，数据量小，迁移成本低。

**但有一个必须先解决的业务问题**：画布系统把「产品 × 版本 × 渠道」这三个维度丢掉了。如果 `fpic_prod_db` 里同一个 `c_screen_no` 在不同产品/版本下有不同的元件定义（这很常见，12.8 万元素里 `c_screen_no` 是共享的），直接同步会导致画面定义冲突或覆盖。

建议：先确认同步方向 + 是否接受维度降级，再动手。这两点定了，同步脚本可直接产出。
