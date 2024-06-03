import { Box, HStack, Text, VStack, useColorModeValue } from "@chakra-ui/react";
import {
  DataEditor,
  GridCell,
  GridCellKind,
  getDefaultTheme,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import React from "react";
import TablePreviewErrorBoundary from "./TablePreviewErrorBoundary";
import { TableData } from "./store";

const lightTheme = getDefaultTheme();
const darkTheme = {
  accentColor: "#4F5DFF",
  accentFg: "#FFFFFF",
  accentLight: "rgba(62, 116, 253, 0.2)",
  baseFontStyle: "13px",
  bgBubble: "#313139",
  bgBubbleSelected: "#4F5DFF",
  bgCell: "#1B202B",
  bgCellMedium: "#2D2D2D",
  bgHeader: "#1B203F",
  bgHeaderHasFocus: "#1B3064",
  bgHeaderHovered: "#1B2057",
  bgIconHeader: "#4F5DFF",
  bgSearchResult: "#41414D",
  borderColor: "rgba(255, 255, 255, 0.16)",
  cellHorizontalPadding: 8,
  cellVerticalPadding: 3,
  drilldownBorder: "rgba(255, 255, 255, 0)",
  editorFontSize: "13px",
  fgIconHeader: "#FFFFFF",
  fontFamily:
    "Inter, Roboto, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Ubuntu, noto, arial, sans-serif",
  headerFontStyle: "600 13px",
  headerIconSize: 18,
  lineHeight: 1.4,
  linkColor: "#4F5DFF",
  markerFontStyle: "9px",
  textBubble: "#EDEDF3",
  textDark: "white",
  textGroupHeader: "#EDEDF3BB",
  textHeader: "#EDEDF3",
  textHeaderSelected: "white",
  textLight: "#32CD32",
  textMedium: "#9A9A9A",
};

const getColumns = (data: any) => {
  return Array.isArray(data) && data.length > 0
    ? data[0].map((col: string) => ({ title: col, id: col }))
    : [];
};

const getCellContent =
  (data: any) =>
  (cell: readonly [number, number]): GridCell => {
    const [colIndex, rowIndex] = cell;
    const rowData = data[rowIndex + 1];
    const value = rowData ? rowData[colIndex] : undefined;

    return {
      kind: GridCellKind.Text,
      data: value !== undefined ? value.toString() : "",
      displayData: value !== undefined ? value.toString() : "",
      allowOverlay: false,
      allowWrapping: true,
    };
  };

const DataTable: React.FC<{ tableData?: TableData[] }> = ({ tableData }) => {
  const defaultTheme = getDefaultTheme();
  const theme = useColorModeValue(lightTheme, darkTheme);

  return (
    <Box borderRadius="xl" width="100%" alignSelf="flex-end">
      <VStack gap={2}>
        {tableData &&
          tableData.map((table, index) => {
            try {
              if (!Array.isArray(table.data)) {
                throw new Error("Table data is not an array");
              }

              const columns = getColumns(table.data);
              if (columns.length === 0) {
                throw new Error("No valid columns found in table data");
              }

              const cellContent = getCellContent(table.data);

              return (
                <Box
                  key={index}
                  borderRadius="xl"
                  borderWidth={"1px"}
                  overflow={"hidden"}
                  alignSelf="flex-end"
                  width="100%"
                >
                  <HStack
                    justifyContent={"space-between"}
                    fontWeight="semibold"
                    bg={"var(--chakra-colors-chakra-body-bg)"}
                    p={3}
                    px={4}
                    width="100%"
                  >
                    <Text>{table.name}</Text>
                  </HStack>
                  <Box borderTopWidth={"1px"}>
                    <TablePreviewErrorBoundary
                      fallback={
                        <Box p={4} bg="red.50">
                          <Text
                            color="red.700"
                            fontSize="sm"
                            fontWeight={"500"}
                          >
                            Error loading table preview.
                          </Text>
                        </Box>
                      }
                    >
                      <DataEditor
                        getCellContent={cellContent}
                        columns={columns}
                        theme={theme}
                        rows={table.data.length - 1}
                        width="100%"
                        height="300px"
                        maxColumnWidth={100}
                        rowHeight={56}
                      />
                    </TablePreviewErrorBoundary>
                  </Box>
                  <HStack
                    justifyContent={"flex-end"}
                    borderTopWidth={"1px"}
                    p={2}
                    px={4}
                    width="100%"
                  >
                    <Text
                      fontSize="small"
                      fontWeight={"500"}
                      _light={{ color: "gray.600" }}
                      _dark={{ color: "gray.200" }}
                      color={"gray.600"}
                    >
                      Preview of {table.data.length} rows
                    </Text>
                  </HStack>
                </Box>
              );
            } catch (error: any) {
              console.error("Error processing table:", table.name, error);
              return (
                <Box
                  key={index}
                  borderRadius="xl"
                  borderWidth={"1px"}
                  overflow={"hidden"}
                  alignSelf="flex-end"
                  width="100%"
                >
                  <HStack
                    justifyContent={"space-between"}
                    fontWeight="semibold"
                    bg={"var(--chakra-colors-chakra-body-bg)"}
                    p={2.5}
                    px={4}
                    width="100%"
                  >
                    <Text>{table.name}</Text>
                  </HStack>
                  <Box borderTopWidth={"1px"} p={4} bg="red.100">
                    <Text color="red.700">
                      Error loading table: {error.message}
                    </Text>
                  </Box>
                </Box>
              );
            }
          })}
      </VStack>
    </Box>
  );
};

export default DataTable;
