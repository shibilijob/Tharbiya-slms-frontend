import { create } from 'zustand';

interface UiState {
  toastMessage: string | null;
  toastTimer: ReturnType<typeof setTimeout> | null;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  toastMessage: null,
  toastTimer: null,

  showToast: (message: string) => {
    const existingTimer = get().toastTimer;
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      set({ toastMessage: null, toastTimer: null });
    }, 4000);

    set({ toastMessage: message, toastTimer: timer });
  },

  clearToast: () => {
    const existingTimer = get().toastTimer;
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    set({ toastMessage: null, toastTimer: null });
  },
}));
