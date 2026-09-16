import java.io.*;
import java.net.*;

public class TestElementDefApi {
    public static void main(String[] args) throws Exception {
        String base = "http://localhost:8006/canvas-service/element_def";

        // Save
        String saveBody = "{\"elemCode\":\"test_elem_01\",\"elemName\":\"Test Element\",\"controlType\":\"text\",\"systemCode\":\"SYS01\"}";
        String saveResult = post(base + "/save", saveBody);
        System.out.println("=== SAVE ===");
        System.out.println(saveResult);

        // Query
        String queryResult = post(base + "/query_by_system", "{\"systemCode\":\"SYS01\"}");
        System.out.println("\n=== QUERY ===");
        System.out.println(queryResult);

        // Delete
        String delResult = post(base + "/delete", "{\"code\":\"test_elem_01\"}");
        System.out.println("\n=== DELETE ===");
        System.out.println(delResult);

        // Query again
        String query2 = post(base + "/query_by_system", "{\"systemCode\":\"SYS01\"}");
        System.out.println("\n=== QUERY AFTER DELETE ===");
        System.out.println(query2);
    }

    static String post(String url, String body) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setRequestProperty("Content-Type", "application/json");
        try (OutputStream os = c.getOutputStream()) {
            os.write(body.getBytes("UTF-8"));
        }
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"))) {
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
        }
        return sb.toString();
    }
}
