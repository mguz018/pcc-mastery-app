import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Spinner from './components/Spinner';
import { useTheme } from './lib/useTheme';
import Landing from './pages/Landing';

// Split everything below the landing page so first paint stays fast on mobile.
const Practice = lazy(() => import('./pages/Practice'));
const ExamSimulator = lazy(() => import('./pages/ExamSimulator'));
const Diagnostic = lazy(() => import('./pages/Diagnostic'));
const Admin = lazy(() => import('./pages/Admin'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Results = lazy(() => import('./pages/Results'));
const Success = lazy(() => import('./pages/Success'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const About = lazy(() => import('./pages/About'));
const PrepGuide = lazy(() => import('./pages/PrepGuide'));
const Guides = lazy(() => import('./pages/Guides'));
const Guide = lazy(() => import('./pages/Guide'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  const theme = useTheme();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<Layout theme={theme} />}>
            <Route index element={<Landing />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="about" element={<About />} />
            <Route path="prep-guide" element={<PrepGuide />} />
            <Route path="guides" element={<Guides />} />
            <Route path="guides/:slug" element={<Guide />} />
            <Route path="login" element={<Login />} />

            {/* Free tier practices here too — the paywall is on content, not the route */}
            <Route path="practice" element={<Practice />} />
            <Route path="practice/:competency" element={<Practice />} />
            <Route path="review" element={<Practice review />} />
            <Route path="review-due" element={<Practice due />} />
            <Route path="bookmarks" element={<Practice bookmarks />} />
            <Route path="diagnostic" element={<Diagnostic />} />
            <Route path="exam" element={<ExamSimulator />} />
            <Route path="results" element={<Results />} />

            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            {/* Not protected: pay-first buyers arrive here without a session and
                are auto-signed-in via their paid Stripe session. */}
            <Route path="success" element={<Success />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
