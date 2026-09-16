package com.hundsun.bontal.canvas.engine;

import java.util.ArrayList;
import java.util.List;

/**
 * 画布行 (from SRRow)
 * 表示画布中表单的一行，包含多个元素
 */
public class CanvasRow {
    private List<CanvasElemVO> elements;
    private String c_is_show;

    public CanvasRow() {
        this.elements = new ArrayList<CanvasElemVO>();
    }

    public CanvasRow(String c_is_show) {
        this.elements = new ArrayList<CanvasElemVO>();
        this.c_is_show = c_is_show;
    }

    public List<CanvasElemVO> getElements() {
        return elements;
    }

    public void addElement(CanvasElemVO elem) {
        this.elements.add(elem);
    }

    public String getC_is_show() {
        return c_is_show;
    }

    public void setC_is_show(String c_is_show) {
        this.c_is_show = c_is_show;
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("CanvasRow:[").append("\n");
        if (!elements.isEmpty()) {
            for (CanvasElemVO elem : elements) {
                sb.append(elem.toString()).append(",").append("\n");
            }
            sb.deleteCharAt(sb.length() - 2);
        }
        sb.append("]");
        return sb.toString();
    }
}
