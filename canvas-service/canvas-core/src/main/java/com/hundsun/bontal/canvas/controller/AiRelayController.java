package com.hundsun.bontal.canvas.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import javax.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Enumeration;

/**
 * AI API relay controller — proxies AI chat requests to avoid Cloudflare CORS/bot blocking.
 * The browser calls /canvas-service/ai/relay, and this controller forwards to the actual LLM API.
 */
@RestController
@RequestMapping("/ai")
public class AiRelayController {

    @PostMapping("/relay")
    public ResponseEntity<String> relay(HttpServletRequest request) {
        try {
            // Read the request body
            StringBuilder body = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    body.append(line);
                }
            }

            // Get API key and endpoint from headers
            String apiKey = request.getHeader("X-Ai-Api-Key");
            String endpoint = request.getHeader("X-Ai-Endpoint");
            String model = request.getHeader("X-Ai-Model");

            if (apiKey == null || apiKey.isEmpty()) {
                return ResponseEntity.status(400)
                    .body("{\"error\":\"Missing X-Ai-Api-Key header\"}");
            }

            if (endpoint == null || endpoint.isEmpty()) {
                endpoint = "https://api.deepseek.com/v1/chat/completions";
            }

            System.out.println("[AI Relay] Forwarding to: " + endpoint);
            System.out.println("[AI Relay] Model: " + model);
            System.out.println("[AI Relay] Body length: " + body.length());

            // Make the HTTP request to the LLM API (OpenAI-compatible format)
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(120000);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setRequestProperty("User-Agent", "CanvasDesigner/1.0");

            // Write request body
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes("UTF-8"));
                os.flush();
            }

            // Read response
            int status = conn.getResponseCode();
            StringBuilder responseBody = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(
                        status >= 400 ? conn.getErrorStream() : conn.getInputStream(),
                        "UTF-8"))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    responseBody.append(line);
                }
            }

            System.out.println("[AI Relay] Response status: " + status);
            System.out.println("[AI Relay] Response body preview: " +
                responseBody.substring(0, Math.min(200, responseBody.length())));

            // Return the response to the browser
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            return new ResponseEntity<>(responseBody.toString(), headers, HttpStatus.valueOf(status));

        } catch (Exception e) {
            System.err.println("[AI Relay] Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body("{\"error\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}");
        }
    }
}
