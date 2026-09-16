package com.hundsun.bontal.canvas.serviceimpl;

import com.hundsun.bontal.canvas.dao.CanvasElementDao;
import com.hundsun.bontal.canvas.model.CanvasElement;
import com.hundsun.bontal.canvas.service.CanvasElementService;
import com.hundsun.bontal.common.util.BeanUtil;
import com.hundsun.ta.base.BusinessMinService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CanvasElementServiceImpl extends BusinessMinService implements CanvasElementService {

    @Override
    public void queryByCanvas(queryByCanvas.Input input, queryByCanvas.Output output) {
        List<CanvasElement> elements = CanvasElementDao.selectByCanvasCode(input.getCanvasCode());
        List<Map<String, Object>> result = new ArrayList<>();
        for (CanvasElement e : elements) {
            result.add(BeanUtil.bean2Map(e));
        }
        output.setElements(result);
    }

    @Override
    public void queryDynamic(queryDynamic.Input input, queryDynamic.Output output) {
        // Simplified dynamic query - delegate to canvas-based query
        List<CanvasElement> elements = CanvasElementDao.selectByCanvasCode(input.getCanvasCode());
        List<Map<String, Object>> result = new ArrayList<>();
        for (CanvasElement e : elements) {
            result.add(BeanUtil.bean2Map(e));
        }
        output.setElements(result);
    }

    @Override
    public void updateElement(updateElement.Input input, updateElement.Output output) {
        CanvasElement elem = new CanvasElement();
        elem.setC_pk_id(input.getPkId());
        elem.setC_elem_name(input.getElemName());
        elem.setC_required_flag(input.getRequiredFlag());
        elem.setC_readonly_flag(input.getReadonlyFlag());
        elem.setC_visible_flag(input.getVisibleFlag());
        elem.setC_default_value(input.getDefaultValue());
        elem.setC_control_attr(input.getControlAttr());
        elem.setN_elem_show_seq(input.getShowSeq());
        CanvasElementDao.updateElementById(elem);
    }
}
