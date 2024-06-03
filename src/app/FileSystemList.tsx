"use client";

import { Box, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { usePyodide } from "./PyodideContext";

const listPyodideFiles = async (pyodide: any): Promise<string[]> => {
  if (!pyodide) {
    return [];
  }

  try {
    const files = await pyodide.runPythonAsync(`
  import os
  files = os.listdir()
  files
      `);
    return files;
  } catch (error) {
    console.error("Error listing files:", error);
    return [];
  }
};

const FileSystemList = () => {
  const { pyodide } = usePyodide();
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      const fileList = await listPyodideFiles(pyodide);
      setFiles(fileList);
    };

    fetchFiles();

    const interval = setInterval(fetchFiles, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [pyodide]);

  return (
    <Box p={4} width="100%">
      <VStack align="stretch" spacing={2}>
        <Text fontSize="lg" fontWeight="bold">
          Files in Pyodide Filesystem:
        </Text>
        {files.length > 0 ? (
          files.map((file, index) => (
            <Box key={index} p={2} bg="gray.100" borderRadius="md">
              {file}
            </Box>
          ))
        ) : (
          <Text>No files found.</Text>
        )}
      </VStack>
    </Box>
  );
};

export default FileSystemList;
