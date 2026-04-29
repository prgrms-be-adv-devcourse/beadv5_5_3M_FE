import { useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Video, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../services/authService";

export function CreatorLoginPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.creatorLogin(email, password);
      toast.success("로그인 성공!");
      navigate("/creator");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-orange-900 via-amber-900 to-yellow-900" : "bg-gradient-to-br from-orange-50 via-white to-amber-50"}`}>
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <Button
          variant="ghost"
          className={`rounded-full transition-colors flex items-center gap-2 ${isDark ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-black/5 hover:text-slate-900"}`}
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">홈으로</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`transition-colors rounded-full ${isDark ? "text-yellow-400 hover:text-yellow-300 hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-black/5"}`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      <Card className={`w-full max-w-md shadow-2xl transition-all ${isDark ? "bg-slate-900/40 border-slate-800 backdrop-blur-md" : "bg-white/80 border-orange-100 backdrop-blur-md"}`}>
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-8 h-8 text-orange-500" />
            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>CineStream</span>
          </div>
          <CardTitle className={`text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>크리에이터 로그인</CardTitle>
          <CardDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
            크리에이터 계정으로 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={isDark ? "text-slate-300" : "text-slate-700"}>이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={isDark ? "text-slate-300" : "text-slate-700"}>비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 shadow-lg shadow-orange-500/20 mt-4">
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            <div className="text-center pt-4">
              <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                크리에이터 계정이 없으신가요?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="text-orange-500 p-0 font-bold hover:text-orange-400"
                  onClick={() => navigate("/creator/join")}
                >
                  크리에이터 가입
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
