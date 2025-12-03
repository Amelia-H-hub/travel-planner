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
        <div className={`${heightClass} sticky top-0 left-0 bg-transparent z-50`}>
          <NavBar />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto z-0">
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