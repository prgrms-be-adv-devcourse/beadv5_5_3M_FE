import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Film, Star, Popcorn, Sun, Moon } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900" : "bg-gradient-to-br from-purple-50 via-white to-blue-50"}`}>
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Film className={`w-8 h-8 ${isDark ? "text-white" : "text-purple-600"}`} />
          <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>CineStream</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`transition-colors rounded-full ${isDark ? "text-yellow-400 hover:text-yellow-300 hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-black/5"}`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            className={`${isDark ? "text-white hover:bg-white/20" : "text-slate-700 hover:bg-black/5"}`}
            onClick={() => navigate("/login")}
          >
            로그인
          </Button>
          <Button
            className={isDark ? "bg-white text-purple-900 hover:bg-gray-100" : "bg-purple-600 text-white hover:bg-purple-700 shadow-md"}
            onClick={() => navigate("/signup")}
          >
            회원가입
          </Button>
          <Button
            variant="outline"
            className={`${isDark ? "border-orange-400 text-orange-400 hover:bg-orange-400/10" : "border-orange-500 text-orange-500 hover:bg-orange-50"}`}
            onClick={() => navigate("/creator/login")}
          >
            크리에이터
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <h1 className={`text-6xl font-black tracking-tight mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
            크리에이터와 함께하는
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">새로운 영화 경험</span>
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? "text-white/80" : "text-slate-600 font-medium"}`}>
            독립 크리에이터들의 영화를 실시간으로 감상하고,
            <br />
            쿠키로 후원하며 함께 성장하세요
          </p>
          <div className="pt-6">
            <Button
              size="lg"
              className={`text-lg px-8 py-6 font-bold shadow-xl transition-transform hover:scale-105 ${isDark ? "bg-white text-purple-900 hover:bg-gray-100" : "bg-purple-600 text-white hover:bg-purple-700"}`}
              onClick={() => navigate("/main")}
            >
              지금 시작하기
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className={`backdrop-blur-sm rounded-2xl p-8 text-center border transition-all ${isDark ? "bg-white/10 border-white/10 text-white" : "bg-white/60 border-purple-100 text-slate-800 shadow-sm"}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-white/20" : "bg-purple-100"}`}>
              <Film className={`w-8 h-8 ${isDark ? "text-white" : "text-purple-600"}`} />
            </div>
            <h3 className="text-xl font-bold mb-2">독립 영화 스트리밍</h3>
            <p className={isDark ? "text-white/70" : "text-slate-500 text-sm"}>
              크리에이터의 독창적인 영화를 실시간 상영관에서 감상하세요
            </p>
          </div>

          <div className={`backdrop-blur-sm rounded-2xl p-8 text-center border transition-all ${isDark ? "bg-white/10 border-white/10 text-white" : "bg-white/60 border-purple-100 text-slate-800 shadow-sm"}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-white/20" : "bg-purple-100"}`}>
              <Popcorn className={`w-8 h-8 ${isDark ? "text-white" : "text-purple-600"}`} />
            </div>
            <h3 className="text-xl font-bold mb-2">쿠키 시스템</h3>
            <p className={isDark ? "text-white/70" : "text-slate-500 text-sm"}>
              쿠키로 상영관에 입장하고 크리에이터를 직접 후원하세요
            </p>
          </div>

          <div className={`backdrop-blur-sm rounded-2xl p-8 text-center border transition-all ${isDark ? "bg-white/10 border-white/10 text-white" : "bg-white/60 border-purple-100 text-slate-800 shadow-sm"}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-white/20" : "bg-purple-100"}`}>
              <Star className={`w-8 h-8 ${isDark ? "text-white" : "text-purple-600"}`} />
            </div>
            <h3 className="text-xl font-bold mb-2">리뷰 & 평가</h3>
            <p className={isDark ? "text-white/70" : "text-slate-500 text-sm"}>
              영화 감상 후 솔직한 리뷰를 남기고 다른 사람들과 공유하세요
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
