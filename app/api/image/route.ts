import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  if (!url.includes(".blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!res.ok || !res.body) {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: res.status }
    );
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": res.headers.get("content-length") || "",
    },
  });
}
