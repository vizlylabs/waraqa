<div align="center">
  <img alt="waraqa-icon" height="160px" src="https://waraqa.ai/waraqa.png" style="margin-bottom:20px">
</div>

# Waraqa

AI-powered data analysis, running privately on your machine.

View a demo of how Waraqa works at [waraqa.ai](https://waraqa.ai).

[![Waraqa Snapshot](https://waraqa.ai/waraqa-snapshot.png)](https://waraqa.ai)

## Features

- **Pyodide analysis environment**: Use Python in WebAssembly with Pyodide for lightweight data analysis.
- **Interactive visualizations**: Create and interact with dynamic data visualizations, powered by Plotly.
- **Flexible model selection**: Use OpenAI or Ollama as your model provider.
- **Edit and re-execute code**: Easily re-execute and edit code to refine your analysis.

## Download or install

### macOS

[Download](https://waraqa.ai/download)

To manually build Waraqa locally, run:

```bash
npm run tauri build
```

## What does Waraqa mean?

"Waraqa" is inspired by the Arabic word "وَرَقَة" (waraqa), which translates to "paper" or "leaf." I thought it would be a cool name that points to the simplicity of converting data to insights with AI, as well as the lightweight nature of doing data analysis with Pyodide. 

## Roadmap

There is **so much** missing right now, but I wanted to force myself to put something out there. A few things missing include:

- Support for more file types (only supports .csvs right now)
- Robust response handling - currently relying on model to print string or Plotly outputs from Pyodide
- Visualization edits (actually already there, but commented out because it's ugly right now)
- Persist chats and chat histories on local filesystem
- and so much more.
