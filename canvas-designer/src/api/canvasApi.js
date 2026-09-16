import { apiPost } from './client';

export const canvasApi = {
  save: (input) => apiPost('/canvas/save', input),
  delete: (canvasCode) => apiPost('/canvas/delete', { canvasCode }),
  queryByPage: (input) => apiPost('/canvas/query_by_page', input),
  queryByCode: (canvasCode) => apiPost('/canvas/query_by_code', { canvasCode }),
  updateJsonByCode: (input) => apiPost('/canvas/update_json_by_code', input),
  editCanvas: (canvasCode) => apiPost('/canvas/edit_canvas', { canvasCode }),
  preview: (canvasCode) => apiPost('/canvas/preview', { canvasCode }),
  copy: (input) => apiPost('/canvas/copy', input),
  pagePreview: (systemCode, pageCode) => apiPost('/canvas/page_preview', { systemCode, pageCode }),
  queryBySystem: (systemCode) => apiPost('/canvas/query_by_system', { systemCode }),
  publish: (canvasCode) => apiPost('/canvas/publish', { canvasCode }),
  syncToProd: (canvasCode) => apiPost('/canvas/sync_to_prod', { canvasCode }),
};
