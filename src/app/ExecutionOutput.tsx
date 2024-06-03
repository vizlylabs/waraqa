import {
  Box,
  Button,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import React, { lazy, useEffect, useMemo, useRef, useState } from "react";

import { cloneDeep } from "lodash";
import { EditIcon } from "./icons";

import { invoke } from "@tauri-apps/api/tauri";
import dynamic from "next/dynamic";
import "react-chart-editor/lib/react-chart-editor.css";
const Plot = lazy(() => import("react-plotly.js"));

// @ts-ignore
const PlotlyEditor = dynamic(() => import("react-chart-editor"), {
  ssr: false,
});
// @ts-ignore
// const PlotlyEditor = lazy(() => import("react-chart-editor"));

const INITIAL_PLOTLY_HEIGHT = 480;

interface ExecutionOutputProps {
  output: string | { type: string; data: string };
}

const ExecutionOutput: React.FC<ExecutionOutputProps> = ({ output }) => {
  if (typeof output === "string") {
    if (output.startsWith("<table")) {
      return <Box dangerouslySetInnerHTML={{ __html: output }} />;
    }
    return <Text>{output}</Text>;
  }

  // Check if output is an object with a specific type
  if (typeof output === "object" && output.type === "plotly") {
    const config = JSON.parse(output.data);
    console.log("The parsed config:", config);
    return <PlotlyOutput plotlyConfig={config} />;
  }

  if (typeof output === "object" && output.type === "image") {
    return <img src={output.data} alt="Generated Output" />;
  }

  if (typeof output === "object" && output.type === "string") {
    // Handling string within object structure
    const stringOutput = output.data;
    console.log(stringOutput);
    // Check if the string is HTML (e.g., a table)
    if (stringOutput.startsWith("<table")) {
      return <Box dangerouslySetInnerHTML={{ __html: stringOutput }} />;
    }
    return <Text>{stringOutput}</Text>;
  }

  // If output type is unknown, return it stringified
  return JSON.stringify(output);
};

interface PlotlyOutputProps {
  plotlyConfig: { data: any; layout: any; frames: any; config: any };
}

const PlotlyOutput: React.FC<PlotlyOutputProps> = ({ plotlyConfig }) => {
  const plotlyRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [data, setData] = useState(plotlyConfig.data);
  const [layout, setLayout] = useState({
    ...plotlyConfig.layout,
    height: INITIAL_PLOTLY_HEIGHT,
  });
  const [config, setConfig] = useState(plotlyConfig.config);
  const [frames, setFrames] = useState(plotlyConfig.frames);

  const [prevData, setPrevData] = useState<any>(null);
  const [prevLayout, setPrevLayout] = useState<any>(null);
  const [prevFrames, setPrevFrames] = useState<any>(null);

  useEffect(() => {
    setData(plotlyConfig.data);
    setLayout({
      ...plotlyConfig.layout,
      height: INITIAL_PLOTLY_HEIGHT,
    });
    setConfig(plotlyConfig.config);
    setFrames(plotlyConfig.frames);
  }, [plotlyConfig]);

  const handleCancel = () => {
    setData(prevData);
    setLayout(prevLayout);
    setFrames(prevFrames);
    onClose();
  };

  const handleEdit = () => {
    setPrevData(cloneDeep(data));
    setPrevLayout(cloneDeep(layout));
    setPrevFrames(cloneDeep(frames));
    onOpen();
  };

  const handleUpdate = (data: any, layout: any, frames: any) => {
    setData(data);
    setLayout(layout);
    setFrames(frames);
  };

  const handleSave = () => {
    console.log("Saving!");
    console.log(data, layout, config, frames);
    onClose();
  };

  const createDataSources = (data: any[], template: any) => {
    let output: { [key: string]: any } = {};

    data.forEach((item: any, index: number) => {
      // Get the trace name from the item, default to 'Trace' if it doesn't exist
      const traceName = item.name ? item.name : `Trace${index + 1}`;

      // Create unique keys for x and y values
      const xKey = `${traceName}_x`;
      const yKey = `${traceName}_y`;

      // Assign x and y values to the corresponding keys
      output[xKey] = item.x;
      output[yKey] = item.y;

      // Check if there is a z field in the item
      if (item.z) {
        const zKey = `${traceName}_z`;
        output[zKey] = item.z;
      }
    });

    return output;
  };

  const dataSourcesRef = useRef<{
    [key: string]: any;
  }>();

  const dataSourceOptionsRef = useRef<{ value: string; label: string }[]>();

  const dataSources = useMemo(() => {
    if (!isOpen) {
      try {
        dataSourcesRef.current = createDataSources(data, layout);
      } catch (error) {
        console.error(error);
      }
    }
    return dataSourcesRef.current || [];
  }, [data, layout, isOpen]);

  const dataSourceOptions = useMemo(() => {
    if (!isOpen) {
      dataSourceOptionsRef.current = Object.keys(dataSources).map((name) => ({
        value: name,
        label: name,
      }));
    }
    return dataSourceOptionsRef.current || [];
  }, [dataSources, isOpen]);

  return (
    <VStack>
      <HStack width={"100%"} justifyContent="flex-start">
        <Tooltip label="Edit chart" fontSize="sm" hasArrow placement="right">
          <IconButton
            aria-label="Edit chart"
            size="sm"
            variant="ghost"
            icon={<EditIcon />}
            onClick={handleEdit}
          />
        </Tooltip>
      </HStack>
      <Plot
        ref={plotlyRef}
        style={{
          width: "100%",
          borderRadius: "var(--chakra-radii-md)",
          overflow: "hidden",
        }}
        data={data}
        layout={layout}
        useResizeHandler
      />
      <Modal isOpen={isOpen} onClose={handleCancel} size={["full"]}>
        <ModalOverlay />
        <ModalContent
          borderRadius={"2xl"}
          mx="auto"
          my="auto"
          boxShadow={"xl"}
          minWidth="0px"
          p="2"
          maxWidth={"85%"}
          minHeight="85%"
          height="85%"
          overflow={"auto"}
        >
          <ModalHeader>Edit chart</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="lg">
              Editing functionality is coming very soon!
            </Text>
            <Text
              mt="2"
              cursor={"pointer"}
              fontSize={"sm"}
              color="blue.500"
              onClick={async () => {
                await invoke("open_url", {
                  url: "https://github.com/vizlylabs/waraqa",
                });
              }}
            >
              Follow updates on GitHub
            </Text>
            {/* <PlotlyEditor
              data={data}
              dataSources={dataSources}
              dataSourceOptions={dataSourceOptions}
              layout={layout}
              config={{}}
              frames={frames}
              onUpdate={handleUpdate}
              plotly={Plotly}
              advancedTraceTypeSelector
            /> */}
          </ModalBody>
          <ModalFooter>
            <HStack width="100%" justifyContent="flex-end">
              <Button variant="ghost" colorScheme="red" onClick={handleCancel}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSave}>
                Save
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ExecutionOutput;
