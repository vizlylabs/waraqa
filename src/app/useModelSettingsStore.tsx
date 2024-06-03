import { create } from "zustand";

interface ModelSettingsStore {
  openAIKey: string | null;
  ollamaPort: string | null;
  modelProvider: "openai" | "ollama";
  setOpenAIKey: (key: string) => void;
  setOllamaPort: (port: string) => void;
  setModelProvider: (provider: "openai" | "ollama") => void;
}

export const useModelSettingsStore = create<ModelSettingsStore>((set) => ({
  openAIKey:
    typeof window !== "undefined" ? localStorage.getItem("openaiApiKey") : null,
  ollamaPort:
    typeof window !== "undefined"
      ? localStorage.getItem("ollamaPort") || "http://localhost:11434"
      : "http://localhost:11434",
  modelProvider:
    typeof window !== "undefined"
      ? (localStorage.getItem("modelProvider") as "openai" | "ollama") ||
        "openai"
      : "openai",
  setOpenAIKey: (key) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("openaiApiKey", key);
    }
    set({ openAIKey: key });
  },
  setOllamaPort: (port) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ollamaPort", port);
    }
    set({ ollamaPort: port });
  },
  setModelProvider: (provider) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("modelProvider", provider);
    }
    set({ modelProvider: provider });
  },
}));
