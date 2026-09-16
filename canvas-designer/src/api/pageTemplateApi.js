import { apiPost } from './client';

export const pageTemplateApi = {
  save: (input) => apiPost('/page_template/save', input),
  delete: (templateCode) => apiPost('/page_template/delete', { templateCode }),
  queryByCode: (templateCode) => apiPost('/page_template/query_by_code', { templateCode }),
  queryBySystem: (systemCode) => apiPost('/page_template/query_by_system', { systemCode }),
  queryCanvases: (templateCode) => apiPost('/page_template/query_canvases', { templateCode }),
  saveBatch: (input) => apiPost('/page_template/save_batch', input),
};
