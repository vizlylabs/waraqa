"use client";

import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ColorModeSwitcher";
import { usePyodide } from "./PyodideContext";
import {
  CircleIcon,
  OllamaIcon,
  OpenAIIcon,
  WaraqaIcon,
  WarningIcon,
} from "./icons";
import { useStore } from "./store";
import { useModelSettingsStore } from "./useModelSettingsStore";

const ModelSettings = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const modelProvider = useModelSettingsStore((state) => state.modelProvider);
  const openAIKey = useModelSettingsStore((state) => state.openAIKey);
  const ollamaPort = useModelSettingsStore((state) => state.ollamaPort);
  const { setOpenAIKey, setOllamaPort, setModelProvider } =
    useModelSettingsStore.getState();
  const [show, setShow] = useState(false);

  // Temporary state for form inputs
  const [tempApiKey, setTempApiKey] = useState("");
  const [tempModelProvider, setTempModelProvider] = useState("openai");

  const loadSettings = () => {
    const storedModelProvider = modelProvider;
    const storedApiKey =
      storedModelProvider === "ollama" ? ollamaPort : openAIKey || "";
    setTempModelProvider(storedModelProvider);
    setTempApiKey(storedApiKey as string);
    setShow(storedModelProvider === "ollama");
  };

  const saveSettings = () => {
    if (tempModelProvider === "openai") {
      setOpenAIKey(tempApiKey);
    } else {
      setOllamaPort(tempApiKey);
    }
    setModelProvider(tempModelProvider as "openai" | "ollama");
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleModelChange = (value: string) => {
    setTempModelProvider(value);
    setShow(value === "ollama");
    setTempApiKey(value === "ollama" ? ollamaPort || "" : openAIKey || "");
  };

  const handleClick = () => setShow(!show);

  const isMissingInfo = (provider: string, key: string | null) => {
    if (provider === "openai" && !key) return true;
    if (provider === "ollama" && !key) return true;
    return false;
  };

  return (
    <>
      <Button
        aria-label="Settings"
        size="sm"
        variant="ghost"
        leftIcon={modelProvider === "openai" ? <OpenAIIcon /> : <OllamaIcon />}
        rightIcon={
          isMissingInfo(
            modelProvider,
            modelProvider === "openai" ? openAIKey : ollamaPort
          ) ? (
            <Tooltip
              fontSize="xs"
              label={
                modelProvider === "openai"
                  ? "Please add your OpenAI API key or switch models."
                  : "Please target your Ollama port or switch models."
              }
              placement="top"
            >
              <WarningIcon
                boxSize="14px"
                _dark={{ color: "orange.400" }}
                _light={{ color: "orange.400" }}
              />
            </Tooltip>
          ) : undefined
        }
        onClick={onOpen}
      >
        {modelProvider === "openai" ? "OpenAI" : "Ollama"}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size={["sm", "md", "lg"]}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="model-provider" mb={6}>
              <FormLabel fontWeight="bold" fontSize="lg">
                Model Provider
              </FormLabel>
              <RadioGroup
                onChange={handleModelChange}
                value={tempModelProvider}
              >
                <HStack gap={4}>
                  <Radio value="openai">OpenAI</Radio>
                  <Radio value="ollama">Ollama</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
            <FormControl id="api-key">
              <FormLabel fontWeight="bold" fontSize="lg">
                {tempModelProvider === "openai"
                  ? "OpenAI API Key"
                  : "Ollama Port"}
              </FormLabel>
              <InputGroup>
                <Input
                  pr="4.5rem"
                  type={
                    tempModelProvider === "openai" && !show
                      ? "password"
                      : "text"
                  }
                  placeholder={
                    tempModelProvider === "openai"
                      ? "Enter your OpenAI API Key"
                      : "http://localhost:11434"
                  }
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                />
                {tempModelProvider === "openai" && (
                  <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={handleClick}>
                      {show ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                )}
              </InputGroup>
              {tempModelProvider === "openai" ? (
                <Text mt="4" fontSize="small" color="gray.500">
                  For more information about using OpenAI API, visit{" "}
                  <Text
                    cursor={"pointer"}
                    color="blue.500"
                    onClick={async () => {
                      await invoke("open_url", {
                        url: "https://platform.openai.com",
                      });
                    }}
                  >
                    https://platform.openai.com
                  </Text>
                </Text>
              ) : (
                <Text mt="4" fontSize="small" color="gray.500">
                  For more information about leveraging Ollama to use AI
                  locally, visit{" "}
                  <Text
                    cursor={"pointer"}
                    color="blue.500"
                    onClick={async () => {
                      await invoke("open_url", {
                        url: "https://github.com/ollama/ollama",
                      });
                    }}
                  >
                    https://github.com/ollama/ollama
                  </Text>
                </Text>
              )}
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <HStack width="100%" justifyContent="flex-end">
              <Button variant="ghost" colorScheme="red" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={saveSettings}>
                Save
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

const StatusIndicator = () => {
  const { isLoading } = usePyodide();

  return (
    <>
      <Tooltip
        fontSize="xs"
        label={
          isLoading
            ? "Preparing local analysis environment. Please wait or reopen the app if initialization takes too long."
            : "Local analysis environment is ready."
        }
      >
        <Button
          size="sm"
          variant={"ghost"}
          _hover={{ bg: "transparent" }}
          leftIcon={<CircleIcon boxSize="12px" color="green.500" />}
          isLoading={isLoading}
          loadingText="Preparing environment..."
          _loading={{
            _light: { color: "red.500" },
            _dark: { color: "red.300" },
          }}
        >
          Ready
        </Button>
      </Tooltip>
    </>
  );
};

const ClearConversation = () => {
  const clearConversation = useStore((state) => state.clearConversation);
  const messages = useStore((state) => state.messages);
  const { pyodide } = usePyodide();

  const handleClear = () => {
    clearConversation(pyodide);
  };

  return (
    <>
      {messages.length > 0 && (
        <Button
          onClick={handleClear}
          variant="ghost"
          colorScheme="red"
          size="sm"
        >
          Clear conversation
        </Button>
      )}
    </>
  );
};

function AppHeader() {
  return (
    <HStack
      width="100%"
      alignItems={"center"}
      flexShrink={0}
      zIndex="10"
      h="14"
      fontWeight="semibold"
      justifyContent={"space-between"}
      px={4}
      py={2}
    >
      <HStack width="100%" alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" gap="2" overflow="hidden">
          <Button
            className="group"
            cursor="pointer"
            rounded="xl"
            py="2"
            px="3"
            fontSize="lg"
            fontWeight="semibold"
            variant={"ghost"}
            _hover={{
              bg: "transparent",
            }}
            overflow="hidden"
            onClick={async () => {
              await invoke("open_url", { url: "https://waraqa.ai" });
            }}
            whiteSpace="nowrap"
          >
            <HStack gap={2}>
              <WaraqaIcon />
              <Text>Waraqa</Text>
            </HStack>
          </Button>
        </Flex>
        <Flex gap="2" alignItems="center">
          <ClearConversation />
          <StatusIndicator />
          <ModelSettings />
          <ThemeToggle size="sm" />
        </Flex>
      </HStack>
    </HStack>
  );
}

export default AppHeader;
