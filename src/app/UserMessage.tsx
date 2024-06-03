import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import DataTable from "./DataTable";
import { TableData } from "./store";

const UserMessage = ({
  content,
  tableData,
}: {
  content: string;
  tableData?: TableData[];
}) => {
  return (
    <VStack align="stretch">
      {tableData && tableData.length > 0 && (
        <Flex width="80%" alignSelf="flex-end">
          <DataTable tableData={tableData} />
        </Flex>
      )}
      <Box
        p={2.5}
        px={4}
        borderRadius="xl"
        borderTopRightRadius={"md"}
        borderWidth="1px"
        maxWidth="80%"
        alignSelf="flex-end"
        bg={{
          _light: "gray.500",
        }}
        _light={{
          bg: "blue.100",
        }}
        _dark={{
          bg: "blue.600",
        }}
      >
        <Text>{content}</Text>
      </Box>
    </VStack>
  );
};

export default UserMessage;
