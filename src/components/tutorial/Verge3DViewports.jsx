import React, { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Verge3DViewports({
  isLoading,
  modelUrl = "",
  className = "",
  titles = {
    detail: "Detail View",
    primary: "Primary Model View",
  },
  punchFactor = 2.0, // how much to zoom-in the detail viewport compared to primary
}) {
  const primaryRef = useRef(null);
  const detailRef = useRef(null);
  const primaryReadyRef = useRef(false);

  // Build per-viewport app URL with role and optional punch factor
  const buildUrl = React.useCallback((role) => {
    const base = "/verge3d/CAD platform/CAD platform.html";
    const url = new URL(base, window.location.origin);
    if (modelUrl && modelUrl.trim()) {
      url.searchParams.set("load", modelUrl.trim());
    }
    url.searchParams.set("role", role);
    if (role === "detail" && punchFactor) {
      url.searchParams.set("punch", String(punchFactor));
    }
    return url.pathname + url.search;
  }, [modelUrl, punchFactor]);

  useEffect(() => {
    const onMessage = (event) => {
      const data = event?.data || {};
      if (data.type !== "cameraUpdate") return;

      const primaryWin = primaryRef.current?.contentWindow;
      const detailWin = detailRef.current?.contentWindow;
      if (!primaryWin || !detailWin) return;

      // Route updates between viewports:
      // - Primary drives Detail with punch-in
      // - Detail updates are ignored until we've received the first update from Primary
      try {
        if (event.source === primaryWin) {
          primaryReadyRef.current = true;
          detailWin.postMessage(
            {
              type: "setCamState",
              state: data.state,
              sourceId: data.sourceId,
              punchFactor,
            },
            "*"
          );
        } else if (event.source === detailWin) {
          if (!primaryReadyRef.current) return; // wait for primary to define the baseline
          primaryWin.postMessage(
            {
              type: "setCamState",
              state: data.state,
              sourceId: data.sourceId,
              punchFactor: 1.0,
            },
            "*"
          );
        }
      } catch {
        // Safely ignore routing errors
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [punchFactor]);

  const Frame = ({ title, iframeRef, role }) => (
    <Card className={`bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="flex-grow relative h-[400px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <iframe
            ref={iframeRef}
            title={`verge3d-${role}`}
            src={buildUrl(role)}
            className="w-full h-full"
            style={{ border: "0" }}
            allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer"
          />
        )}
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Frame title={titles.detail} iframeRef={detailRef} role="detail" />
      <Frame title={titles.primary} iframeRef={primaryRef} role="primary" />
    </div>
  );
}