import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

// POST /api/uploads - Upload file to Vercel Blob
export async function POST(req: NextRequest) {
  console.log('📤 Upload API called');

  const session = await getServerSession(authOptions as any);
  if (!session?.user) {
    console.log('❌ Upload failed: Unauthorized');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log('📦 Parsing form data...');
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log('❌ No file in form data');
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`📁 File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      console.log(`❌ Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, SVG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log(`❌ File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("⚠️ BLOB_READ_WRITE_TOKEN not configured - using data URL fallback");

      // For small files, use data URL
      if (file.size < 100 * 1024) { // Less than 100KB
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        console.log('✅ Upload successful (data URL)');
        return NextResponse.json({
          url: dataUrl,
          message: "File uploaded (development mode - using data URL)"
        });
      } else {
        console.error('❌ File too large for data URL and no blob storage configured');
        return NextResponse.json(
          { error: "Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable." },
          { status: 500 }
        );
      }
    }

    // Upload to Vercel Blob
    console.log('☁️ Uploading to Vercel Blob...');
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    console.log(`✅ Upload successful: ${blob.url}`);
    return NextResponse.json({
      url: blob.url,
      message: "File uploaded successfully"
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error.message
      },
      { status: 500 }
    );
  }
}
