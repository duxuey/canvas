import java.io.*;
import java.net.*;

public class TplTest {
  public static void main(String[] a) throws Exception {
    String code = "tpl_" + System.currentTimeMillis();
    String r1 = post("/page_template/save", "{\"templateCode\":\"" + code + "\",\"templateName\":\"TestTemplate\",\"templateDesc\":\"test desc\",\"templateType\":\"page\",\"systemCode\":\"SYS01\"}");
    System.out.println("SAVE: " + r1);
    String r2 = post("/page_template/query_by_code", "{\"templateCode\":\"" + code + "\"}");
    System.out.println("QUERY_BY_CODE: " + r2);
    String r3 = post("/page_template/query_by_system", "{\"systemCode\":\"SYS01\"}");
    System.out.println("QUERY_BY_SYSTEM: " + r3);
  }
  static String post(String path, String json) throws Exception {
    HttpURLConnection c = (HttpURLConnection) new URL("http://localhost:8006/canvas-service" + path).openConnection();
    c.setRequestMethod("POST"); c.setDoOutput(true);
    c.setRequestProperty("Content-Type", "application/json");
    c.setConnectTimeout(5000); c.setReadTimeout(5000);
    try (OutputStream o = c.getOutputStream()) { o.write(json.getBytes("UTF-8")); }
    int code = c.getResponseCode();
    InputStream is = code >= 400 ? c.getErrorStream() : c.getInputStream();
    return code + " " + new BufferedReader(new InputStreamReader(is, "UTF-8")).lines().reduce("",(x,y)->x+y);
  }
}
