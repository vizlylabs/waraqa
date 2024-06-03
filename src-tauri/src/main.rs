
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::json;
use serde::{Deserialize, Serialize};
use async_openai::{
  types::{
    ChatCompletionFunctionsArgs, ChatCompletionRequestMessage, ChatCompletionRequestAssistantMessageArgs, ChatCompletionRequestSystemMessageArgs,
    ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs, 
  },
  Client,
  config::OpenAIConfig,
};
use reqwest::Client as HttpClient;
use tauri::{generate_context, generate_handler};
use std::process::Command;

#[derive(Serialize, Deserialize)]
struct OpenAIRequest {
    question: String,
    csv_data: String,
    api_key_or_port: String,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "role", rename_all = "snake_case")]
enum CustomChatCompletionRequestMessage {
    System { content: String },
    User { content: String },
    Assistant { content: String },
}

fn sanitize_string(input: &str) -> String {
    input.chars().filter(|&c| !c.is_control()).collect()
}

#[tauri::command]
fn open_url(url: String) {
    if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(&["/C", "start", url.as_str()])
            .spawn()
            .expect("Failed to open URL");
    } else if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(url.as_str())
            .spawn()
            .expect("Failed to open URL");
    } else if cfg!(target_os = "linux") {
        Command::new("xdg-open")
            .arg(url.as_str())
            .spawn()
            .expect("Failed to open URL");
    }
}

#[tauri::command]
async fn ask_openai(api_key_or_port: String, question: String, csv_data: String, messages: String) -> Result<String, String> {
    let openai_api_key = api_key_or_port;
    let config = async_openai::config::OpenAIConfig::new().with_api_key(openai_api_key);

    let client = Client::with_config(config);

    let parsed_messages: Vec<CustomChatCompletionRequestMessage> = serde_json::from_str(&messages).map_err(|e| e.to_string())?;

    // Convert CustomChatCompletionRequestMessage to ChatCompletionRequestMessage
    let mut messages_array: Vec<ChatCompletionRequestMessage> = parsed_messages.into_iter().map(|msg| {
        match msg {
            CustomChatCompletionRequestMessage::System { content } => {
                ChatCompletionRequestMessage::System(ChatCompletionRequestSystemMessageArgs::default().content(content).build().unwrap())
            }
            CustomChatCompletionRequestMessage::User { content } => {
                ChatCompletionRequestMessage::User(ChatCompletionRequestUserMessageArgs::default().content(content).build().unwrap())
            }
            CustomChatCompletionRequestMessage::Assistant { content } => {
                ChatCompletionRequestMessage::Assistant(ChatCompletionRequestAssistantMessageArgs::default().content(content).build().unwrap())
            }
        }
    }).collect();

    let system_message = format!(
        r#"
        You are Waraqa, an AI developed by Vizly Labs. You are an expert data scientist that generates Python code to answer users' data questions.
        - The code you generate will be executed in a Pyodide environment. You can use libraries like `pandas`, `numpy`, `matplotlib`, and `plotly` for your analysis.
        
        The instructions you MUST respect:
        - Only return valid Python code snippets in a string format.
        - If files exist, load them in from the current directory like pd.read_csv('file.csv'). If no files exist, try to answer the question with sample data. If the question is not data-related, answer conversationally.
        - Include detailed comments in the code you produce.
        - If provided a data or visualization question, you always try to answer in a visualization. You use Plotly to answer all visualization queries.
        - If the question is not data-related or cannot be answered with a visualization, answer conversationally. If a question is not related to previous messages, treat it as a new conversation - do NOT just copy previous responses.
        - If you want to respond to the user with a message, you MUST use a print statement.
        
        The data you will be analyzing is the following. This map includes the file name as the key and df.info() on a truncated subset of the file as the value. Leverage these qualities of the dataset to answer the user's questions.
{:?}"#,
        csv_data
    );

    // Add a system message that references the csv_data
    messages_array.insert(0, ChatCompletionRequestMessage::System(
    ChatCompletionRequestSystemMessageArgs::default()
            .content(system_message)
            .build()
            .map_err(|e| e.to_string())?
    ));

    // Add the new user message
    messages_array.push(
        ChatCompletionRequestMessage::User(ChatCompletionRequestUserMessageArgs::default()
            .content(question)
            .build()
            .map_err(|e| e.to_string())?)
    );

    let messages_json = serde_json::to_string_pretty(&messages_array).map_err(|e| e.to_string())?;
    // println!("{:?}", messages_json);

    let request = CreateChatCompletionRequestArgs::default()
        .model("gpt-4o")
        .messages(messages_array)
        .functions([ChatCompletionFunctionsArgs::default()
            .name("get_python_code")
            .description("The function to call to generate a Python code cell.")
            .parameters(json!({
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "JSON formatted string of Python source code to execute.",
                    },
                },
                "required": ["code"],
            }))
            .build().map_err(|e| e.to_string())?])
        .function_call("get_python_code")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client.chat().create(request).await.map_err(|e| e.to_string())?;
    let response_json = serde_json::to_string_pretty(&response).map_err(|e| e.to_string())?;

    // println!("This is what it looks like: {:?}", response_json);

    let response_message = response.choices.get(0).ok_or("No choices in the response")?.message.clone();

    if let Some(function_call) = response_message.function_call {
        println!("Function call arguments: {:?}", function_call.arguments);
        let sanitized_args = sanitize_string(&function_call.arguments);
        let function_args: serde_json::Value = match serde_json::from_str(&sanitized_args) {
            Ok(args) => args,
            Err(err) => {
                println!("Failed to parse function call arguments: {}", err);
                return Err(format!("Failed to parse function call arguments: {}", err));
            }
        };
        let code = function_args["code"].as_str().ok_or("No code found in function call arguments")?;
        return Ok(code.to_string());
    } else {
        return Err("No function call in the response.".to_string());
    }
}
#[derive(Serialize, Deserialize)]
struct OllamaRequestMessage {
    role: String,
    content: String,
}

