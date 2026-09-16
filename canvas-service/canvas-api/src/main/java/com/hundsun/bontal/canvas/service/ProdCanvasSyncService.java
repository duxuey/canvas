package com.hundsun.bontal.canvas.service;

/**
 * 画布系统 <-> 产品工厂（fpic_prod_db）双向同步服务。
 *
 * <p>受开关 {@code canvas.sync.enabled} 控制，关闭时不执行任何同步。</p>
 *
 * <p>方向：</p>
 * <ul>
 *   <li>PULL：产品工厂 -> 画布系统（增量，按 d_uptr_time）</li>
 *   <li>PUSH：画布系统 -> 产品工厂（保存/删除/复制画布后回写）</li>
 * </ul>
 */
public interface ProdCanvasSyncService {

    /**
     * 是否启用同步（读取开关 canvas.sync.enabled）。
     */
    boolean isEnabled();

    /**
     * 拉取方向：将产品工厂自上次同步以来的变更增量同步到画布系统。
     * 开关关闭时为空操作。
     */
    void pullIncremental();

    /**
     * 回写方向：将指定画布的最新定义回写到产品工厂对应画面。
     * 开关关闭时为空操作。
     *
     * @param canvasCode 画布代码（对应产品工厂 c_screen_no）
     * @return 成功回写的组件（screen）数量；画布不存在、JSON 解析失败、数据库异常等会抛出运行时异常
     */
    int pushCanvas(String canvasCode);

    /**
     * 回写方向：删除产品工厂中对应画面的记录（含元件/属性/画面）。
     * 开关关闭时为空操作。
     *
     * @param canvasCode 画布代码（对应产品工厂 c_screen_no）
     */
    void pushDelete(String canvasCode);

    /**
     * 回写方向：将画布系统中所有画布批量回写到产品工厂。
     * 开关关闭时为空操作。用于定时同步。
     *
     * @return 成功回写的画布数
     */
    int pushAll();
}
