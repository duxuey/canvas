import { apiPost } from './client';

export const canvasButtonApi = {
  queryByCanvas: (canvasCode) => apiPost('/canvas_button/query_by_canvas', { canvasCode }),
};
