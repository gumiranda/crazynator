import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2';

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    if (!BUCKET_NAME) {
      return NextResponse.json({ error: 'Storage configuration error' }, { status: 500 });
    }

    // Reconstituir a key do arquivo a partir dos parâmetros da URL
    const key = params.key.join('/');

    if (!key) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    // Buscar o arquivo no R2
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(getObjectCommand);

    if (!response.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Converter o stream para buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);

    // Retornar o arquivo com os headers apropriados
    const headers = new Headers();
    
    if (response.ContentType) {
      headers.set('Content-Type', response.ContentType);
    }
    
    if (response.ContentLength) {
      headers.set('Content-Length', response.ContentLength.toString());
    }

    if (response.ETag) {
      headers.set('ETag', response.ETag);
    }

    if (response.LastModified) {
      headers.set('Last-Modified', response.LastModified.toUTCString());
    }

    // Headers de cache
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    return new NextResponse(buffer, { headers });

  } catch (error: any) {
    console.error('Error serving file from R2:', error);
    
    if (error.name === 'NoSuchKey') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}