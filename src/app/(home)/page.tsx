import { ProjectForm } from '@/modules/home/ui/components/project-form';
import ProjectsList from '@/modules/home/ui/components/projects-list';
import { BrandHero } from '@/components/whitelabel/brand-hero';

const Page = () => {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <BrandHero />
        <div className="max-w-3xl mx-auto w-full">
          <ProjectForm />
        </div>
      </section>
      <ProjectsList />
    </div>
  );
};

export default Page;
