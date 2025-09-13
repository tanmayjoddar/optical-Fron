import { Button } from "./button";
import { useAuth } from "../../hooks/useAuth";

function Header() {
  const { logout } = useAuth();
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white shadow flex items-center px-4 z-50">
      <div className="flex items-center w-full">
        <Button variant="outline" onClick={logout} className="mr-4">
          Logout
        </Button>
        <span className="text-lg font-semibold">Staff Dashboard</span>
      </div>
    </header>
  );
}

export default Header;
