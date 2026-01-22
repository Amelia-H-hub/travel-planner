import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import LoginModal from './LoginModal';
import { LoginModalContext } from '../context/LoginModalContext';
import { Toaster } from "@/components/ui/sonner"

export default function Layout() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <LoginModalContext.Provider value={({ openLoginModal: () => setIsLoginOpen(true)})}>
      <NavBar />

      {/* Scrollable Content */}
      <main className="w-full h-full min-h-screen">
        <Outlet />
        <Toaster />
      </main>

        <LoginModal 
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
        />
    </LoginModalContext.Provider>
  );
};