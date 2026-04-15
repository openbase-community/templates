import {
  AnonymousRoute,
  AuthChangeRedirector,
  AuthContextProvider,
  ProviderCallback,
} from "$${auth_client_package_name}";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/account/login" replace />} />
      <Route
        path="/account/login"
        element={
          <AnonymousRoute>
            <Login />
          </AnonymousRoute>
        }
      />
      <Route path="/account/provider/callback" element={<ProviderCallback />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthContextProvider>
        <AuthChangeRedirector>
          <AppRoutes />
        </AuthChangeRedirector>
      </AuthContextProvider>
    </Router>
  );
}

export default App;
