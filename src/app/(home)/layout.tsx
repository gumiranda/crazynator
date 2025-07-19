import { BlogHeader } from '@/components/blog/header';
import { BlogFooter } from '@/components/blog/footer';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <BlogHeader />
      <main className="flex-1">
        {children}
      </main>
      <BlogFooter />
    </div>
  );
}
