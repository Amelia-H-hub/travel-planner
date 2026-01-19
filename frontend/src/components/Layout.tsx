import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import LoginModal from './LoginModal';
import { LoginModalContext } from '../context/LoginModalContext';
import { Toaster } from "@/components/ui/sonner"

export default function Layout() {
  const location = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const heightClass = location.pathname === "/" ? "h-50" : "h-25";

  return (
    <LoginModalContext.Provider value={({ openLoginModal: () => setIsLoginOpen(true)})}>
      <div className="h-screen flex flex-col">
        <div className="fixed top-0 left-0 w-full bg-transparent z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <NavBar />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="w-full h-full overflow-auto z-0">
          <Outlet />
          <Toaster />
        </div>

        <LoginModal 
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
        />
      </div>
    </LoginModalContext.Provider>
  );
};