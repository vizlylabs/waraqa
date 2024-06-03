"use client";

import { standaloneToast } from "@/Toast";
import {
  Box,
  HStack,
  IconButton,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/tauri";
import { ChangeEvent, useRef, useState } from "react";
import ResizeTextarea from "react-textarea-autosize";
import { read, utils } from "xlsx";
import { usePyodide } from "./PyodideContext";
import { AttachmentIcon, CloseIcon, SendIcon } from "./icons";
import { useStore } from "./store";
import { useModelSettingsStore } from "./useModelSettingsStore";

export const readFileContents = (
  file: File,
  lines: number = 100
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContents = e.target?.result as string;
      const linesArray = fileContents.split("\n").slice(0, lines);
      console.log(linesArray);
      resolve(linesArray.join("\n"));
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsText(file);
  });
};

export const getDataFrameInfo = async (
  csvData: string,
  pyodide: any
): Promise<string> => {
  const script = `
import pandas as pd
from io import StringIO

# Read CSV data
csv_data = """${csvData}"""
df = pd.read_csv(StringIO(csv_data))

# Function to get DataFrame info
def get_info(df):
    info = []
    for col in df.columns:
        dtype = df[col].dtype
        if pd.api.types.is_numeric_dtype(dtype):
            min_val = df[col].min()
            max_val = df[col].max()
            mean_val = df[col].mean()
            info.append(f"{col} ({dtype}) - min:{min_val}, max:{max_val}, mean:{mean_val:.2f}")
        else:
            unique_vals = ", ".join(df[col].astype(str).unique()[:3])
            info.append(f"{col} ({dtype}) - {unique_vals}")
    return "\\n".join(info)

# Get DataFrame info
df_info = get_info(df)
df_info
`;

  const infoOutput = await pyodide.runPythonAsync(script);
  return infoOutput;
};

export const runPythonCode = async (
  pyodide: any,
  code: string
): Promise<{ type: string; data: string }> => {
  if (!pyodide) {
    return {
      type: "error",
      data: "Pyodide is not loaded. Please re-open the app.",
    };
  }

  try {
    const wrappedCode = `
import sys
from io import StringIO
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import plotly.io as pio
import json

# Redirect stdout to capture prints
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()

# Function to capture DataFrame display as HTML
def capture_df_display(df):
    return df.to_html()

output = None
fig_json = None
local_scope = {}
try:
    exec("""${code
      .split("\n")
      .map((line) => line.trim())
      .join("\\n")}""", globals(), local_scope)
    if 'output' in local_scope and isinstance(local_scope['output'], pd.DataFrame):
        output = capture_df_display(local_scope['output'])
    else:
        # Capture the last variable in the scope
        last_var = list(local_scope.values())[-1] if local_scope else None
        if isinstance(last_var, pd.DataFrame):
            output = capture_df_display(last_var)
        elif isinstance(last_var, (str, int, float, list, dict)):
            output = json.dumps(last_var)
        else:
            output = mystdout.getvalue().strip()
    for var_name, var_value in local_scope.items():
        if isinstance(var_value, go.Figure):
            fig_json = pio.to_json(var_value)
            break
except Exception as e:
    output = str(e)

# Reset stdout
sys.stdout = old_stdout

(output, fig_json)
    `;
    console.log("The wrapped code:", wrappedCode);
    const [output, figJson] = await pyodide.runPythonAsync(wrappedCode);

    if (figJson) {
      return { type: "plotly", data: figJson };
    }

    return { type: "string", data: output };
  } catch (error: any) {
    return { type: "error", data: `Error: ${error.toString()}` };
  }
};

const readExcelFile = async (
  file: File,
  lines: number = 100
): Promise<{ name: string; data: any }[]> => {
  const fileContentArrayBuffer = await file.arrayBuffer();
  const fileContent = new Uint8Array(fileContentArrayBuffer);
  const workbook = read(fileContent, { type: "array" });
  return workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const tableData = utils.sheet_to_json(worksheet, { header: 1 });
    const limitedData = tableData.slice(0, lines); // Limit to 100 rows
    // TODO: Consider sheet name
    return { name: `${file.name}`, data: limitedData };
  });
};

