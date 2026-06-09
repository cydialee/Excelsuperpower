import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Report from './pages/Report';
import Plans from './pages/Plans';
import Compare from './pages/Compare';
import Settings from './pages/Settings';
import Result from './pages/Result';
import Batch from './pages/Batch';
import Templates from './pages/Templates';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/report" element={<Report />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/compare/:planId" element={<Compare />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/result" element={<Result />} />
        <Route path="/batch" element={<Batch />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
