"use client";

import { useEffect } from "react";

export default function ApiDocsPage() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        presets: [(window as any).SwaggerUIBundle.presets.apis],
        layout: "BaseLayout",
        deepLinking: true,
      });
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return <div id="swagger-ui" />;
}
