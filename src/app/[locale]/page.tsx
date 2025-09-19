'use client';

import SimplifiedHero from '@/components/SimplifiedHero';
import SimplifiedInput from '@/components/SimplifiedInput';

interface HomePageProps {
  params: { locale: string };
}

export default function HomePage({ params }: HomePageProps) {
  return (
    <>
      <SimplifiedHero locale={params.locale} />
      <SimplifiedInput locale={params.locale} />
    </>
  );
}