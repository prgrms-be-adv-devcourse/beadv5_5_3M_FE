import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { Film, ArrowLeft, Sun, Moon, Cookie, Plus, ShoppingCart, Ticket } from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { cartService } from "../../services/ticketService";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string | number;
  children?: ReactNode;
  rightElement?: ReactNode;
}

export function Header({ title, showBackButton, backUrl, children, rightElement }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useUser();
  const [cartCount, setCartCount] = useState(0);

  // 현재 경로가 /creator로 시작하면 크리에이터 스튜디오 모드
  const isCreatorMode = location.pathname.startsWith("/creator");

  useEffect(() => {
    if (!user || isCreatorMode) return;
    const fetchCartCount = () => {
      cartService.getCartItems().then((items) => setCartCount(items.length)).catch(() => {});
    };
    fetchCartCount();
    window.addEventListener("cart-updated", fetchCartCount);
    return () => window.removeEventListener("cart-updated", fetchCartCount);
  }, [user, isCreatorMode]);

  return (
    <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 backdrop-blur-md" : "bg-white/80 border-slate-200 backdrop-blur-md"}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-8 min-w-0">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full transition-colors shrink-0 ${isDark ? "text-white hover:bg-slate-800" : "text-slate-900 hover:bg-slate-200"}`}
                onClick={() => navigate(backUrl as any || -1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div 
              className="flex items-center gap-2 cursor-pointer group shrink-0" 
              onClick={() => navigate(isCreatorMode ? "/creator" : "/main")}
            >
              <Film className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className={`text-xl font-bold tracking-tighter transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                  CineStream
                </span>
                {title && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-purple-500 leading-none`}>
                    {title}
                  </span>
                )}
              </div>
            </div>
            {children}
          </div>
          <div className="flex items-center gap-2 shrink-0">
             {!isCreatorMode && (
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => navigate("/tickets/open")}
                 className={`gap-1.5 rounded-full px-3 transition-colors ${isDark ? "text-slate-200 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"}`}
               >
                 <Ticket className="w-4 h-4 text-purple-500" />
                 <span className="text-sm font-medium">티켓팅</span>
               </Button>
             )}
             {/* Cookie Count Pill (Visible only for non-creators) */}
             {!isCreatorMode && user && (
               <div 
                 onClick={() => navigate("/cookies")}
                 className={`flex items-center gap-2 pr-1 pl-4 py-1.5 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 border group ${isDark ? "bg-slate-900 border-slate-700 hover:border-purple-500" : "bg-white border-slate-200 hover:border-purple-500 shadow-sm"}`}
               >
                 <div className="flex items-center gap-2">
                   <Cookie className="w-4 h-4 text-amber-500" />
                   <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-700"}`}>
                     {(user.cookieBalance ?? 0).toLocaleString()}
                   </span>
                 </div>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-slate-800 group-hover:bg-purple-600" : "bg-purple-50 group-hover:bg-purple-600"}`}>
                   <Plus className={`w-3.5 h-3.5 transition-colors ${isDark ? "text-purple-400 group-hover:text-white" : "text-purple-600 group-hover:text-white"}`} />
                 </div>
               </div>
             )}
             {!isCreatorMode && user && (
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => navigate("/cart")}
                 className={`relative rounded-full transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}
               >
                 <ShoppingCart className="w-5 h-5" />
                 {cartCount > 0 && (
                   <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full bg-purple-600 text-white text-[10px] font-black leading-none px-1">
                     {cartCount}
                   </span>
                 )}
               </Button>
             )}
             {rightElement}
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={`transition-colors rounded-full ${isDark ? "text-yellow-400 hover:text-yellow-300 hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
