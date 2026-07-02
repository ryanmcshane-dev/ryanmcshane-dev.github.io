import { SeoHead } from '@/components/SeoHead/SeoHead';
import { Hero } from '@/components/sections/Hero/Hero';
import { About } from '@/components/sections/About/About';
import { AiNative } from '@/components/sections/AiNative/AiNative';
import { CaseStudy } from '@/components/sections/CaseStudy/CaseStudy';
import { Impact } from '@/components/sections/Impact/Impact';
import { Skills } from '@/components/sections/Skills/Skills';
import { Contact } from '@/components/sections/Contact/Contact';

export function Home() {
  return (
    <>
      <SeoHead path="/" />
      <Hero />
      <About />
      <AiNative />
      <CaseStudy />
      <Impact />
      <Skills />
      <Contact />
    </>
  );
}
