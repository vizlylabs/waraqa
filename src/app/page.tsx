import { ChakraProvider } from "@chakra-ui/react";
import AppErrorBoundary from "./AppErrorBoundary";
import AppHeader from "./AppHeader";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import { PyodideProvider } from "./PyodideContext";

export default function Home() {
  return (
    <ChakraProvider>
      <AppErrorBoundary>
        <PyodideProvider>
          <main
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100vh",
              gap: "1rem",
            }}
          >
            <AppHeader />
            <MessageList />
            <MessageInput />
          </main>
        </PyodideProvider>
      </AppErrorBoundary>
    </ChakraProvider>
  );
}
