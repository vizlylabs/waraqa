"use client";

import { VStack } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import AssistantMessage from "./AssistantMessage";
import UserMessage from "./UserMessage";
import { WaraqaIcon } from "./icons";
import { useStore } from "./store";

const MessageList = () => {
  const { messages } = useStore();
  const messageListRef = useRef<HTMLDivElement>(null);

  console.log(messages);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <VStack
      ref={messageListRef}
      width="100%"
      height="100%"
      py={4}
      flexGrow={1}
      overflowY="auto"
      spacing={3}
      align="stretch"
      display="flex"
      flexDirection="column"
      alignItems={"center"}
      minWidth="0"
      position={"relative"}
    >
      {messages.length === 0 ? (
        <VStack
          position="absolute"
          top="40%"
          transform="translateY(-50%)"
          align="center"
        >
          <WaraqaIcon boxSize="56px" />
        </VStack>
      ) : (
        <VStack
          spacing={3}
          align="stretch"
          tabIndex={0}
          width="80%"
          maxWidth="800px"
        >
          {messages.map((message, index) =>
            message.role === "user" ? (
              <UserMessage
                key={index}
                content={message.content}
                tableData={message.tableData}
              />
            ) : (
              <AssistantMessage
                key={index}
                index={index}
                content={message.content}
                output={message.output}
              />
            )
          )}
        </VStack>
      )}
    </VStack>
  );
};

export default MessageList;
