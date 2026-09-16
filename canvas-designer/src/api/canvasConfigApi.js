import { apiPost } from './client';

export const canvasConfigApi = {
  queryByCanvas: (canvasCode) => apiPost('/canvas_config/query_by_canvas', { canvasCode }),
  updateConfig: (input) => apiPost('/canvas_config/update_config', input),
};
