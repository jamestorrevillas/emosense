// src/lib/router.tsx
import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SignInPage } from '@/pages/auth/SignInPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { ForgetPasswordPage } from '@/pages/auth/ForgetPasswordPage';
import { Layout } from '@/components/shared/Layout';
import { ReviewLayout } from '@/components/shared/Layout/ReviewLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { VideoReviewListPage } from '@/pages/videoReview/VideoReviewListPage';
import { NewVideoReviewPage } from '@/pages/videoReview/NewVideoReviewPage';
import { VideoReviewDetailPage } from '@/pages/videoReview/VideoReviewDetailPage';
import { EditVideoReviewPage } from '@/pages/videoReview/EditVideoReviewPage';
import { FeedbackSessionPage } from '@/pages/feedbackSession/FeedbackSessionPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { PlaygroundPage } from '@/pages/playground/PlaygroundPage';
import { AudienceAIPage  } from '@/pages/audienceAI/AudienceAIPage';
import LandingPage from '@/pages/landing/LandingPage';
import { PublicPlaygroundPage } from '@pages/landing/playground/PublicPlaygroundPage';

// Project routes with standard layout
const protectedRoutes: RouteObject[] = [
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'video-review',
        element: <VideoReviewListPage />
      },
      {
        path: 'video-review/new',
        element: <NewVideoReviewPage />
      },
      {
        path: 'video-review/:id',
        element: <VideoReviewDetailPage />
      },
      {
        path: 'video-review/:id/edit',
        element: <EditVideoReviewPage />
      },
      {
        path: 'playground',
        element: <PlaygroundPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: 'audienceai',
        element: <AudienceAIPage />
      }
    ]
  }
];

// Feedback Session routes with minimal layout
const feedbackSessionRoutes: RouteObject[] = [
  {
    path: '/feedback',
    element: <ReviewLayout />,
    children: [
      {
        path: ':projectId/preview',
        element: (
          <ProtectedRoute>
            <FeedbackSessionPage mode="preview" />
          </ProtectedRoute>
        )
      },
      {
        path: ':projectId/:token',
        element: <FeedbackSessionPage mode="public" />
      }
    ]
  }
];

// Auth routes
const publicRoutes: RouteObject[] = [
  {
    path: '/auth',
    children: [
      {
        path: 'signin',
        element: <SignInPage />
      },
      {
        path: 'signup',
        element: <SignUpPage />
      },
      {
        path: 'forgot-password',
        element: <ForgetPasswordPage />
      }
    ]
  },
  {
    path: '/playground',
    element: <PublicPlaygroundPage />
  }
];

// Combine all routes
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  ...protectedRoutes,
  ...feedbackSessionRoutes,
  ...publicRoutes,
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);