import java.io.*;
import java.net.*;

/**
 * Full end-to-end test: template -> canvas -> load -> verify
 */
public class E2ETest {
  static String base = "http://localhost:5173/canvas-service";

  public static void main(String[] a) throws Exception {
    log("=== E2E Flow Test ===");

    // Step 1: Clean DB
    log("Step 1: Clean all tables");
    // (skip - run CleanDB first if needed)

    // Step 2: Create a template
    log("Step 2: Create page template");
    String r1 = post("/page_template/save", "{"
      + "\"templateCode\":\"e2e_tpl\","
      + "\"templateName\":\"E2E_Insurance_Claim\","
      + "\"templateDesc\":\"End to end test template\","
      + "\"templateType\":\"page\","
      + "\"systemCode\":\"SYS01\"}");
    log("  SAVE template: " + r1);

    // Step 3: Create canvas #1 under this template (Claim Info form)
    log("Step 3: Create canvas #1 (claim form)");
    String json1 = "{"
      + "\"c_canvas_name\":\"理赔信息表单\","
      + "\"canvasType\":\"form\",\"columns\":2,"
      + "\"elements\":["
      + "{\"control_type\":\"text\",\"elem_code\":\"claim_no\",\"elem_name\":\"理赔单号\",\"rel_field_name\":\"claim_no\",\"required_flag\":\"1\",\"visible_flag\":\"1\"},"
      + "{\"control_type\":\"datePicker\",\"elem_code\":\"claim_date\",\"elem_name\":\"理赔日期\",\"rel_field_name\":\"claim_date\",\"required_flag\":\"1\",\"visible_flag\":\"1\"},"
      + "{\"control_type\":\"text\",\"elem_code\":\"claimant\",\"elem_name\":\"理赔人\",\"rel_field_name\":\"claimant\",\"required_flag\":\"1\",\"visible_flag\":\"1\"},"
      + "{\"control_type\":\"number\",\"elem_code\":\"amount\",\"elem_name\":\"理赔金额\",\"rel_field_name\":\"amount\",\"required_flag\":\"1\",\"visible_flag\":\"1\"},"
      + "{\"control_type\":\"select\",\"elem_code\":\"status\",\"elem_name\":\"处理状态\",\"rel_field_name\":\"status\",\"code_list_name\":\"CLAIM_STATUS\",\"visible_flag\":\"1\"},"
      + "{\"control_type\":\"textarea\",\"elem_code\":\"remark\",\"elem_name\":\"备注\",\"rel_field_name\":\"remark\",\"visible_flag\":\"1\"}],"
      + "\"buttons\":[]}";
    String r2 = post("/canvas/save", "{"
      + "\"canvasCode\":\"e2e_claim_form\","
      + "\"canvasName\":\"理赔信息表单\","
      + "\"canvasType\":\"form\","
      + "\"canvasJson\":\"" + esc(json1) + "\","
      + "\"showOrder\":1,"
      + "\"systemCode\":\"SYS01\","
      + "\"pageCode\":\"PAGE_CLAIM\","
      + "\"templateCode\":\"e2e_tpl\"}");
    log("  SAVE canvas: " + r2);

    // Step 4: Create canvas #2 under same template (Customer Info form)
    log("Step 4: Create canvas #2 (customer form)");
    String json2 = "{"
      + "\"c_canvas_name\":\"客户信息表单\","
      + "\"canvasType\":\"form\",\"columns\":2,"
      + "\"elements\":["
      + "{\"control_type\":\"text\",\"elem_code\":\"cust_name\",\"elem_name\":\"客户姓名\",\"rel_field_name\":\"cust_name\",\"required_flag\":\"1\",\"visible_flag\":\"1\"},"
      + "{\"control_type\":\"text\",\"elem_code\":\"id_card\",\"elem_name\":\"身份证号\",\"rel_field_name\":\"id_card\",\"required_flag\":\"1\",\"visible_flag\":\"1\"},"
      + "{\"control_type\":\"text\",\"elem_code\":\"phone\",\"elem_name\":\"联系电话\",\"rel_field_name\":\"phone\",\"visible_flag\":\"1\"}],"
      + "\"buttons\":[]}";
    String r3 = post("/canvas/save", "{"
      + "\"canvasCode\":\"e2e_cust_form\","
      + "\"canvasName\":\"客户信息表单\","
      + "\"canvasType\":\"form\","
      + "\"canvasJson\":\"" + esc(json2) + "\","
      + "\"showOrder\":2,"
      + "\"systemCode\":\"SYS01\","
      + "\"pageCode\":\"PAGE_CLAIM\","
      + "\"templateCode\":\"e2e_tpl\"}");
    log("  SAVE canvas: " + r3);

    // Step 5: Verify template list
    log("Step 5: Query templates");
    String r4 = post("/page_template/query_by_system", "{\"systemCode\":\"SYS01\"}");
    log("  TEMPLATES: " + r4.substring(0, Math.min(200, r4.length())));

    // Step 6: Query canvases under template
    log("Step 6: Query canvases under template e2e_tpl");
    String r5 = post("/page_template/query_canvases", "{\"templateCode\":\"e2e_tpl\"}");
    log("  CANVASES: " + r5.substring(0, Math.min(300, r5.length())));

    // Step 7: Load canvas by code (simulates designer "open" action)
    log("Step 7: Load canvas e2e_claim_form by code");
    String r6 = post("/canvas/query_by_code", "{\"canvasCode\":\"e2e_claim_form\"}");
    log("  CANVAS DATA has c_canvas_json: " + r6.contains("c_canvas_json"));
    log("  CANVAS DATA has elements: " + r6.contains("control_type"));

    // Step 8: Preview canvas
    log("Step 8: Preview canvas");
    String r7 = post("/canvas/preview", "{\"canvasCode\":\"e2e_claim_form\"}");
    log("  PREVIEW returned: " + (r7.contains("previewJson") ? "YES" : "NO"));

    // Step 9: Query by page (list all canvases on PAGE_CLAIM)
    log("Step 9: Query canvases by page");
    String r8 = post("/canvas/query_by_page", "{"
      + "\"systemCode\":\"SYS01\",\"pageCode\":\"PAGE_CLAIM\","
      + "\"canvasType\":\"\",\"keyword\":\"\",\"pageNum\":1,\"pageSize\":10}");
    log("  PAGE query returned " + (r8.contains("\"data\"") ? "data" : "ERROR"));

    log("\n=== ALL E2E STEPS COMPLETE ===");
    log("Verification: frontend can now open http://localhost:5173/#templates");
    log("  -> Find 'E2E_Insurance_Claim' template");
    log("  -> Expand to see 2 canvases");
    log("  -> Click 'Open in designer' on canvas #1");
    log("  -> Designer loads with 6 element form");
    log("  -> Check sidebar template tab shows E2E_Insurance_Claim");
  }

  static void log(String s) { System.out.println(s); }

  static String post(String path, String json) throws Exception {
    HttpURLConnection c = (HttpURLConnection) new URL(base + path).openConnection();
    c.setRequestMethod("POST"); c.setDoOutput(true);
    c.setRequestProperty("Content-Type", "application/json");
    c.setConnectTimeout(5000); c.setReadTimeout(5000);
    try (OutputStream o = c.getOutputStream()) { o.write(json.getBytes("UTF-8")); }
    InputStream is = c.getResponseCode() >= 400 ? c.getErrorStream() : c.getInputStream();
    if (is == null) return "HTTP " + c.getResponseCode();
    return new BufferedReader(new InputStreamReader(is, "UTF-8")).lines()
      .reduce("", (x, y) -> x + y);
  }

  static String esc(String s) { return s.replace("\\","\\\\").replace("\"","\\\""); }
}
