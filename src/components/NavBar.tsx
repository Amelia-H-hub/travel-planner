import { useState } from "react";
import navIcon from "../assets/navIcon.png";
import { UserRound } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoginModal } from "../context/LoginModalContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function NavBar() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { openLoginModal } = useLoginModal();
  const { user, setUser } = useAuth();

  // set height of nav bar based on current page
  const heightClass = location.pathname === "/" ? "h-30" : "h-15";
  const pxClass = location.pathname === "/" ? "px-15" : "px-8";
  const mtClass = location.pathname === "/" ? "mt-12" : "mt-6";
  const titleFontSize = location.pathname === "/" ? "text-3xl" : "text-2xl";
  const titleTextColor = location.pathname === "/" ? "text-white" : "text-[#1f3255]";
  const titleTextShadow = location.pathname === "/" ? { textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' } : {};
  const showSubTitle = location.pathname === "/";
  
  const logout = async () => {
    const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method:"POST",
      credentials: "include",
    });
    const result = await res.json();

    if (200 <= result.code && result.code < 300) {
      setUser(null);
      toast.success(result.message);
    }
  }

  return (
    <>
      <nav className={`flex justify-between fixed ${heightClass} w-full ${pxClass} ${mtClass}`}>
        <div className="flex justify-center w-fit h-full">
          <div className="h-full">
            <img src={navIcon} alt="icon" className="h-full w-auto object-contain"></img>
          </div>
          <div className="flex flex-col justify-center items-start">
            <p 
              onClick={() => navigate('/')}
              className={`${titleFontSize} font-bold ${titleTextColor} cursor-pointer`}
              style={titleTextShadow}
            >
              Journi
            </p>
            {showSubTitle && (
              <p className="text-lg text-white"> Your personal travel planner </p>
            )}
          </div>
        </div>
        <div className="flex justify-end w-fit items-center">
          {user ? (
            <div className="flex items-center gap-2">
              <UserRound className="text-white"/>
              <button className="bg-transparent text-lg text-white h-fit">
                {user.user_name}
              </button>
              <button
                onClick={logout}
                className="bg-transparent text-lg text-white underline h-fit"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={openLoginModal}
              className="bg-transparent text-lg text-white underline h-fit"
            >
              Login / Register
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
