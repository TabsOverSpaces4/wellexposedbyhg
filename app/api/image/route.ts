import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  if (!url.includes(".blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  try {
    // Use @vercel/blob head() to get a downloadUrl (works with both OIDC and token)
    const blobInfo = await head(url);
    const downloadUrl = blobInfo.downloadUrl;

    const res = await fetch(downloadUrl);

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
  } catch {
    // Fallback: try direct fetch with token if available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Cannot fetch blob" }, { status: 500 });
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
}
