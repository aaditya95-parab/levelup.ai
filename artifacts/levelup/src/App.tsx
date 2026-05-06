import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Quests from "@/pages/quests";
import Leaderboard from "@/pages/leaderboard";
import { useEffect } from "react";
import { Layout } from "@/components/layout";
import { LevelUpProvider } from "@/components/level-up-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401) {
          localStorage.removeItem("levelup_token");
          window.location.href = "/login";
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error: any) => {
        if (error?.status === 401) {
          localStorage.removeItem("levelup_token");
          window.location.href = "/login";
        }
      }
    }
  }
});

setAuthTokenGetter(() => localStorage.getItem("levelup_token"));

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    if (!localStorage.getItem("levelup_token")) {
      setLocation("/login");
    }
  }, [location, setLocation]);

  if (!localStorage.getItem("levelup_token")) return null;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => {
        const [loc, setLoc] = useLocation();
        useEffect(() => {
          if (localStorage.getItem("levelup_token")) {
            setLoc("/dashboard");
          } else {
            setLoc("/login");
          }
        }, [setLoc]);
        return null;
      }} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/quests" component={() => <ProtectedRoute component={Quests} />} />
      <Route path="/leaderboard" component={() => <ProtectedRoute component={Leaderboard} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LevelUpProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </LevelUpProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
