import {
  Box,
  Circle,
  HStack,
  IconButton,
  Tooltip,
  VStack,
  useColorMode,
} from "@chakra-ui/react";
import { python } from "@codemirror/lang-python";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import ExecutionOutput from "./ExecutionOutput";
import { runPythonCode } from "./MessageInput";
import { usePyodide } from "./PyodideContext";
import { PlayIcon, WaraqaIcon } from "./icons";
import { jupyterTheme } from "./jupyterTheme";
import { useStore } from "./store";

interface AssistantMessageProps {
  content: string;
  output: any;
  index: number;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  output,
  index,
}) => {
  const [currentContent, setCurrentContent] = useState(content);
  const { pyodide } = usePyodide();
  const allExtensions = [python(), jupyterTheme];
  const { updateMessageOutput } = useStore();

  const { colorMode } = useColorMode();
  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === "dark") {
      root.classList.remove("cm-light");
      root.classList.add("cm-dark");
    } else {
      root.classList.remove("cm-dark");
      root.classList.add("cm-light");
    }
  }, [colorMode]);

  const handleRunCode = async () => {
    if (!pyodide) return;

    const output = await runPythonCode(pyodide, currentContent);
    console.log("The current content:", currentContent);
    console.log("The output:", output);
    console.log("The index:", index);

    updateMessageOutput(index, output);
  };

  return (
    <HStack gap={3} width="100%" alignItems="flex-start">
      <Circle flexShrink={0} size="36px" borderWidth="1px" overflow="hidden">
        <WaraqaIcon />
      </Circle>
      <VStack
        width="100%"
        borderRadius="xl"
        borderTopLeftRadius={"md"}
        borderWidth="1px"
        alignSelf="flex-start"
        alignItems={"flex-start"}
        overflow="hidden"
      >
        <HStack
          width="100%"
          justifyContent="flex-start"
          paddingTop={4}
          paddingLeft={4}
        >
          <Tooltip
            label="Execute code"
            fontSize="sm"
            hasArrow
            placement="right"
          >
            <IconButton
              aria-label="Run code"
              onClick={handleRunCode}
              size="sm"
              variant="ghost"
              icon={<PlayIcon />}
            />
          </Tooltip>
        </HStack>
        <CodeMirror
          style={{
            overflow: "auto",
            width: "100%",
            padding: "var(--chakra-space-4)",
            paddingTop: 0,
          }}
          value={currentContent}
          onChange={(value) => setCurrentContent(value)}
          extensions={allExtensions}
          basicSetup={{
            lineNumbers: true,
            tabSize: 4,
            foldGutter: false,
            highlightActiveLineGutter: true,
            highlightActiveLine: false,
          }}
        />
        <Box width="100%" borderTopWidth="1px" borderStyle="dashed" padding={4}>
          <ExecutionOutput output={output} />
        </Box>
      </VStack>
    </HStack>
  );
};

export default AssistantMessage;
