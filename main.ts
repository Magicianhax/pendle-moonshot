// Static file server for Pendle Moonshot Calculator
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.208.0/http/file_server.ts";

const port = 8000;

console.log(`🚀 Pendle Moonshot Calculator server starting on port ${port}`);

await serve((req) => {
  const url = new URL(req.url);
  
  // Serve static files
  return serveDir(req, {
    fsRoot: ".",
    showDirListing: false,
    enableCors: true,
  });
}, { port });
