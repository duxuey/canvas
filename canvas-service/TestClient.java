import java.io.*;
import java.net.*;

public class TestClient {
    static String base = "http://localhost:8006/canvas-service";

    public static void main(String[] args) throws Exception {
        // 1. Save canvas
        String r1 = post("/canvas/save",
            "{\"canvasCode\":\"tc_001\",\"canvasName\":\"Test Canvas\","
            + "\"canvasEname\":\"tc\",\"canvasType\":\"form\",\"canvasJson\":\"{}\","
            + "\"showOrder\":1,\"systemCode\":\"SYS01\",\"pageCode\":\"PAGE01\"}");
        System.out.println("1. SAVE    " + r1);

        // 2. Query by page
        String r2 = post("/canvas/query_by_page",
            "{\"systemCode\":\"SYS01\",\"pageCode\":\"PAGE01\","
            + "\"canvasType\":\"\",\"keyword\":\"\",\"pageNum\":1,\"pageSize\":10}");
        System.out.println("2. QUERY   " + r2);

        // 3. Save page template
        String r3 = post("/page_template/save",
            "{\"templateCode\":\"tmpl_001\",\"templateName\":\"Standard\","
            + "\"templateDesc\":\"Standard template\",\"templateType\":\"page\",\"systemCode\":\"SYS01\"}");
        System.out.println("3. TMPL    " + r3);

        // 4. Save element group
        String r4 = post("/element_group/save",
            "{\"groupCode\":\"grp_001\",\"groupName\":\"Basic Info\","
            + "\"groupDesc\":\"Basic info group\",\"groupType\":\"form\",\"systemCode\":\"SYS01\"}");
        System.out.println("4. GROUP   " + r4);

        System.out.println("\n=== All tests done! ===");
    }

    static String post(String path, String json) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(base + path).openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(json.getBytes("UTF-8"));
        }
        int code = conn.getResponseCode();
        try (InputStream is = code >= 400 ? conn.getErrorStream() : conn.getInputStream()) {
            return code + " " + new BufferedReader(new InputStreamReader(is, "UTF-8"))
                .lines().reduce("", (a, b) -> a + b);
        }
    }
}
