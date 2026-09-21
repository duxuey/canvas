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

  /**
   * 当前任务的计划：{ goal, steps: string[], done: number } | null
   *
   * 存在这里（而不是只上报到看板）是因为下一轮对话要用它：
   * 聊天历史里只有助手回复的文本，没有工具调用的细节，
   * 用户说"继续"时得靠这份计划知道还剩什么。
   */
  plan: null,

  // --- Actions ---

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  setLoading: (v) => set({ loading: v }),
  setError: (err) => set({ error: err }),
  clearError: () => set({ error: null }),

  setPlan: (plan) => set({ plan }),
  clearPlan: () => set({ plan: null }),

  // 计划跟着对话走：重置对话时一并清掉，否则新任务会带着旧计划跑
  clearMessages: () => set({ messages: [], error: null, plan: null }),

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
