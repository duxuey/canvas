import java.io.*;
import java.net.*;

public class FullTest {
  static String base = "http://localhost:5173/canvas-service";
  static int pass = 0, fail = 0;

  public static void main(String[] a) throws Exception {
    // 1. Save canvas with 4 elements
    test("Save canvas with 4 elements", post("/canvas/save",
      "{\"canvasCode\":\"ftest1\",\"canvasName\":\"FullTest Form\","
      + "\"canvasEname\":\"ft_form\",\"canvasType\":\"form\","
      + "\"canvasJson\":\"" + esc("{"
      + "\\\"c_canvas_code\\\":\\\"ftest1\\\","
      + "\\\"canvasType\\\":\\\"form\\\","
      + "\\\"columns\\\":2,"
      + "\\\"elements\\\":["
      + "{\\\"control_type\\\":\\\"text\\\",\\\"elem_name\\\":\\\"Name\\\"},"
      + "{\\\"control_type\\\":\\\"number\\\",\\\"elem_name\\\":\\\"Age\\\"},"
      + "{\\\"control_type\\\":\\\"select\\\",\\\"elem_name\\\":\\\"Gender\\\"},"
      + "{\\\"control_type\\\":\\\"datePicker\\\",\\\"elem_name\\\":\\\"Birthday\\\"}"
      + "],\\\"buttons\\\":[]"
      + "}") + "\","
      + "\"showOrder\":1,\"systemCode\":\"SYS01\",\"pageCode\":\"PAGE01\"}"),
      "canvasCode");

    // 2. Query by code
    test("Query canvas by code", post("/canvas/query_by_code",
      "{\"canvasCode\":\"ftest1\"}"), "ftest1");

    // 3. Query by page
    test("Query canvas by page", post("/canvas/query_by_page",
      "{\"systemCode\":\"SYS01\",\"pageCode\":\"PAGE01\","
      + "\"canvasType\":\"\",\"keyword\":\"\",\"pageNum\":1,\"pageSize\":10}"),
      "total");

    // 4. Save template
    test("Save page template", post("/page_template/save",
      "{\"templateCode\":\"ft_tmpl\",\"templateName\":\"FT Template\","
      + "\"templateDesc\":\"Full test template\",\"templateType\":\"page\","
      + "\"systemCode\":\"SYS01\"}"), "templateCode");

    // 5. Query templates
    test("Query templates by system", post("/page_template/query_by_system",
      "{\"systemCode\":\"SYS01\"}"), "templates");

    // 6. Save element group
    test("Save element group", post("/element_group/save",
      "{\"groupCode\":\"ft_grp\",\"groupName\":\"Basic Info Group\","
      + "\"groupDesc\":\"Name+Age+Gender\",\"groupType\":\"form\","
      + "\"groupTag\":\"basic\",\"systemCode\":\"SYS01\"}"), "groupCode");

    // 7. Query groups
    test("Query element groups", post("/element_group/query_by_system",
      "{\"systemCode\":\"SYS01\"}"), "groups");

    // 8. Canvas preview
    test("Canvas preview", post("/canvas/preview",
      "{\"canvasCode\":\"ftest1\"}"), "previewJson");

    // 9. Edit canvas
    test("Edit canvas", post("/canvas/edit_canvas",
      "{\"canvasCode\":\"ftest1\"}"), "canvasJson");

    // 10. Copy canvas
    test("Copy canvas", post("/canvas/copy",
      "{\"sourceCanvasCode\":\"ftest1\",\"targetSystemCode\":\"SYS01\","
      + "\"targetPageCode\":\"PAGE02\",\"targetCanvasName\":\"FullTest Copy\"}"),
      "newCanvasCode");

    // 11. Query config
    test("Query canvas config", post("/canvas_config/query_by_canvas",
      "{\"canvasCode\":\"ftest1\"}"), "");

    // 12. Query buttons
    test("Query canvas buttons", post("/canvas_button/query_by_canvas",
      "{\"canvasCode\":\"ftest1\"}"), "");

    // 13. Query elements
    test("Query canvas elements", post("/canvas_element/query_by_canvas",
      "{\"canvasCode\":\"ftest1\"}"), "");

    // 14. Page preview
    test("Page preview", post("/canvas/page_preview",
      "{\"systemCode\":\"SYS01\",\"pageCode\":\"PAGE01\"}"), "");

    // Cleanup
    post("/page_template/delete", "{\"templateCode\":\"ft_tmpl\"}");
    post("/element_group/delete", "{\"groupCode\":\"ft_grp\"}");

    System.out.println("\n=== Result ===");
    System.out.println("Pass: " + pass + " | Fail: " + fail + " | Total: " + (pass + fail));
    System.out.println(fail == 0 ? "ALL TESTS PASSED!" : "SOME TESTS FAILED!");
  }

  static void test(String name, String response, String expect) {
    boolean ok = !response.contains("\"status\":500")
      && !response.contains("Internal Server Error")
      && !response.contains("Connection refused")
      && (expect.isEmpty() || response.contains(expect));
    System.out.printf("%s %s%n  %.120s%n",
      ok ? "OK" : "FAIL", name, response.replace("\n"," "));
    if (ok) pass++; else fail++;
  }

  static String post(String path, String json) {
    try {
      HttpURLConnection c = (HttpURLConnection) new URL(base + path).openConnection();
      c.setRequestMethod("POST"); c.setDoOutput(true);
      c.setRequestProperty("Content-Type", "application/json");
      c.setConnectTimeout(5000); c.setReadTimeout(5000);
      try (OutputStream o = c.getOutputStream()) {
        o.write(json.getBytes("UTF-8"));
      }
      InputStream is = c.getResponseCode() >= 400 ? c.getErrorStream() : c.getInputStream();
      if (is == null) return "HTTP " + c.getResponseCode();
      return new BufferedReader(new InputStreamReader(is, "UTF-8")).lines()
        .reduce("", (x, y) -> x + y);
    } catch (Exception e) {
      return "ERROR: " + e.getClass().getSimpleName() + " - " + e.getMessage();
    }
  }

  static String esc(String s) {
    return s.replace("\\", "\\\\").replace("\"", "\\\"");
  }
}
