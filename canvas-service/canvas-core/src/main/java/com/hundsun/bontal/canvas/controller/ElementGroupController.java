package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.service.ElementGroupService;
import com.hundsun.bontal.common.annotation.TranCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/element_group")
public class ElementGroupController {

    @Autowired
    private ElementGroupService groupService;

    @TranCode("GRP0001")
    @PostMapping("/save")
    public ElementGroupService.saveGroup.Output saveGroup(@RequestBody ElementGroupService.saveGroup.Input input) {
        ElementGroupService.saveGroup.Output output = new ElementGroupService.saveGroup.Output();
        groupService.saveGroup(input, output);
        return output;
    }

    @TranCode("GRP0002")
    @PostMapping("/delete")
    public ElementGroupService.deleteGroup.Output deleteGroup(@RequestBody ElementGroupService.deleteGroup.Input input) {
        ElementGroupService.deleteGroup.Output output = new ElementGroupService.deleteGroup.Output();
        groupService.deleteGroup(input, output);
        return output;
    }

    @TranCode("GRP0003")
    @PostMapping("/query_by_system")
    public ElementGroupService.queryBySystem.Output queryBySystem(@RequestBody ElementGroupService.queryBySystem.Input input) {
        ElementGroupService.queryBySystem.Output output = new ElementGroupService.queryBySystem.Output();
        groupService.queryBySystem(input, output);
        return output;
    }

    @TranCode("GRP0004")
    @PostMapping("/add_item")
    public ElementGroupService.addItem.Output addItem(@RequestBody ElementGroupService.addItem.Input input) {
        ElementGroupService.addItem.Output output = new ElementGroupService.addItem.Output();
        groupService.addItem(input, output);
        return output;
    }

    @TranCode("GRP0005")
    @PostMapping("/delete_item")
    public ElementGroupService.deleteItem.Output deleteItem(@RequestBody ElementGroupService.deleteItem.Input input) {
        ElementGroupService.deleteItem.Output output = new ElementGroupService.deleteItem.Output();
        groupService.deleteItem(input, output);
        return output;
    }

    @TranCode("GRP0006")
    @PostMapping("/query_items")
    public ElementGroupService.queryItems.Output queryItems(@RequestBody ElementGroupService.queryItems.Input input) {
        ElementGroupService.queryItems.Output output = new ElementGroupService.queryItems.Output();
        groupService.queryItems(input, output);
        return output;
    }
}
