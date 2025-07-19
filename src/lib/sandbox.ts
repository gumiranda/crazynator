import { Sandbox } from '@e2b/code-interpreter';
import { AgentResult, TextMessage } from '@inngest/agent-kit';
import { SANDBOX_TIMEOUT_MS, SANDBOX_TEMPLATE } from '@/constants/sandbox';

export const createSandbox = async () => {
  const sandbox = await Sandbox.create(SANDBOX_TEMPLATE);
  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
  return sandbox;
};

export const getSandbox = async (sandboxId: string) => {
  const sandbox = await Sandbox.connect(sandboxId);
  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
  return sandbox;
};

export const getLastAssistantTextMessageContent = (result: AgentResult) => {
  const lastAssistantMessageIndex = result.output.findLastIndex(
    (message) => message.role === 'assistant',
  );

  const message = result.output[lastAssistantMessageIndex] as TextMessage | undefined;

  return message?.content
    ? typeof message.content === 'string'
      ? message.content
      : message.content.map((c) => c.text).join('')
    : undefined;
};

// Funções auxiliares para gerenciamento do sandbox
export const installPackage = async (sandbox: Sandbox, packageName: string, isDev = false) => {
  const command = `npm install ${packageName}${isDev ? ' --save-dev' : ''} --yes`;
  return await sandbox.commands.run(command);
};

export const uninstallPackage = async (sandbox: Sandbox, packageName: string) => {
  const command = `npm uninstall ${packageName}`;
  return await sandbox.commands.run(command);
};

export const getPackageJson = async (sandbox: Sandbox) => {
  try {
    const content = await sandbox.files.read('/home/user/package.json');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read package.json: ${error}`);
  }
};

export const updatePackageJson = async (sandbox: Sandbox, updates: Record<string, any>) => {
  try {
    const packageJson = await getPackageJson(sandbox);
    const updatedPackageJson = { ...packageJson, ...updates };
    await sandbox.files.write('/home/user/package.json', JSON.stringify(updatedPackageJson, null, 2));
    return updatedPackageJson;
  } catch (error) {
    throw new Error(`Failed to update package.json: ${error}`);
  }
};

export const readEnvFile = async (sandbox: Sandbox, envFileName = '.env') => {
  try {
    const content = await sandbox.files.read(`/home/user/${envFileName}`);
    return content;
  } catch (error) {
    // Arquivo não existe, retorna string vazia
    return '';
  }
};

export const updateEnvFile = async (sandbox: Sandbox, envVars: Record<string, string>, envFileName = '.env') => {
  try {
    const currentEnv = await readEnvFile(sandbox, envFileName);
    const envLines = currentEnv.split('\n').filter(line => line.trim() !== '');
    
    // Parse existing env vars
    const existingVars: Record<string, string> = {};
    envLines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        existingVars[key.trim()] = valueParts.join('=').trim();
      }
    });

    // Merge with new vars
    const mergedVars = { ...existingVars, ...envVars };
    
    // Convert back to .env format
    const newEnvContent = Object.entries(mergedVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    await sandbox.files.write(`/home/user/${envFileName}`, newEnvContent);
    return newEnvContent;
  } catch (error) {
    throw new Error(`Failed to update ${envFileName}: ${error}`);
  }
};

export const deleteEnvVar = async (sandbox: Sandbox, varName: string, envFileName = '.env') => {
  try {
    const currentEnv = await readEnvFile(sandbox, envFileName);
    const envLines = currentEnv.split('\n').filter(line => {
      const [key] = line.split('=');
      return key.trim() !== varName;
    });
    
    const newEnvContent = envLines.join('\n');
    await sandbox.files.write(`/home/user/${envFileName}`, newEnvContent);
    return newEnvContent;
  } catch (error) {
    throw new Error(`Failed to delete env var ${varName}: ${error}`);
  }
};

export const listFiles = async (sandbox: Sandbox, directory = '/home/user') => {
  try {
    const result = await sandbox.commands.run(`find ${directory} -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" | head -100`);
    return result.stdout.split('\n').filter(file => file.trim() !== '');
  } catch (error) {
    throw new Error(`Failed to list files: ${error}`);
  }
};

export const getDirectoryStructure = async (sandbox: Sandbox, directory = '/home/user') => {
  try {
    const result = await sandbox.commands.run(`tree ${directory} -I 'node_modules|.git|.next' -L 3`);
    return result.stdout;
  } catch (error) {
    // Fallback if tree is not available
    const result = await sandbox.commands.run(`find ${directory} -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" | head -50`);
    return result.stdout;
  }
};
