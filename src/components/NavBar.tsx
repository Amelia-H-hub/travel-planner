import { Link } from "react-router-dom"; 
import navIcon from "../assets/navIcon.png"
import navIconWhite from "../assets/navIcon_white.png"

export default function NavBar() {
  return (
    <nav className="fixed top-0 left-0 bg-transparent h-30 px-12 mt-12 z-99">
      <div className="flex justify-center size-full">
        <div className="h-full">
          <img src={navIcon} alt="icon" className="h-full w-auto object-contain"></img>
        </div>
        <div className="flex items-center">
          <p className="text-3xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>Travel Planner</p>
        </div>
      </div>
    </nav>
  )
}
