import { AuthProvider } from '../../features/auth/components/AuthProvider.jsx';
import { ChatUnreadProvider } from '../../features/chat/components/ChatUnreadProvider.jsx';
import { LanguageProvider } from '../../features/i18n/LanguageProvider.jsx';
import { ThemeProvider } from '../../features/theme/ThemeProvider.jsx';

export const AppProviders = ({ children }) => (
  <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        <ChatUnreadProvider>{children}</ChatUnreadProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);
