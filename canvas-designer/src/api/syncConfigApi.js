import { apiPost } from './client';

export const syncConfigApi = {
  get: () => apiPost('/sync_config/get', {}),
  save: (input) => apiPost('/sync_config/save', input),
};
