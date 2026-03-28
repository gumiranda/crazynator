export interface SandboxConfig {
  timeout: number; // ms
  autoInstallDeps: boolean;
  nodeVersion: string;
  port: number;
  startCommand?: string;
}

export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  timeout: 10 * 60 * 1000, // 10 minutes
  autoInstallDeps: true,
  nodeVersion: '20',
  port: 3000,
};

export const SANDBOX_TIMEOUT_OPTIONS = [
  { label: '5 minutes', value: 5 * 60 * 1000 },
  { label: '10 minutes', value: 10 * 60 * 1000 },
  { label: '30 minutes', value: 30 * 60 * 1000 },
  { label: '1 hour', value: 60 * 60 * 1000 },
] as const;

export const NODE_VERSION_OPTIONS = ['18', '20', '22'] as const;
