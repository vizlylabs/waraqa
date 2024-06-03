import { IconButton, Tooltip, useColorMode } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "./icons";

export const ThemeToggle = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Tooltip
      fontSize="xs"
      label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
    >
      <IconButton
        icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        variant="ghost"
        aria-label="Toggle theme"
        size={size}
      />
    </Tooltip>
  );
};
