import { apiPost } from './client';

export const canvasPublishApi = {
  /** Publish a canvas (creates a new version) */
  publish: (input) => apiPost('/canvas_publish/publish', input),

  /** List all published versions for a canvas */
  getVersions: (canvasCode) => apiPost('/canvas_publish/versions', { canvasCode }),

  /** Get detail of a single published version (includes full JSON) */
  getDetail: (pkId) => apiPost('/canvas_publish/detail', { pkId }),

  /** Update version metadata (name, note, status) */
  update: (input) => apiPost('/canvas_publish/update', input),

  /** Mark a version as deprecated */
  deprecate: (pkId) => apiPost('/canvas_publish/deprecate', { pkId }),
};