const MessageInput = () => {
  const [value, setValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { messages, isWaitingForResponse, addMessage, addFileInfo, filesInfo } =
    useStore();
  const { pyodide } = usePyodide();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = async () => {
    const query = structuredClone(value);
    const uploadedFiles = structuredClone(selectedFiles);

    if (query.trim() === "") return;

    const modelProvider = useModelSettingsStore.getState().modelProvider;
    const openAIKey = useModelSettingsStore.getState().openAIKey;
    const ollamaPort = useModelSettingsStore.getState().ollamaPort;

    const endpoint = modelProvider === "openai" ? "ask_openai" : "ask_ollama";
    const apiKeyOrPort = modelProvider === "openai" ? openAIKey : ollamaPort;

    if (!apiKeyOrPort) {
      standaloneToast({
        title: "Error",
        description: `Please set your ${
          modelProvider === "openai" ? "OpenAI key" : "Ollama port"
        } in the model settings.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      return;
    }

    let tableDataArray: {
      name: string;
      data: any;
    }[] = [];

    // Read files and gather table data
    for (const file of uploadedFiles) {
      const tableData = await readExcelFile(file);
      tableDataArray = [...tableDataArray, ...tableData];
    }

    // Add message for instantaneous visual feedback
    addMessage({ role: "user", content: query, tableData: tableDataArray });

    // Clear the user input
    setValue("");
    setSelectedFiles([]);

    try {
      const filesInfoPayload = { ...filesInfo } as any;

      for (const file of uploadedFiles) {
        const fileName = file.name;
        const fileContentArrayBuffer = await file.arrayBuffer();
        const fileContent = new Uint8Array(fileContentArrayBuffer);

        // Mount the file into Pyodide's file system
        pyodide.FS.writeFile(fileName, fileContent);

        // Get the DataFrame info for the file
        const truncatedFileContents = await readFileContents(file);
        const dfInfo = await getDataFrameInfo(truncatedFileContents, pyodide);

        // Store the file info in the map
        filesInfoPayload[fileName] = dfInfo;
        addFileInfo({ name: fileName, info: dfInfo });
      }

      useStore.setState({ isWaitingForResponse: true });

      const response = await invoke<string>(endpoint, {
        question: query,
        csvData: JSON.stringify(filesInfoPayload),
        messages: JSON.stringify(messages),
        apiKeyOrPort: apiKeyOrPort,
      });

      const output = await runPythonCode(pyodide, response);

      useStore.setState({ isWaitingForResponse: false });

      addMessage({
        role: "assistant",
        content: response,
        output: output || "",
      });
    } catch (error: any) {
      console.error("Error with request:", error);
      useStore.setState({ isWaitingForResponse: false });

      standaloneToast({
        title: `Error with request: ${error.toString()}.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.stopPropagation();
      event.preventDefault();
      handleSubmit();
    } else if (event.key === "Escape") {
      if (textareaRef.current) textareaRef.current.blur();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files as FileList);
      const csvFiles = files.filter((file) => file.type === "text/csv");

      if (csvFiles.length !== files.length) {
        standaloneToast({
          title: "Invalid file type",
          description: "Only CSV files can currently be analyzed.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }

      setSelectedFiles((prevFiles) => [...prevFiles, ...csvFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  return (
    <VStack position="relative" bottom="0" width="100%" pb={4}>
      <VStack
        overflow="auto"
        tabIndex={0}
        borderWidth="1px"
        borderRadius="40px"
        width="80%"
        maxWidth="800px"
        spacing={0}
        alignItems="flex-start"
      >
        <HStack gap={2} alignItems="flex-end" width="100%">
          <IconButton
            aria-label="Attach file"
            variant="ghost"
            icon={<AttachmentIcon boxSize="24px" />}
            _hover={{ bg: "transparent" }}
            ml={2}
            isRound
            onClick={handleFileButtonClick}
            alignSelf="flex-end"
            mb={"0.5rem"}
          />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".csv,.xlsx"
            multiple
            onChange={handleFileChange}
          />
          <VStack
            flex="1"
            spacing={0}
            alignItems="flex-start"
            overflow="hidden"
          >
            {selectedFiles.length > 0 && (
              <HStack overflowX="auto" width="100%" p={0} pt={3}>
                {selectedFiles.length > 0 &&
                  selectedFiles.map((file, index) => (
                    <HStack
                      key={index}
                      borderWidth="1px"
                      borderRadius="xl"
                      padding={2}
                      spacing={1}
                      alignItems="center"
                      position="relative"
                      bg={"var(--chakra-colors-chakra-body-bg)"}
                      _hover={{ ".remove-btn": { display: "flex" } }}
                      whiteSpace="nowrap"
                    >
                      <Box
                        w="40px"
                        h="40px"
                        bg="green.400"
                        borderRadius={"lg"}
                      />
                      <Box py={0.5} px={2} maxWidth={"240px"}>
                        <Text isTruncated fontSize="sm">
                          {file.name}
                        </Text>
                        <Text isTruncated fontSize="xs" color="gray.500">
                          {file.type}
                        </Text>
                      </Box>
                      <IconButton
                        className="remove-btn"
                        aria-label="Remove file"
                        icon={<CloseIcon />}
                        size="xs"
                        variant={"solid"}
                        colorScheme="red"
                        isRound
                        position="absolute"
                        top="0"
                        right="0"
                        transform="translate(50%, -50%)"
                        display="none"
                        onClick={() => handleRemoveFile(index)}
                      />
                    </HStack>
                  ))}
              </HStack>
            )}
            <Textarea
              ref={textareaRef}
              id="question-textarea"
              onChange={handleChange}
              value={value}
              onKeyDown={handleKeyPress}
              boxShadow="none"
              outline="none"
              border="0px solid transparent"
              as={ResizeTextarea}
              py="1rem"
              pl="0"
              rows={1}
              autoFocus
              placeholder="What would you like to ask?"
              _dark={{
                _placeholder: { color: "gray.500" },
              }}
              flexGrow={1}
              minRows={1}
              maxRows={4}
              width="100%"
              resize="none"
              _focusVisible={{
                boxShadow: "none",
              }}
            />
          </VStack>
          <IconButton
            aria-label="Attach file"
            variant="ghost"
            icon={<SendIcon boxSize="18px" />}
            _hover={{ bg: "transparent" }}
            isLoading={isWaitingForResponse}
            mr={2}
            isRound
            onClick={handleSubmit}
            alignSelf="flex-end"
            mb={"0.4rem"}
          />
        </HStack>
      </VStack>
    </VStack>
  );
};

export default MessageInput;
