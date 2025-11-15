import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDispatch } from "react-redux";
import { logout } from "@/store/authSlice";
import { useEffect, useState } from "react";
import { RetailerAPI } from "@/lib/api";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useSpotify } from "@/components/spotify/SpotifyContext";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function RetailerHeader({ setSidebarOpen }: HeaderProps) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [notifCount, setNotifCount] = useState<number>(0);
  const {
    isAuthenticated,
    login,
    logout: spotifyLogout,
    token,
    playerState,
  } = useSpotify();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Placeholder: hit a lightweight endpoint (profile) just to simulate potential notifications source
        await RetailerAPI.profile.get();
        if (!cancelled) setNotifCount(0); // set to 0 until a real alert source is defined
      } catch {
        if (!cancelled) setNotifCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-brand-gradient">
              OpticalShop
            </h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Retailer
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:text-primary"
          >
            <Bell className="h-5 w-5" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-500 text-[10px] leading-4 px-1 text-white flex items-center justify-center">
                {notifCount}
              </span>
            )}
            <span className="sr-only">View notifications</span>
          </Button>
          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="text-sm mr-3 hidden md:block">
                  {playerState.track ? (
                    <span className="max-w-[260px] truncate">
                      {playerState.track.name} —{" "}
                      {(playerState.track.artists || []).join(", ")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not playing</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    if (!token?.access_token) return;
                    await fetch(
                      "https://api.spotify.com/v1/me/player/previous",
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token.access_token}`,
                        },
                      }
                    );
                  }}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    if (!token?.access_token) return;
                    if (playerState.isPlaying)
                      await fetch(
                        "https://api.spotify.com/v1/me/player/pause",
                        {
                          method: "PUT",
                          headers: {
                            Authorization: `Bearer ${token.access_token}`,
                          },
                        }
                      );
                    else {
                      await fetch("https://api.spotify.com/v1/me/player/play", {
                        method: "PUT",
                        headers: {
                          Authorization: `Bearer ${token.access_token}`,
                        },
                      });
                    }
                  }}
                >
                  {playerState.isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    if (!token?.access_token) return;
                    await fetch("https://api.spotify.com/v1/me/player/next", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token.access_token}`,
                      },
                    });
                  }}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => spotifyLogout()}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => login()}>
                Connect Spotify
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 md:h-10 md:w-10 rounded-full hover:text-primary"
              >
                <Avatar className="h-9 w-9 md:h-10 md:w-10">
                  <AvatarFallback className="bg-app-gradient text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {user?.name || "Retailer"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </div>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await RetailerAPI.auth.logout();
                  } catch {
                    // Swallow network/auth errors; still clear local state
                  } finally {
                    dispatch(logout());
                    toast.success("Logged out");
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
