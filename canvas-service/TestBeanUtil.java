import com.hundsun.bontal.common.dto.Page;
import com.hundsun.bontal.common.util.BeanUtil;
import java.util.*;

public class TestBeanUtil {
  public static void main(String[] a) {
    // Test simple POJO
    Page<String> p = new Page<>();
    p.setTotal(10);
    p.setSize(5);
    p.setCurrent(1);
    p.setData("hello");
    Map<String, Object> m = BeanUtil.bean2Map(p);
    System.out.println("Page map: " + m);
    System.out.println("total: " + m.get("total"));
    System.out.println("size: " + m.get("size"));
    System.out.println("data: " + m.get("data"));
  }
}
