import type { Metadata } from "next";

import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { ErrorBoundaryWithAgUI } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "ClawPilot",
  description: "OpenClaw Canvas + AG-UI dashboard",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={"antialiased"}>
        <CopilotKit runtimeUrl="/api/copilotkit" agent="sample_agent">
          <ErrorBoundaryWithAgUI>{children}</ErrorBoundaryWithAgUI>
        </CopilotKit>
      </body>
    </html>
  );
}
