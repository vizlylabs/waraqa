<div align="center">
  <img alt="waraqa-icon" height="160px" src="https://waraqa.ai/waraqa.png" style="margin-bottom:20px">
</div>

# Waraqa

AI-powered data analysis, running privately on your machine.

View a demo of how Waraqa works at [waraqa.ai](https://waraqa.ai).

[![Waraqa Snapshot](https://waraqa.ai/waraqa-snapshot.png)](https://waraqa.ai)
<p align="center"><sub>This snapshot shows an OpenAI-powered response. The demo video shows use of local models via Ollama, but I had to go easier on it.</sub></p>

## Features

- **Pyodide analysis environment**: Use Python in WebAssembly with Pyodide for lightweight data analysis.
- **Interactive visualizations**: Create and interact with dynamic data visualizations, powered by Plotly.
- **Flexible model selection**: Use OpenAI or Ollama as your model provider.
- **Edit and re-execute code**: Easily re-execute and edit code to refine your analysis.

## Download or install

### macOS

[Download](https://waraqa.ai/download)

To manually build Waraqa locally, clone this repository and run:

```bash
npm install
npm run tauri build
```

### Windows

Haven't tested this - might work?

## What does Waraqa mean?

"Waraqa" is inspired by the Arabic word "وَرَقَة" (waraqa), which translates to "paper" or "leaf." I thought it would be a cool name that points to the simplicity of converting data to insights with AI, as well as the lightweight nature of doing data analysis with Pyodide. 

## Roadmap

There is **so much** missing right now, but I wanted to force myself to put something out there. A few things missing include:

- Figure out signing/notarizing Tauri apps 😅
- Support for more file types (only supports .csvs right now)
- Robust response handling - currently relying on model to print string or Plotly outputs from Pyodide
- Support function calling for Ollama
- Support multi-cell responses and markdown outputs
- Visualization edits (actually already there, but commented out because it's ugly right now)
- Persist chats and chat histories on local filesystem
- and so much more.

## Contributions

We welcome contributions! If you would like to see a feature or come across any issues (you will), please feel free to raise a PR.
