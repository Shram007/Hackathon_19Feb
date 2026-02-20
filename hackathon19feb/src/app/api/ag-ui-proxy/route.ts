import { NextRequest, NextResponse } from "next/server";

const TARGET = process.env.VITE_OPENCLAW_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const target = `${TARGET}${url.pathname.replace("/api/ag-ui-proxy", "/ag-ui")}${url.search}`;
  const upstream = await fetch(target, {
    headers: req.headers,
    cache: "no-store",
  });
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const target = `${TARGET}${url.pathname.replace("/api/ag-ui-proxy", "/ag-ui")}${url.search}`;
  const upstream = await fetch(target, {
    method: "POST",
    headers: req.headers,
    body: req.body,
    cache: "no-store",
  });
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
