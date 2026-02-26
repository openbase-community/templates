import { useEffect } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import type { NavigateToRepoPayload } from '../main/preload';
import RepoList from './components/RepoList';
import RepoDiff from './components/RepoDiff';
import Settings from './components/Settings';
import './App.css';

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = window.electron.onNavigateToRepo(
      ({ repoPath, filePath }: NavigateToRepoPayload) => {
        const name = repoPath.split('/').pop() || repoPath;
        const params = new URLSearchParams({
          path: repoPath,
          name,
        });
        if (filePath) {
          params.set('file', filePath);
        }
        navigate(`/diff?${params.toString()}`);
      },
    );
    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = window.electron.onNavigateToSettings(() => {
      navigate('/settings');
    });
    return unsubscribe;
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<RepoList />} />
      <Route path="/diff" element={<RepoDiff />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
