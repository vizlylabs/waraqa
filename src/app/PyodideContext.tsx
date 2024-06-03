"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PyodideContextProps {
  pyodide: any;
  isLoading: boolean;
}

const PyodideContext = createContext<PyodideContextProps | undefined>(
  undefined
);

const PyodideProvider: React.FC<any> = ({ children }) => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPyodide = async (retryCount = 3) => {
    try {
      const pyodideInstance = await (window as any).loadPyodide();
      await pyodideInstance.loadPackage([
        "micropip",
        "pandas",
        "numpy",
        "matplotlib",
      ]);
      const micropip = pyodideInstance.pyimport("micropip");
      await micropip.install("plotly");
      await micropip.install("seaborn");

      setPyodide(pyodideInstance);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load Pyodide:", error);
      if (retryCount > 0) {
        console.log(
          `Retrying to load Pyodide... (${retryCount} attempts left)`
        );
        setTimeout(() => loadPyodide(retryCount - 1), 1000);
      } else {
        console.error("Failed to load Pyodide after multiple attempts.");
      }
    }
  };

  useEffect(() => {
    loadPyodide();
  }, []);

  return (
    <PyodideContext.Provider value={{ pyodide, isLoading }}>
      {children}
    </PyodideContext.Provider>
  );
};

const usePyodide = () => {
  const context = useContext(PyodideContext);
  if (context === undefined) {
    throw new Error("usePyodide must be used within a PyodideProvider");
  }
  return context;
};

export { PyodideProvider, usePyodide };
