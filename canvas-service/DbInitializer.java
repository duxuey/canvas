import java.io.*;
import java.sql.*;

public class DbInitializer {
    public static void main(String[] args) throws Exception {
        String jdbcUrl = args.length > 0 ? args[0] : "jdbc:mysql://localhost:3306?useUnicode=true&characterEncoding=UTF-8&useSSL=false&allowMultiQueries=true&serverTimezone=Asia/Shanghai";
        String user = args.length > 1 ? args[1] : "root";
        String password = args.length > 2 ? args[2] : "root";
        String sqlFile = args.length > 3 ? args[3] : "init-db.sql";

        System.out.println("Connecting to MySQL: " + jdbcUrl + " (user: " + user + ")");

        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection conn = DriverManager.getConnection(jdbcUrl, user, password)) {
            System.out.println("Connected!");

            // Read SQL file
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new FileReader(sqlFile))) {
                String line;
                while ((line = br.readLine()) != null) {
                    if (!line.startsWith("--") && !line.trim().isEmpty()) {
                        sb.append(line).append("\n");
                    }
                }
            }

            // Split by semicolons and execute
            String[] statements = sb.toString().split(";");
            for (String stmt : statements) {
                String trimmed = stmt.trim();
                if (trimmed.isEmpty()) continue;
                try (Statement s = conn.createStatement()) {
                    s.execute(trimmed);
                    // Extract first meaningful word for display
                    String display = trimmed.length() > 80 ? trimmed.substring(0, 77) + "..." : trimmed;
                    System.out.println("OK: " + display);
                } catch (SQLException e) {
                    if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                        System.out.println("SKIP (exists): " + trimmed.substring(0, Math.min(60, trimmed.length())) + "...");
                    } else {
                        System.err.println("ERROR: " + e.getMessage());
                    }
                }
            }
            System.out.println("\n=== Database initialization complete! ===");
        } catch (SQLException e) {
            System.err.println("Connection failed: " + e.getMessage());
            System.err.println("Trying with no password...");
            try (Connection conn2 = DriverManager.getConnection(jdbcUrl, user, "")) {
                System.out.println("Connected with no password!");
                // Retry with empty password
                // ...
            } catch (SQLException e2) {
                System.err.println("All attempts failed. Please provide correct credentials.");
                System.err.println("Usage: java -cp <classpath> DbInitializer [jdbcUrl] [user] [password] [sqlFile]");
                System.exit(1);
            }
        }
    }
}
