import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";

async function streamBlob(url: string): Promise<NextResponse> {
  // Method 1: direct fetch with read-write token
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });
    if (res.ok && res.body) {
      return new NextResponse(res.body, {
        headers: {
          "Content-Type": res.headers.get("content-type") || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": res.headers.get("content-length") || "",
        },
      });
    }
  }

  // Method 2: use head() to get signed downloadUrl (works with OIDC on Vercel)
  const blobInfo = await head(url);
  const res = await fetch(blobInfo.downloadUrl, {
    headers: process.env.BLOB_READ_WRITE_TOKEN
      ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
      : {},
  });

  if (!res.ok || !res.body) {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: res.status }
    );
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": res.headers.get("content-length") || "",
    },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  if (!url.includes(".blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  try {
    return await streamBlob(url);
  } catch (err) {
    console.error("[image proxy]", err);
    return NextResponse.json({ error: "Cannot fetch blob" }, { status: 500 });
  }
}
