"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/context/auth-context";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <AuthProvider>
      <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
    </AuthProvider>
  );
}
