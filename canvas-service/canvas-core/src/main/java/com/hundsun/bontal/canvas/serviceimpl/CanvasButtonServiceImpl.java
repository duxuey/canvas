package com.hundsun.bontal.canvas.serviceimpl;

import com.hundsun.bontal.canvas.dao.CanvasButtonDao;
import com.hundsun.bontal.canvas.model.CanvasButton;
import com.hundsun.bontal.canvas.service.CanvasButtonService;
import com.hundsun.bontal.common.util.BeanUtil;
import com.hundsun.ta.base.BusinessMinService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CanvasButtonServiceImpl extends BusinessMinService implements CanvasButtonService {

    @Override
    public void queryByCanvas(queryByCanvas.Input input, queryByCanvas.Output output) {
        List<CanvasButton> buttons = CanvasButtonDao.selectByCanvasCode(input.getCanvasCode());
        List<Map<String, Object>> result = new ArrayList<>();
        for (CanvasButton b : buttons) {
            result.add(BeanUtil.bean2Map(b));
        }
        output.setButtons(result);
    }
}
