import { ProjectForm } from '@/modules/home/ui/components/project-form';
import ProjectsList from '@/modules/home/ui/components/projects-list';
import Image from 'next/image';
import type { Metadata } from 'next';
import { generateStructuredData } from '@/lib/seo-utils';
import { StructuredData } from '@/components/seo/structured-data';

export const metadata: Metadata = {
  title: 'Crazy Code - Build Apps with AI | No-Code Development Platform',
  description: 'Create apps and websites by chatting with AI. Transform your ideas into functional applications through natural language conversation. Start building today with our revolutionary no-code platform.',
  openGraph: {
    title: 'Crazy Code - Build Apps with AI | No-Code Development Platform',
    description: 'Create apps and websites by chatting with AI. Transform your ideas into functional applications through natural language conversation.',
    images: [
      {
        url: '/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Crazy Code Homepage - AI-Powered App Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crazy Code - Build Apps with AI',
    description: 'Create apps and websites by chatting with AI. No-code development made simple.',
    images: ['/twitter-home.jpg'],
  },
};

const Page = () => {
  const softwareData = generateStructuredData('software');
  const websiteData = generateStructuredData('website');
  const organizationData = generateStructuredData('organization');

  return (
    <>
      <StructuredData data={softwareData} />
      <StructuredData data={websiteData} />
      <StructuredData data={organizationData} />
      <div className="flex flex-col max-w-5xl mx-auto w-full">
        <section className="space-y-6 py-[16vh] 2xl:py-48">
          <div className="flex flex-col items-center">
            <Image
              src="/logo.svg"
              alt="Crazy Code - AI-Powered App Builder Logo"
              width={50}
              height={50}
              className="hidden md:block"
              priority
            />
          </div>
          <h1 className="text-2xl md:text-5xl font-bold text-center">
            Build something with Crazy Code
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center">
            Create apps and websites by chatting with AI
          </p>
          <div className="max-w-3xl mx-auto w-full">
            <ProjectForm />
          </div>
        </section>
        <ProjectsList />
      </div>
    </>
  );
};

export default Page;
