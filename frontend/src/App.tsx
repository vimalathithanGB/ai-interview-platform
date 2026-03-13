import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ResumeUpload from './pages/ResumeUpload';
import InterviewSession from './pages/InterviewSession';
import ResultsDashboard from './pages/ResultsDashboard';
import HistoryDashboard from './pages/HistoryDashboard';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '0.75rem',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/"          element={<ResumeUpload />} />
            <Route path="/interview" element={<InterviewSession />} />
            <Route path="/results"   element={<ResultsDashboard />} />
            <Route path="/history"   element={<HistoryDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
