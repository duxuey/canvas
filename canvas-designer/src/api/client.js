const BASE_URL = '/canvas-service';

export class ApiError extends Error {
  /**
   * @param {number}   status    HTTP 状态码
   * @param {string}   code      规范错误码 (e.g. "BONTAL_RESOURCE_NOT_FOUND")
   * @param {string}   message   面向人的错误消息
   * @param {boolean}  retryable 是否可重试
   * @param {Array}    issues    字段级校验错误 [{field, message}, ...]
   * @param {string}   traceId   链路追踪 ID
   */
  constructor(status, code, message, { retryable, issues, traceId } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable || false;
    this.issues = issues || [];
    this.traceId = traceId || '';
  }
}

/**
 * 统一 POST 请求。
 * 兼容新旧两种后端响应格式：
 *   新格式: { code, message, issues?, traceId, retryable, data? }
 *   旧格式: { success, message, ... }  或 { code: -1, message: "..." }
 */
export async function apiPost(path, body = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (typeof data !== 'object' || data === null) {
    throw new ApiError(res.status, 'UNKNOWN', String(data));
  }

  // ──── 新规范格式 (code 为四段式或 "OK") ────
  if (data.code && data.code !== 'OK' && data.code !== 'SUCCESS') {
    // 有规范错误码
    throw new ApiError(
      res.status,
      data.code,
      data.message || data.code,
      {
        retryable: data.retryable || false,
        issues: data.issues || [],
        traceId: data.traceId || '',
      },
    );
  }

  if (data.code === 'OK') {
    // 成功 —— 直接返回
    return data;
  }

  // ──── 兼容旧格式 ────
  // 注意：不再把 success=false 直接抛异常，而是原样返回，让调用方自行判断
  // （同步等接口需要根据 success 字段给用户明确反馈，而非统一抛错）
  if (data.success === false) {
    return data;
  }
  if (data.code !== undefined && data.code !== null && data.code !== 0 && data.code !== 200) {
    throw new ApiError(200, 'BACKEND_ERROR', data.message || data.msg || `请求失败 (code: ${data.code})`);
  }

  // ──── HTTP 级错误 ────
  if (!res.ok) {
    const errMsg = data.message || data.error || data.msg || JSON.stringify(data);
    throw new ApiError(res.status, data.code || 'HTTP_ERROR', errMsg);
  }

  return data;
}
