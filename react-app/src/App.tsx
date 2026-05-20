import {
  AuthChangeRedirector,
  AuthContextProvider,
  useConfig,
} from "$${auth_client_package_name}";
import { Outlet } from "react-router-dom";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { createAuthRoutes } from "./auth/AuthRoutes";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

function RootLayout() {
  return (
    <AuthChangeRedirector>
      <Outlet />
    </AuthChangeRedirector>
  );
}

function AppRouter() {
  const [router, setRouter] = useState<ReturnType<
    typeof createBrowserRouter
  > | null>(null);
  const config = useConfig();

  useEffect(() => {
    setRouter(
      createBrowserRouter(
        createRoutesFromElements(
          <Route element={<RootLayout />}>
            <Route path="/" element={<Navigate to="/account/login" replace />} />
            {createAuthRoutes(config)}
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        )
      )
    );
  }, [config]);

  return router ? <RouterProvider router={router} /> : null;
}

function App() {
  return (
    <AuthContextProvider>
      <AppRouter />
    </AuthContextProvider>
  );
}

export default App;
