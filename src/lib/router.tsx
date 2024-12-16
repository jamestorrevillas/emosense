// src/lib/router.tsx
import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SignInPage } from '@/pages/auth/SignInPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { ForgetPasswordPage } from '@/pages/auth/ForgetPasswordPage';
import { Layout } from '@/components/shared/Layout';
import { ReviewLayout } from '@/components/shared/Layout/ReviewLayout';
import { AnimatedLayout } from '@/components/shared/Layout/AnimatedLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProjectListPage } from '@/pages/projects/ProjectListPage';
import { NewProjectPage } from '@/pages/projects/NewProjectPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { EditProjectPage } from '@/pages/projects/EditProjectPage';
import { ReviewPage } from '@/pages/review/ReviewPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { PlaygroundPage } from '@/pages/playground/PlaygroundPage';
import LandingPage from '@/pages/landing/LandingPage';
import { PublicPlaygroundPage } from '@/pages/landing/playground/PublicPlaygroundPage';

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
        element: <AnimatedLayout />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />
          },
          {
            path: 'projects',
            element: <ProjectListPage />
          },
          {
            path: 'projects/new',
            element: <NewProjectPage />
          },
          {
            path: 'projects/:id',
            element: <ProjectDetailPage />
          },
          {
            path: 'projects/:id/edit',
            element: <EditProjectPage />
          },
          {
            path: 'playground',
            element: <PlaygroundPage />
          },
          {
            path: 'settings',
            element: <SettingsPage />
          }
        ]
      }
    ]
  }
];

// Review routes with minimal layout
const reviewRoutes: RouteObject[] = [
  {
    path: '/review',
    element: <ReviewLayout />,
    children: [
      {
        element: <AnimatedLayout />,
        children: [
          {
            path: ':projectId/preview',
            element: (
              <ProtectedRoute>
                <ReviewPage mode="preview" />
              </ProtectedRoute>
            )
          },
          {
            path: ':projectId/:token',
            element: <ReviewPage mode="public" />
          }
        ]
      }
    ]
  }
];

// Public routes
const publicRoutes: RouteObject[] = [
  {
    path: '/auth',
    children: [
      {
        element: <AnimatedLayout />,
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
      }
    ]
  },
  {
    path: '/playground',
    element: (
      <AnimatedLayout>
        <PublicPlaygroundPage />
      </AnimatedLayout>
    )
  }
];

// Combine all routes
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AnimatedLayout>
        <LandingPage />
      </AnimatedLayout>
    )
  },
  ...protectedRoutes,
  ...reviewRoutes,
  ...publicRoutes,
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);