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

export function SignupPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    phone: "",
    ageGroup: "",
    gender: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [fieldStatus, setFieldStatus] = useState<{
    email: { type: "error" | "success" | ""; message: string };
    nickname: { type: "error" | "success" | ""; message: string };
  }>({
    email: { type: "", message: "" },
    nickname: { type: "", message: "" },
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "email") {
      setFieldStatus(prev => ({ ...prev, email: { type: "", message: "" } }));
      setCodeSent(false);
      setEmailVerified(false);
      setVerificationCode("");
    }
    if (field === "nickname") {
      setFieldStatus(prev => ({ ...prev, nickname: { type: "", message: "" } }));
    }
  };

  const handleSendCode = async () => {
    if (!formData.email) {
      setFieldStatus(prev => ({ ...prev, email: { type: "error", message: "이메일을 먼저 입력해주세요." } }));
      return;
    }
    setCodeSent(true);
    setFieldStatus(prev => ({ ...prev, email: { type: "success", message: "인증 코드가 발송되었습니다. (5분 내 입력)" } }));
    authService.sendVerificationCode(formData.email).catch(() => {});
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error("인증 코드를 입력해주세요.");
      return;
    }
    try {
      await authService.verifyEmailCode(formData.email, verificationCode);
      setEmailVerified(true);
      setFieldStatus(prev => ({ ...prev, email: { type: "success", message: "이메일 인증이 완료되었습니다." } }));
    } catch (error) {
      setFieldStatus(prev => ({ ...prev, email: { type: "error", message: error instanceof Error ? error.message : "인증에 실패했습니다." } }));
    }
  };

  const handleCheckNickname = async () => {
    if (!formData.nickname) {
      setFieldStatus(prev => ({ ...prev, nickname: { type: "error", message: "닉네임을 먼저 입력해주세요." } }));
      return;
    }
    try {
      const isAvailable = await authService.checkNicknameDuplicate(formData.nickname);
      if (isAvailable) {
        setFieldStatus(prev => ({ ...prev, nickname: { type: "success", message: "사용 가능한 닉네임입니다." } }));
      } else {
        setFieldStatus(prev => ({ ...prev, nickname: { type: "error", message: "사용 불가능한 닉네임입니다." } }));
      }
    } catch {
      setFieldStatus(prev => ({ ...prev, nickname: { type: "error", message: "닉네임 중복 확인에 실패했습니다." } }));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.nickname || !formData.ageGroup || !formData.gender) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (!emailVerified) {
      toast.error("이메일 인증을 완료해주세요.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.signup({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
        ageGroup: Number(formData.ageGroup),
        gender: formData.gender,
      });
      toast.success("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
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
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">뒤로</span>
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
          <CardTitle className={`text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>회원가입</CardTitle>
          <CardDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
            새로운 계정을 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={isDark ? "text-slate-300" : "text-slate-700"}>이메일 *</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  disabled={emailVerified}
                  className={`flex-1 ${isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={emailVerified}
                  className={`shrink-0 ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  onClick={handleSendCode}
                >
                  {codeSent ? "재발송" : "인증코드 발송"}
                </Button>
              </div>
              {codeSent && !emailVerified && (
                <div className="flex gap-2">
                  <Input
                    placeholder="인증 코드 6자리"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className={`flex-1 ${isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className={`shrink-0 ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                    onClick={handleVerifyCode}
                  >
                    확인
                  </Button>
                </div>
              )}
              {fieldStatus.email.message && (
                <p className={`text-sm ${fieldStatus.email.type === "success" ? "text-green-500" : "text-red-500"}`}>
                  {fieldStatus.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname" className={isDark ? "text-slate-300" : "text-slate-700"}>닉네임 *</Label>
              <div className="flex gap-2">
                <Input
                  id="nickname"
                  placeholder="닉네임"
                  value={formData.nickname}
                  onChange={(e) => handleChange("nickname", e.target.value)}
                  className={`flex-1 ${isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  className={`shrink-0 ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  onClick={handleCheckNickname}
                >
                  중복확인
                </Button>
              </div>
              {fieldStatus.nickname.message && (
                <p className={`text-sm ${fieldStatus.nickname.type === "success" ? "text-green-500" : "text-red-500"}`}>
                  {fieldStatus.nickname.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={isDark ? "text-slate-300" : "text-slate-700"}>비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={isDark ? "text-slate-300" : "text-slate-700"}>비밀번호 확인 *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className={isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageGroup" className={isDark ? "text-slate-300" : "text-slate-700"}>연령대 *</Label>
                <select
                  id="ageGroup"
                  value={formData.ageGroup}
                  onChange={(e) => handleChange("ageGroup", e.target.value)}
                  className={`w-full h-10 rounded-md border px-3 text-sm ${isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                >
                  <option value="">선택</option>
                  <option value="10">10대</option>
                  <option value="20">20대</option>
                  <option value="30">30대</option>
                  <option value="40">40대</option>
                  <option value="50">50대</option>
                  <option value="60">60대 이상</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className={isDark ? "text-slate-300" : "text-slate-700"}>성별 *</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className={`w-full h-10 rounded-md border px-3 text-sm ${isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                >
                  <option value="">선택</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className={isDark ? "text-slate-300" : "text-slate-700"}>연락처 (선택)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-0000-0000"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 shadow-lg shadow-purple-500/20 mt-4">
              {isLoading ? "처리 중..." : "회원가입"}
            </Button>

            <div className="text-center text-sm pt-4">
              <span className={isDark ? "text-slate-400" : "text-slate-500"}>이미 계정이 있으신가요?</span>{" "}
              <Button
                type="button"
                variant="link"
                className="text-purple-600 p-0 font-bold hover:text-purple-500"
                onClick={() => navigate("/login")}
              >
                로그인
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
