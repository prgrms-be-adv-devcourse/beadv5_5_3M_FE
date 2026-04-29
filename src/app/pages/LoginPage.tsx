import { useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Film, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../services/authService";

import { useUser } from "../contexts/UserContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { refreshUser } = useUser();
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
      await authService.login(email, password);
      await refreshUser(); // 로그인 성공 즉시 전역 정보 로드
      toast.success("로그인 성공!");
      navigate("/main");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900" : "bg-gradient-to-br from-purple-50 via-white to-blue-50"}`}>
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

      <Card className={`w-full max-w-md shadow-2xl transition-all ${isDark ? "bg-slate-900/40 border-slate-800 backdrop-blur-md" : "bg-white/80 border-purple-100 backdrop-blur-md"}`}>
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Film className="w-8 h-8 text-purple-600" />
            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>CineStream</span>
          </div>
          <CardTitle className={`text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>로그인</CardTitle>
          <CardDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
            이메일과 비밀번호로 로그인하세요
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
            
            <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 shadow-lg shadow-purple-500/20 mt-4">
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? "border-slate-700" : "border-slate-200"}`} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-3 ${isDark ? "bg-slate-900/40 text-slate-400" : "bg-white/80 text-slate-500"}`}>또는</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className={`w-full h-12 flex items-center justify-center gap-3 font-semibold ${isDark ? "border-slate-700 text-white hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              onClick={() => { window.location.href = authService.getGoogleLoginUrl(); }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 로그인
            </Button>

            <div className="text-center space-y-2 pt-4">
              <Button
                type="button"
                variant="link"
                className="text-sm text-purple-600 hover:text-purple-500"
                onClick={() => toast.info("비밀번호 재설정 링크를 이메일로 발송했습니다.")}
              >
                비밀번호를 잊으셨나요?
              </Button>
              <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                계정이 없으신가요?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="text-purple-600 p-0 font-bold hover:text-purple-500"
                  onClick={() => navigate("/signup")}
                >
                  회원가입
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
