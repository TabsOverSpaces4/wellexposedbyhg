import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  if (!url.includes(".blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "No token configured" }, { status: 500 });
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: response.status }
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": response.headers.get("content-length") || "",
    },
  });
}
