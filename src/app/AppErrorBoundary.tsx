"use client";

import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/tauri";
import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="100vh"
          textAlign="center"
          p={4}
        >
          <VStack spacing={4}>
            <Text fontSize="2xl" fontWeight="bold">
              Apologies, something went wrong.
            </Text>
            <Text>
              Please reopen the app. If the issue persists, please reach out on
              our GitHub page.
            </Text>
            <Button
              cursor="pointer"
              onClick={async () => {
                await invoke("open_url", {
                  url: "https://github.com/vizlylabs/waraqa",
                });
              }}
              colorScheme="teal"
            >
              Go to GitHub
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
