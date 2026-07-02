import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Home } from '@/pages/Home';
import { ScrollManager } from '@/components/ScrollManager/ScrollManager';

// Route-level code splitting: keep the landing page fast; load secondary pages on demand.
const Writing = lazy(() =>
  import('@/pages/Writing').then((m) => ({ default: m.Writing })),
);
const WritingPost = lazy(() =>
  import('@/pages/WritingPost').then((m) => ({ default: m.WritingPost })),
);
const Colophon = lazy(() =>
  import('@/pages/Colophon').then((m) => ({ default: m.Colophon })),
);
const NotFound = lazy(() =>
  import('@/pages/NotFound').then((m) => ({ default: m.NotFound })),
);

export function App() {
  return (
    <>
      <ScrollManager />
      <Layout>
        <Suspense fallback={<div style={{ minHeight: '60vh' }} aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/writing/:slug" element={<WritingPost />} />
            <Route path="/colophon" element={<Colophon />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
