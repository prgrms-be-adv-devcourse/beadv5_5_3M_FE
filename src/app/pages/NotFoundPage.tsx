import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Film } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="text-center animate-in fade-in zoom-in duration-500">
        <div className="relative mb-8">
          <Film className="w-24 h-24 text-purple-500 mx-auto" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-purple-500/20 rounded-full animate-ping"></div>
        </div>
        <h1 className={`text-8xl font-black mb-4 tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}>404</h1>
        <p className={`text-2xl font-bold mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>페이지를 찾을 수 없습니다</p>
        <Button
          onClick={() => navigate("/main")}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-purple-500/20 transition-transform active:scale-95"
        >
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
