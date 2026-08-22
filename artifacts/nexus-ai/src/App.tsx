import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/clerk-react";

import { PixelBackground } from "@/components/PixelBackground";
import { Sidebar } from "@/components/Sidebar";
import LandingPage from "@/pages/LandingPage";
import ChatWorkspace from "@/pages/ChatWorkspace";
import PlaceholderPage from "@/pages/PlaceholderPage";
import HistoryPage from "@/pages/HistoryPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import PerformancePage from "@/pages/PerformancePage";
import SavedPage from "@/pages/SavedPage";
import FeedbackPage from "@/pages/FeedbackPage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import ProfilePage from "@/pages/ProfilePage";
import UsagePage from "@/pages/UsagePage";
import SharePage from "@/pages/SharePage";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/contexts/AuthContext";
import { HAS_CLERK_KEY, PUBLISHABLE_KEY } from "@/lib/clerk";

const queryClient = new QueryClient();

function AppRouter() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = () => setSidebarOpen(true);

  return (
    <>
      <PixelBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 w-full h-dvh">
        <Switch>
          <Route path="/">
            <LandingPage onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/chat">
            <ChatWorkspace onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/chat/:conversationId">
            <ChatWorkspace onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/share/:conversationId">
            <SharePage />
          </Route>

          <Route path="/history">
            <HistoryPage onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/analytics">
            <AnalyticsPage onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/performance">
            <PerformancePage onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/saved">
            <HistoryPage onOpenSidebar={openSidebar} />
          </Route>

          {/* Login Routes & Callbacks */}
          <Route path="/login">
            <LoginPage />
          </Route>
          <Route path="/login/sso-callback">
            <LoginPage />
          </Route>
          <Route path="/login/continue">
            <LoginPage />
          </Route>
          <Route path="/login/verify">
            <LoginPage />
          </Route>

          {/* Sign Up Routes & Callbacks */}
          <Route path="/signup">
            <SignUpPage />
          </Route>
          <Route path="/signup/sso-callback">
            <SignUpPage />
          </Route>
          <Route path="/signup/continue">
            <SignUpPage />
          </Route>
          <Route path="/signup/verify">
            <SignUpPage />
          </Route>
          <Route path="/sso-callback">
            <LoginPage />
          </Route>

          <Route path="/profile">
            <ProfilePage onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/settings">
            <PlaceholderPage title="SETTINGS" onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/usage">
            <UsagePage onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/feedback">
            <FeedbackPage onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/logout">
            <PlaceholderPage title="LOGOUT" onOpenSidebar={openSidebar} />
          </Route>

          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  const content = (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );

  if (HAS_CLERK_KEY) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        {content}
      </ClerkProvider>
    );
  }

  return content;
}

export default App;
