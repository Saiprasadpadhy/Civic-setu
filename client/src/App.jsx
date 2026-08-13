import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ROUTES } from './constants';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      </Routes>
    </Layout>
  );
}
