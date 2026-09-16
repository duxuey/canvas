import { apiPost } from './client';

export const canvasElementApi = {
  queryByCanvas: (canvasCode) => apiPost('/canvas_element/query_by_canvas', { canvasCode }),
  queryDynamic: (input) => apiPost('/canvas_element/query_dynamic', input),
  updateElement: (input) => apiPost('/canvas_element/update_element', input),
};
