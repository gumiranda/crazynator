import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
const JSZip = require('jszip');
import type { FileCollection } from '@/types/files';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    const { projectId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the project with all its messages and fragments
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        userId, // Ensure user owns the project
      },
      include: {
        messages: {
          include: {
            fragment: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create a new ZIP file
    const zip = new JSZip();

    // Add a README with project info
    const readme = `# ${project.name}

Este projeto foi gerado em ${project.createdAt.toLocaleDateString('pt-BR')} usando Crazy Code.

## Estrutura do Projeto

Este ZIP contém todos os fragmentos de código gerados durante o desenvolvimento do projeto.
Cada fragmento representa uma iteração ou versão específica dos arquivos.

## Como usar

1. Extraia o conteúdo deste ZIP
2. Navegue pelos fragmentos para ver a evolução do código
3. Utilize os arquivos mais recentes para continuar o desenvolvimento

---
Gerado automaticamente pelo Crazy Code
`;

    zip.file('README.md', readme);

    // Process each fragment
    let fragmentIndex = 1;
    for (const message of project.messages) {
      if (message.fragment && message.fragment.files) {
        const files = message.fragment.files as FileCollection;
        const fragmentTitle = message.fragment.title || `Fragment ${fragmentIndex}`;
        
        // Create a folder for this fragment
        const folderName = `fragment-${fragmentIndex.toString().padStart(2, '0')}-${fragmentTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
        const fragmentFolder = zip.folder(folderName);
        
        if (fragmentFolder) {
          // Add fragment info
          const fragmentInfo = `# ${fragmentTitle}

Criado em: ${message.fragment.createdAt.toLocaleDateString('pt-BR')}
Atualizado em: ${message.fragment.updatedAt.toLocaleDateString('pt-BR')}

## Arquivos inclusos

${Object.keys(files).map(filePath => `- ${filePath}`).join('\n')}

## Sandbox URL

${message.fragment.sandboxUrl}
`;
          
          fragmentFolder.file('_fragment-info.md', fragmentInfo);
          
          // Add all files from this fragment
          Object.entries(files).forEach(([filePath, content]) => {
            // Ensure we don't overwrite existing files by creating unique paths
            fragmentFolder.file(filePath, content);
          });
        }
        
        fragmentIndex++;
      }
    }

    // If there are fragments, also create a "latest" folder with the most recent files
    const latestFragment = project.messages
      .filter(m => m.fragment)
      .pop()?.fragment;
      
    if (latestFragment && latestFragment.files) {
      const files = latestFragment.files as FileCollection;
      const latestFolder = zip.folder('latest');
      
      if (latestFolder) {
        Object.entries(files).forEach(([filePath, content]) => {
          latestFolder.file(filePath, content);
        });
      }
    }

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9,
      },
    });

    // Create filename with project name and timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${timestamp}.zip`;

    // Return the ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error creating project ZIP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}