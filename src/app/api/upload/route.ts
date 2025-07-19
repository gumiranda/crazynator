import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const extension = path.extname(file.name);
    const filename = `${randomUUID()}${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Return the file URL
    const fileUrl = `/uploads/${filename}`;
    
    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}