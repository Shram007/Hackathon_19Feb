"use client";

import React from "react";
import { useAgUI } from "ag-ui";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.emit = props.emit || null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (this.emit) {
      this.emit({
        type: "error",
        payload: {
          message: error?.message || "Unknown error",
          stack: error?.stack || info?.componentStack,
          component: "ErrorBoundary",
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-100">
          <h2 className="text-sm font-semibold">Something went wrong</h2>
          <p className="text-xs mt-1">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundaryWithAgUI({ children }) {
  const { emit } = useAgUI?.() || { emit: null };
  return <ErrorBoundary emit={emit}>{children}</ErrorBoundary>;
}
