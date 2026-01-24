import navIcon from "../assets/navIcon.png";
import { UserRound } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoginModal } from "../context/LoginModalContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { API_BASE_URL } from '@/constants';
import { useEffect, useState } from "react";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openLoginModal } = useLoginModal();
  const { user, setUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  // set height of nav bar based on current page
  const heightClass = location.pathname === "/" ? "h-24 md:h-52" : "h-16 md:h-40";
  const pxClass = location.pathname === "/" ? "px-6 md:px-15" : "px-6 md:px-8";
  const pyClass = location.pathname === "/" ? "py-10 md:py-12" : "py-10";
  const titleFontSize = location.pathname === "/" ? "text-2xl md:text-3xl" : "text-2xl";
  const isWhiteTextPage = ["/", "/inspirationForm"].includes(location.pathname);
  const titleTextColor = isScrolled
    ? "text-[#1f3255]"
    : (isWhiteTextPage ? "text-white" : "text-[#1f3255]");
  const titleTextShadow = isWhiteTextPage ? { textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' } : {};
  const iconColor = isScrolled ? "text-[#1f3255]" : "text-white";
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navBg = isScrolled
    ? "bg-white/80 backdrop-blur-md shadow-md text-[#1f3255]"
    : "bg-transparent text-white"

  return (
    <>
      <nav className={`
        flex justify-between fixed ${heightClass} w-full ${pxClass} ${pyClass}
        top-0 left-0 transition-all duration-300 z-50 items-center
        ${navBg}`
      }>
        <div className="flex items-center gap-3 h-full py-2">
          <img src={navIcon} alt="icon" className="h-10 md:h-20 w-auto object-contain transition-all"></img>
          <div className="flex flex-col justify-center">
            <p 
              onClick={() => navigate('/')}
              className={`text-left ${titleFontSize} font-bold ${titleTextColor} cursor-pointer`}
              style={!isScrolled ? titleTextShadow : {}}
            >
              Journi
            </p>
            {showSubTitle && !isScrolled && (
              <p className="text-[12px] md:text-lg text-white text-left"> Your personal travel planner </p>
            )}
          </div>
        </div>
        <div className="flex justify-end w-fit items-center">
          {user ? (
            <div className="flex items-center gap-2">
              <UserRound className={iconColor}/>
              <button className="bg-transparent text-base md:text-lg text-white h-fit">
                {user.user_name}
              </button>
              <button
                onClick={logout}
                className="bg-transparent! text-base md:text-lg text-white underline h-fit"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={openLoginModal}
              className={`bg-transparent! text-base md:text-lg ${titleTextColor} underline h-fit`}
            >
              Login / Register
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
