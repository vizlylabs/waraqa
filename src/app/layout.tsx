import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./cm-dark.css";
import "./cm-light.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vizly Labs",
  description: "A local app for lightweight data analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <script
          async
          src="https://cdn.jsdelivr.net/pyodide/v0.26.0/full/pyodide.js"
        ></script>
      </body>
    </html>
  );
}
