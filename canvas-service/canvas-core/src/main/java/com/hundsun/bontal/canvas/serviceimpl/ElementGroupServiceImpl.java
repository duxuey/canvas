package com.hundsun.bontal.canvas.serviceimpl;

import com.hundsun.bontal.canvas.mapper.ElementGroupItemMapper;
import com.hundsun.bontal.canvas.mapper.ElementGroupMapper;
import com.hundsun.bontal.canvas.model.ElementGroup;
import com.hundsun.bontal.canvas.model.ElementGroupItem;
import com.hundsun.bontal.canvas.service.ElementGroupService;
import com.hundsun.bontal.common.util.BeanUtil;
import com.hundsun.ta.base.BusinessMinService;
import com.hundsun.ta.utils.SnowflakeIdWorker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.alibaba.fastjson.JSON;

@Service
public class ElementGroupServiceImpl extends BusinessMinService implements ElementGroupService {

    @Autowired
    private ElementGroupMapper groupMapper;

    @Autowired
    private ElementGroupItemMapper itemMapper;

    @Override
    @Transactional
    public void saveGroup(saveGroup.Input input, saveGroup.Output output) {
        String code = input.getGroupCode();
        if (code == null || code.isEmpty()) {
            code = String.valueOf(SnowflakeIdWorker.getId());
        }
        // Check if group exists (using Map to avoid MyBatis-Plus entity mapping issues)
        Map<String, Object> existingMap = groupMapper.selectByGroupCode(code);
        boolean exists = existingMap != null;

        ElementGroup g = new ElementGroup();
        g.setC_group_code(code);
        g.setC_group_name(input.getGroupName());
        g.setC_group_desc(input.getGroupDesc());
        g.setC_group_type(input.getGroupType());
        g.setC_group_tag(input.getGroupTag());
        g.setC_system_code(input.getSystemCode());

        // Store elements + columns as JSON in the group table
        List<Map<String, Object>> elements = input.getElements();
        if (elements != null && !elements.isEmpty()) {
            Map<String, Object> wrapper = new HashMap<>();
            wrapper.put("columns", input.getColumns() != null ? input.getColumns() : 2);
            wrapper.put("elements", elements);
            g.setC_elements_json(JSON.toJSONString(wrapper));
        } else if (exists && existingMap.get("c_elements_json") != null) {
            g.setC_elements_json((String) existingMap.get("c_elements_json"));
        }

        if (exists) {
            groupMapper.updateByGroupCode(g);
        } else {
            g.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
            groupMapper.insert(g);
        }
        output.setGroupCode(code);
    }

    @Override
    @Transactional
    public void deleteGroup(deleteGroup.Input input, deleteGroup.Output output) {
        itemMapper.deleteByGroupCode(input.getGroupCode());
        groupMapper.deleteByGroupCode(input.getGroupCode());
    }

    @Override
    public void queryBySystem(queryBySystem.Input input, queryBySystem.Output output) {
        List<Map<String, Object>> groups = groupMapper.selectBySystemCode(input.getSystemCode());
        output.setGroups(groups != null ? groups : new ArrayList<>());
    }

    @Override
    @Transactional
    public void addItem(addItem.Input input, addItem.Output output) {
        ElementGroupItem item = new ElementGroupItem();
        item.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
        item.setC_group_code(input.getGroupCode());
        item.setC_element_code(input.getElemCode());
        item.setC_canvas_code(input.getCanvasCode());
        item.setC_system_code(input.getSystemCode());
        itemMapper.insert(item);
    }

    @Override
    @Transactional
    public void deleteItem(deleteItem.Input input, deleteItem.Output output) {
        itemMapper.deleteByGroupAndElem(input.getGroupCode(), input.getElemCode());
    }

    @Override
    public void queryItems(queryItems.Input input, queryItems.Output output) {
        List<ElementGroupItem> items = itemMapper.selectByGroupCode(input.getGroupCode());
        List<Map<String, Object>> result = new ArrayList<>();
        for (ElementGroupItem i : items) {
            result.add(BeanUtil.bean2Map(i));
        }
        output.setItems(result);
    }
}
