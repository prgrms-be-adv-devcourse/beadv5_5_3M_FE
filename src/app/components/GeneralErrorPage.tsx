import { useRouteError, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Film, AlertTriangle, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";

export function GeneralErrorPage() {
  const error = useRouteError() as any;
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  console.error(error);

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse"></div>
          <AlertTriangle className="w-24 h-24 text-red-500 relative z-10 mx-auto" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">문제가 발생했습니다</h1>
          <p className={`text-lg font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            예상치 못한 오류가 발생하여 페이지를 표시할 수 없습니다.
          </p>
          <div className={`p-4 rounded-xl text-left text-xs font-mono overflow-auto max-h-40 border ${isDark ? "bg-slate-900 border-slate-800 text-red-400" : "bg-white border-slate-200 text-red-600 shadow-inner"}`}>
            {error?.message || "알 수 없는 오류가 발생했습니다."}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button 
            variant="outline"
            className={`flex-1 h-14 rounded-2xl font-bold border-2 ${isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"}`}
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            새로고침
          </Button>
          <Button 
            className="flex-1 h-14 rounded-2xl font-black bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-500/30"
            onClick={() => navigate("/main")}
          >
            홈으로 이동
          </Button>
        </div>
        
        <div className="pt-8">
          <div className="flex items-center justify-center gap-2 opacity-40">
            <Film className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest uppercase">CineStream Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
