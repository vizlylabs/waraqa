import { createStandaloneToast } from "@chakra-ui/react";
import { theme as ChakraUITheme } from "@chakra-ui/theme";

export const { ToastContainer, toast } = createStandaloneToast({
  theme: ChakraUITheme,
});

const defaultOptions = {
  status: "loading",
  containerStyle: {
    fontFamily: "Space Grotesk",
    backgroundColor: "transparent",
    marginBottom: "var(--chakra-space-5)",
  },
  position: "bottom",
  isClosable: true,
};

export const standaloneToast = new Proxy(toast, {
  apply(target, thisArg, argumentsList) {
    // If options are provided, merge them with defaultOptions
    if (argumentsList.length > 0 && typeof argumentsList[0] === "object") {
      argumentsList[0] = { ...defaultOptions, ...argumentsList[0] };
    } else {
      // If no options provided, use defaultOptions
      argumentsList = [defaultOptions];
    }
    ``;

    return Reflect.apply(target, thisArg, argumentsList);
  },

  // Handle property access (like toast.close or toast.closeAll)
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver);
  },
});
