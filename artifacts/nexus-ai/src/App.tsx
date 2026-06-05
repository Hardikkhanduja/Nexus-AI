import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { PixelBackground } from "@/components/PixelBackground";
import { Sidebar } from "@/components/Sidebar";
import LandingPage from "@/pages/LandingPage";
import ChatWorkspace from "@/pages/ChatWorkspace";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppRouter() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = () => setSidebarOpen(true);

  return (
    <>
      <PixelBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="relative z-10 w-full h-[100dvh]">
        <Switch>
          <Route path="/">
            <LandingPage onOpenSidebar={openSidebar} />
          </Route>
          <Route path="/chat">
            <ChatWorkspace onOpenSidebar={openSidebar} />
          </Route>
          
          <Route path="/history"><PlaceholderPage title="CHAT HISTORY" onOpenSidebar={openSidebar} /></Route>
          <Route path="/analytics"><PlaceholderPage title="ANALYTICS" onOpenSidebar={openSidebar} /></Route>
          <Route path="/performance"><PlaceholderPage title="AGENT PERFORMANCE" onOpenSidebar={openSidebar} /></Route>
          <Route path="/saved"><PlaceholderPage title="SAVED CONVERSATIONS" onOpenSidebar={openSidebar} /></Route>
          <Route path="/login"><PlaceholderPage title="LOGIN" onOpenSidebar={openSidebar} /></Route>
          <Route path="/profile"><PlaceholderPage title="PROFILE" onOpenSidebar={openSidebar} /></Route>
          <Route path="/settings"><PlaceholderPage title="SETTINGS" onOpenSidebar={openSidebar} /></Route>
          <Route path="/usage"><PlaceholderPage title="USAGE & LIMITS" onOpenSidebar={openSidebar} /></Route>
          <Route path="/docs"><PlaceholderPage title="DOCUMENTATION" onOpenSidebar={openSidebar} /></Route>
          <Route path="/feedback"><PlaceholderPage title="FEEDBACK" onOpenSidebar={openSidebar} /></Route>
          <Route path="/logout"><PlaceholderPage title="LOGOUT" onOpenSidebar={openSidebar} /></Route>
          
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
