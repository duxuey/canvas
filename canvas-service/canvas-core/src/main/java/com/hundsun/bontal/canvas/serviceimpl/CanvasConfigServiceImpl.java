package com.hundsun.bontal.canvas.serviceimpl;

import com.hundsun.bontal.canvas.dao.CanvasConfigDao;
import com.hundsun.bontal.canvas.model.CanvasConfig;
import com.hundsun.bontal.canvas.service.CanvasConfigService;
import com.hundsun.bontal.common.util.BeanUtil;
import com.hundsun.ta.base.BusinessMinService;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CanvasConfigServiceImpl extends BusinessMinService implements CanvasConfigService {

    @Override
    public void queryByCanvas(queryByCanvas.Input input, queryByCanvas.Output output) {
        CanvasConfig config = CanvasConfigDao.selectByCanvasCode(input.getCanvasCode());
        if (config != null) {
            output.setConfig(BeanUtil.bean2Map(config));
        }
    }

    @Override
    public void updateConfig(updateConfig.Input input, updateConfig.Output output) {
        CanvasConfig config = CanvasConfigDao.selectByCanvasCode(input.getCanvasCode());
        if (config == null) {
            config = new CanvasConfig();
            config.setC_canvas_code(input.getCanvasCode());
        }
        if (input.getCanvasType() != null) config.setC_canvas_type(input.getCanvasType());
        if (input.getColumns() != null) config.setN_columns(input.getColumns());
        if (input.getButtonsLayout() != null) config.setC_buttons_layout(input.getButtonsLayout());
        if (input.getModifyFunc() != null) config.setC_modify_func(input.getModifyFunc());
        if (input.getCalcEnvelopFunc() != null) config.setC_calc_envelop_func(input.getCalcEnvelopFunc());
        if (input.getSaveEnvelopFunc() != null) config.setC_save_envelop_func(input.getSaveEnvelopFunc());
        if (input.getQueryEnvelopFunc() != null) config.setC_query_envelop_func(input.getQueryEnvelopFunc());
        if (input.getAddEventFunc() != null) config.setC_add_event_func(input.getAddEventFunc());
        if (input.getDeleteEventFunc() != null) config.setC_delete_event_func(input.getDeleteEventFunc());
        if (input.getCreateEventFunc() != null) config.setC_create_event_func(input.getCreateEventFunc());
        if (input.getVerifyValidFunc() != null) config.setC_verify_valid_func(input.getVerifyValidFunc());
        if (input.getOprtType() != null) config.setC_oprt_type(input.getOprtType());
        if (input.getOprtButton() != null) config.setC_oprt_button(input.getOprtButton());
        if (input.getCompFlag() != null) config.setC_comp_flag(input.getCompFlag());
        if (input.getSearchSql() != null) config.setC_sql_searchsql(input.getSearchSql());
        if (input.getInsertSql() != null) config.setC_sql_insertsql(input.getInsertSql());

        CanvasConfigDao.updateByCanvasCode(config);
    }
}
