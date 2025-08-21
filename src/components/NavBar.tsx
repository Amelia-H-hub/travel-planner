import navIcon from "../assets/navIcon.png"

export default function NavBar() {
  return (
    <nav className="fixed h-30 px-12 mt-12">
      <div className="flex justify-center size-full">
        <div className="h-full">
          <img src={navIcon} alt="icon" className="h-full w-auto object-contain"></img>
        </div>
        <div className="flex items-center">
          <p className="text-3xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>Travel Planner</p>
        </div>
      </div>
    </nav>
  )
}
