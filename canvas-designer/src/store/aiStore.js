import { create } from 'zustand';

/**
 * AI Store — manages chat panel state and conversation history.
 */
export const useAiStore = create((set, get) => ({
  /** Whether the AI panel is visible */
  panelOpen: false,

  /** Conversation messages: { role: 'user'|'assistant', content: string, toolResults?: string[] } */
  messages: [],

  /** Whether the AI is currently processing */
  loading: false,

  /** Error message if the last call failed */
  error: null,

  // --- Actions ---

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  setLoading: (v) => set({ loading: v }),
  setError: (err) => set({ error: err }),
  clearError: () => set({ error: null }),

  clearMessages: () => set({ messages: [], error: null }),

  /** Update the last assistant message (for streaming or appending results) */
  updateLastAssistant: (content) => set((s) => {
    const msgs = [...s.messages];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') {
        msgs[i] = { ...msgs[i], content: msgs[i].content + content };
        break;
      }
    }
    return { messages: msgs };
  }),
}));
