import { TopNavigation } from "./TopNavigation";
import { BottomNavigation } from "./BottomNavigation";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  
  // Pages where navigation should be hidden
  const hideNavigation = location.pathname === "/camera" || location.pathname === "/photo-preview";

  return (
    <div className="min-h-screen bg-background">
      {!hideNavigation && <TopNavigation />}
      <main>{children}</main>
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
};

export default Layout;