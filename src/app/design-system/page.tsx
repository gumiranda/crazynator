import { DesignSystemManager } from '@/components/design-system-manager'
import { DesignSystemProvider } from '@/components/design-system-provider'

export default function DesignSystemPage() {
  return (
    <DesignSystemProvider initialSystem="default" enablePersistence={true}>
      <div className="min-h-screen bg-background">
        <DesignSystemManager />
      </div>
    </DesignSystemProvider>
  )
}