"use client";

import { ClawgUIProvider } from "@contextableai/clawg-ui";

export function ClawgUISetup({ children }) {
  return <ClawgUIProvider>{children}</ClawgUIProvider>;
}
