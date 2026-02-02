import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// POST /api/uploads - Upload file to Supabase Storage
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

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("⚠️ Supabase not configured - using data URL fallback");

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
        console.error('❌ File too large for data URL and Supabase not configured');
        return NextResponse.json(
          { error: "Supabase storage not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables." },
          { status: 500 }
        );
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;

    console.log(`☁️ Uploading to Supabase Storage: ${fileName}`);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(error.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    console.log(`✅ Upload successful: ${publicUrl}`);
    return NextResponse.json({
      url: publicUrl,
      message: "File uploaded successfully to Supabase"
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    console.error("Error details:", {
      message: error?.message || 'Unknown error',
      name: error?.name,
      stack: error?.stack,
      toString: error?.toString()
    });

    // Provide more detailed error message
    const errorMessage = error?.message || error?.toString() || 'Unknown upload error';

    return NextResponse.json(
      {
        error: "Failed to upload file",
        message: errorMessage,
        details: error?.code || error?.name || 'UPLOAD_ERROR',
        hint: (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
          ? "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables."
          : "Check server logs for more details. Ensure the 'uploads' bucket exists in Supabase Storage."
      },
      { status: 500 }
    );
  }
}
