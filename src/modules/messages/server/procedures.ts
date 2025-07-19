import { protectedProcedure, createTRPCRouter } from '@/trpc/init';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';
import { TRPCError } from '@trpc/server';
import { consumeCredits } from '@/lib/usage';

export const messagesRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: 'Project is required' }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const messages = await prisma.message.findMany({
        orderBy: {
          updatedAt: 'asc',
        },
        include: {
          fragment: true,
        },
        where: {
          projectId: input.projectId,
          project: {
            userId: ctx.auth.userId,
          },
        },
      });
      return messages;
    }),
  enhance: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1, { message: 'Prompt is required' }),
        projectId: z.string().min(1, { message: 'Project is required' }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Prompt para melhorar o prompt do usuário
      const enhancementPrompt = `You are an expert prompt engineer. Your task is to enhance and improve the following user prompt to make it more clear, specific, and effective for a code development assistant.

Original prompt: "${input.prompt}"

Please improve this prompt by:
1. Making it more specific and clear
2. Adding relevant context if needed
3. Structuring it better for better AI understanding
4. Maintaining the original intent
5. Keep it concise but comprehensive

Return only the improved prompt without any explanations or additional text.`;

      try {
        // Aqui você pode integrar com a API da OpenAI ou Claude
        // Por agora, vou simular uma resposta aprimorada
        const enhancedPrompt = await simulatePromptEnhancement(input.prompt);
        
        return {
          originalPrompt: input.prompt,
          enhancedPrompt,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to enhance prompt',
        });
      }
    }),
  create: protectedProcedure
    .input(
      z.object({
        value: z.string().min(1, { message: 'Message is required' }),
        projectId: z.string().min(1, { message: 'Project is required' }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }
      try {
        await consumeCredits();
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Something went wrong',
          });
        } else {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'You have no credits left',
          });
        }
      }
      const createdMessage = await prisma.message.create({
        data: {
          content: input.value,
          role: 'USER',
          type: 'RESULT',
          projectId: project.id,
        },
      });
      await inngest.send({
        name: 'code-agent/run',
        data: {
          value: input.value,
          projectId: project.id,
        },
      });
      return createdMessage;
    }),
});

// Função auxiliar para simular o aprimoramento do prompt
async function simulatePromptEnhancement(originalPrompt: string): Promise<string> {
  // Aguardar um pouco para simular processamento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Padrões de aprimoramento mais sofisticados
  const enhancements = {
    // Padrões específicos de desenvolvimento
    patterns: [
      {
        keywords: ['bug', 'error', 'fix', 'problema', 'erro'],
        template: (prompt: string) => `Analise o código e identifique bugs ou problemas. Contexto: "${prompt}". Por favor:
1. Identifique especificamente quais são os problemas
2. Explique o que está causando cada erro
3. Forneça soluções detalhadas com exemplos de código
4. Sugira melhores práticas para evitar problemas similares no futuro`
      },
      {
        keywords: ['test', 'teste', 'testing'],
        template: (prompt: string) => `Crie testes abrangentes para o código. Contexto: "${prompt}". Por favor:
1. Desenvolva testes unitários completos
2. Inclua casos extremos e cenários de erro  
3. Use frameworks de teste apropriados
4. Garanta boa cobertura de testes
5. Documente o que cada teste verifica`
      },
      {
        keywords: ['optimize', 'performance', 'otimizar', 'performance'],
        template: (prompt: string) => `Otimize o código para melhor performance. Contexto: "${prompt}". Por favor:
1. Analise gargalos de performance
2. Identifique pontos de melhoria
3. Sugira otimizações específicas
4. Forneça código otimizado com explicações
5. Compare o antes e depois em termos de eficiência`
      },
      {
        keywords: ['refactor', 'clean', 'refatorar', 'limpar'],
        template: (prompt: string) => `Refatore o código seguindo melhores práticas. Contexto: "${prompt}". Por favor:
1. Melhore a legibilidade e organização
2. Aplique princípios SOLID
3. Elimine código duplicado
4. Simplifique lógica complexa
5. Mantenha a funcionalidade original intacta`
      },
      {
        keywords: ['document', 'documentation', 'documentar', 'doc'],
        template: (prompt: string) => `Adicione documentação completa ao código. Contexto: "${prompt}". Por favor:
1. Crie comentários JSDoc detalhados
2. Documente parâmetros, retornos e exceções
3. Adicione exemplos de uso
4. Explique lógica complexa
5. Inclua diagramas se necessário`
      },
      {
        keywords: ['api', 'endpoint', 'route', 'router'],
        template: (prompt: string) => `Desenvolva APIs/endpoints robustos. Contexto: "${prompt}". Por favor:
1. Defina estrutura clara da API
2. Implemente validação de dados
3. Adicione tratamento de erros apropriado
4. Inclua autenticação/autorização se necessário
5. Documente endpoints com exemplos`
      },
      {
        keywords: ['type', 'typescript', 'tipos'],
        template: (prompt: string) => `Adicione tipagem TypeScript robusta. Contexto: "${prompt}". Por favor:
1. Defina interfaces e tipos precisos
2. Use generics quando apropriado
3. Implemente type guards se necessário
4. Garanta type safety completo
5. Documente tipos complexos`
      }
    ]
  };

  const lowerPrompt = originalPrompt.toLowerCase();
  
  // Buscar padrão correspondente
  for (const pattern of enhancements.patterns) {
    if (pattern.keywords.some(keyword => lowerPrompt.includes(keyword))) {
      return pattern.template(originalPrompt);
    }
  }

  // Aprimoramento genérico mais sofisticado
  if (originalPrompt.length < 20) {
    return `Desenvolva uma solução completa para: "${originalPrompt}". Por favor:
1. Forneça uma explicação detalhada do problema/tarefa
2. Implemente uma solução robusta com código de exemplo
3. Inclua tratamento de erros e casos extremos
4. Adicione comentários explicativos
5. Sugira melhorias e otimizações possíveis`;
  } else {
    return `${originalPrompt}

Detalhes adicionais solicitados:
- Forneça explicações passo a passo
- Inclua exemplos de código quando aplicável
- Considere melhores práticas de desenvolvimento
- Adicione tratamento de erros apropriado
- Sugira alternativas e melhorias quando relevante`;
  }
}
