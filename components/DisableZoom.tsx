"use client"; // important for hooks

import { useEffect } from "react";

export default function DisableZoom() {
  useEffect(() => {
    const preventZoomKeys = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();
      }
    };

    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };

    window.addEventListener("keydown", preventZoomKeys, { passive: false });
    window.addEventListener("wheel", preventWheelZoom, { passive: false });

    return () => {
      window.removeEventListener("keydown", preventZoomKeys);
      window.removeEventListener("wheel", preventWheelZoom);
    };
  }, []);

  return null; // nothing to render
}
