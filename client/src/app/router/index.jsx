import { createBrowserRouter } from 'react-router-dom';

import { NotFoundPage } from '../../components/common/NotFoundPage.jsx';
import { AppLayout } from '../../components/layout/AppLayout.jsx';
import { AdminRoute, ProtectedRoute } from './RouteGuards.jsx';
import { AdminDashboardPage } from '../../features/admin/pages/AdminDashboardPage.jsx';
import { LoginPage } from '../../features/auth/pages/LoginPage.jsx';
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage.jsx';
import { RegisterPage } from '../../features/auth/pages/RegisterPage.jsx';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage.jsx';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage.jsx';
import { ChatInboxPage } from '../../features/chat/pages/ChatInboxPage.jsx';
import { BrowsePostsPage } from '../../features/posts/pages/BrowsePostsPage.jsx';
import { CreatePostPage } from '../../features/posts/pages/CreatePostPage.jsx';
import { EditPostPage } from '../../features/posts/pages/EditPostPage.jsx';
import { HomePage } from '../../features/posts/pages/HomePage.jsx';
import { MyPostsPage } from '../../features/posts/pages/MyPostsPage.jsx';
import { PostDetailsPage } from '../../features/posts/pages/PostDetailsPage.jsx';
import { EditProfilePage } from '../../features/profile/pages/EditProfilePage.jsx';
import { UserProfilePage } from '../../features/profile/pages/UserProfilePage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'browse', element: <BrowsePostsPage /> },
      { path: 'posts/:identifier', element: <PostDetailsPage /> },
      { path: 'users/:userId', element: <UserProfilePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'account', element: <EditProfilePage /> },
          { path: 'create-post', element: <CreatePostPage /> },
          { path: 'my-posts', element: <MyPostsPage /> },
          { path: 'posts/:identifier/edit', element: <EditPostPage /> },
          { path: 'profile/edit', element: <EditProfilePage /> },
          { path: 'messages', element: <ChatInboxPage /> }
        ]
      },
      {
        element: <AdminRoute />,
        children: [{ path: 'admin', element: <AdminDashboardPage /> }]
      },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);
