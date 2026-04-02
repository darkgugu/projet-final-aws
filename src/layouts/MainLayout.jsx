import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const MainLayout = () => {
  return (
    <div className="page-wrapper dark-theme">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
