import NavBar from './NavBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col">
      <div className="h-50 sticky top-0 left-0 bg-transparent z-99">
        <NavBar />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto z-0">
        {children}
      </div>
    </div>
  );
};

export default Layout;