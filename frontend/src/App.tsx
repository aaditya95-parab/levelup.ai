import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "./lib/api-client-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Quests from "@/pages/quests";
import Leaderboard from "@/pages/leaderboard";
import Onboarding from "@/pages/onboarding";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { LevelUpProvider } from "@/components/level-up-context";
import { ActiveQuestProvider } from "@/components/ActiveQuestContext";
import { customFetch } from "./lib/api-client-react/custom-fetch";

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
      },
    },
  },
});

setAuthTokenGetter(() => localStorage.getItem("levelup_token"));

// ─── Onboarding gate ─────────────────────────────────────────────────────────

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();
  const [checking, setChecking] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("levelup_token");
    if (!token) {
      setLocation("/login");
      setChecking(false);
      return;
    }

    // Check onboarding status
    customFetch<{ onboardingComplete: boolean }>("/api/onboarding/status")
      .then((res) => {
        setOnboardingDone(res.onboardingComplete);
        if (!res.onboardingComplete) {
          setLocation("/onboarding");
        }
      })
      .catch(() => {
        // If check fails (e.g. 401), redirect to login
        localStorage.removeItem("levelup_token");
        setLocation("/login");
      })
      .finally(() => setChecking(false));
  }, [location]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-primary font-display uppercase tracking-widest text-xl animate-pulse">
          Initializing...
        </div>
      </div>
    );
  }

  if (!localStorage.getItem("levelup_token") || onboardingDone === false) return null;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

function Router() {
  return (
    <Switch>
      <Route
        path="/"
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => {
            setLoc(localStorage.getItem("levelup_token") ? "/dashboard" : "/login");
          }, []);
          return null;
        }}
      />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding" component={() => {
        const [, setLoc] = useLocation();
        useEffect(() => {
          if (!localStorage.getItem("levelup_token")) setLoc("/login");
        }, []);
        return localStorage.getItem("levelup_token") ? <Onboarding /> : null;
      }} />
      <Route path="/dashboard"  component={() => <ProtectedRoute component={Dashboard}   />} />
      <Route path="/quests"     component={() => <ProtectedRoute component={Quests}       />} />
      <Route path="/leaderboard"component={() => <ProtectedRoute component={Leaderboard}  />} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LevelUpProvider>
          <ActiveQuestProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </ActiveQuestProvider>
        </LevelUpProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
