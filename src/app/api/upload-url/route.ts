import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { r2Client } from '@/lib/r2';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o bucket está configurado
    if (!BUCKET_NAME) {
      console.error('CLOUDFLARE_R2_BUCKET_NAME não está configurado');
      return NextResponse.json({ error: 'Storage configuration error' }, { status: 500 });
    }

    const body = await req.json();
    const { filename, contentType, size } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ 
        error: 'Filename and content type are required' 
      }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only images are allowed.' 
      }, { status: 400 });
    }

    // Validar tamanho do arquivo
    if (size && size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Gerar nome único para o arquivo
    const extension = filename.split('.').pop() || '';
    const fileName = `${randomUUID()}.${extension}`;
    const key = `images/${fileName}`;

    // Criar comando para upload
    const putObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
      Metadata: {
        originalName: filename,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Gerar URL presignada válida por 1 hora
    const signedUrl = await getSignedUrl(r2Client, putObjectCommand, {
      expiresIn: 3600, // 1 hora
    });

    return NextResponse.json({
      success: true,
      uploadUrl: signedUrl,
      key: key,
      fileUrl: `/api/files/${key}`,
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}