#[derive(Serialize, Deserialize)]
struct OllamaRequest {
    model: String,
    messages: Vec<OllamaRequestMessage>,
    stream: bool,
    format: String,
}

#[derive(Serialize, Deserialize)]
struct OllamaResponseMessage {
    role: String,
    content: String,
}

#[derive(Serialize, Deserialize)]
struct OllamaResponse {
    model: String,
    created_at: String,
    message: OllamaResponseMessage,
    done: bool,
    total_duration: Option<u64>,
    load_duration: Option<u64>,
    prompt_eval_count: Option<u64>,
    prompt_eval_duration: Option<u64>,
    eval_count: Option<u64>,
    eval_duration: Option<u64>,
}

#[tauri::command]
async fn ask_ollama(question: String, csv_data: String, messages: String, api_key_or_port: String) -> Result<String, String> {
    let client = HttpClient::new();
    let mut messages: Vec<OllamaRequestMessage> = serde_json::from_str(&messages).map_err(|e| format!("Failed to parse messages: {}", e))?;

    let system_message = format!(
        r#"
        You are Waraqa, an AI developed by Vizly Labs. You are an expert data scientist that generates Python code to answer users' data questions.
        - The code you generate will be executed in a Pyodide environment. You can use libraries like `pandas`, `numpy`, `matplotlib`, and `plotly` for your analysis.
        
        The instructions you MUST respect:
        - You MUST respond in a JSON that contains the "code" key with the response - written in Python code - as its value. ALWAYS include the 'code' key and ALWAYS have a value for it.
        - If files exist, load them in from the current directory like pd.read_csv('file.csv'). If no files exist, try to answer the question with sample data. If the question is not data-related, answer conversationally.
        - Include detailed comments in the code you produce.
        - If provided a data or visualization question, you always try to answer in a visualization. You use Plotly to answer all visualization queries.
        - If the question is not data-related or cannot be answered with a visualization, answer conversationally. If a question is not related to previous messages, treat it as a new conversation - do NOT just copy previous responses.
        - If you want to respond to the user with a message, you MUST use a print statement.
        
        The data you will be analyzing is the following. This map includes the file name as the key and df.info() on a truncated subset of the file as the value. Leverage these qualities of the dataset to answer the user's questions.
{:?}"#,
        csv_data
    );

    let messages_json = serde_json::to_string_pretty(&messages).map_err(|e| format!("Failed to serialize messages: {}", e))?;
    println!("The list of messages: {:?}", messages_json);

    messages.insert(0, OllamaRequestMessage {
        role: "system".to_string(),
        content: system_message,
    });

    let request = OllamaRequest {
        model: "llama3".to_string(),
        format: "json".to_string(),
        messages: messages,
        stream: false,
    };
    
    let response = client.post(&format!("{}/api/chat", api_key_or_port))
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?
        .json::<OllamaResponse>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let response_json = serde_json::to_string_pretty(&response).map_err(|e| e.to_string())?;
    println!("Response: {:?}", response_json);

    // Extract the "code" key from the response
    let code = response.message.content.parse::<serde_json::Value>()
        .map_err(|e| format!("Failed to parse JSON: {}", e))
        .and_then(|json| {
            json.get("code")
                .and_then(|code| code.as_str().map(|s| s.to_string()))
                .ok_or_else(|| "An error occurred - could not generate a response".to_string())
        })?;

    Ok(code)
}


fn main() {
    tauri::Builder::default()
        .invoke_handler(generate_handler![ask_openai, ask_ollama, open_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}