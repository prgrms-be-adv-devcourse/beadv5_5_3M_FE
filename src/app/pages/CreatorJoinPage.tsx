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

export function CreatorJoinPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    phoneNumber: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: "error" | "success" | ""; message: string }>({
    type: "",
    message: "",
  });
  const [nicknameStatus, setNicknameStatus] = useState<{ type: "error" | "success" | ""; message: string }>({
    type: "",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "email") {
      setEmailStatus({ type: "", message: "" });
    }
    if (field === "nickname") {
      setNicknameStatus({ type: "", message: "" });
    }
  };

  const handleCheckEmail = async () => {
    if (!formData.email) {
      setEmailStatus({ type: "error", message: "이메일을 먼저 입력해주세요." });
      return;
    }
    try {
      const isAvailable = await authService.checkCreatorEmailDuplicate(formData.email);
      if (isAvailable) {
        setEmailStatus({ type: "success", message: "사용 가능한 이메일입니다." });
      } else {
        setEmailStatus({ type: "error", message: "사용 불가능한 이메일입니다." });
      }
    } catch {
      setEmailStatus({ type: "error", message: "이메일 중복 확인에 실패했습니다." });
    }
  };

  const handleCheckNickname = async () => {
    if (!formData.nickname) {
      setNicknameStatus({ type: "error", message: "닉네임을 먼저 입력해주세요." });
      return;
    }
    try {
      const isAvailable = await authService.checkCreatorNicknameDuplicate(formData.nickname);
      if (isAvailable) {
        setNicknameStatus({ type: "success", message: "사용 가능한 닉네임입니다." });
      } else {
        setNicknameStatus({ type: "error", message: "이미 사용 중인 닉네임입니다." });
      }
    } catch {
      setNicknameStatus({ type: "error", message: "닉네임 중복 확인에 실패했습니다." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.nickname || !formData.bankName || !formData.accountNumber || !formData.accountHolder) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (nicknameStatus.type !== "success") {
      toast.error("닉네임 중복 확인을 해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.creatorSignup({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
        phoneNumber: formData.phoneNumber,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountHolder: formData.accountHolder,
      });
      toast.success("크리에이터 가입이 완료되었습니다!");
      navigate("/creator/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (extra = "") =>
    `${extra} ${isDark ? "bg-slate-800/50 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`;

  const labelClass = isDark ? "text-slate-300" : "text-slate-700";

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-orange-900 via-amber-900 to-yellow-900" : "bg-gradient-to-br from-orange-50 via-white to-amber-50"}`}>
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

      <Card className={`w-full max-w-md shadow-2xl transition-all ${isDark ? "bg-slate-900/40 border-slate-800 backdrop-blur-md" : "bg-white/80 border-orange-100 backdrop-blur-md"}`}>
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-8 h-8 text-orange-500" />
            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>CineStream</span>
          </div>
          <CardTitle className={`text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>크리에이터 가입</CardTitle>
          <CardDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
            크리에이터 계정을 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email" className={labelClass}>이메일 *</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClass("flex-1")}
                />
                <Button
                  type="button"
                  variant="outline"
                  className={`shrink-0 ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  onClick={handleCheckEmail}
                >
                  중복확인
                </Button>
              </div>
              {emailStatus.message && (
                <p className={`text-sm ${emailStatus.type === "success" ? "text-green-500" : "text-red-500"}`}>
                  {emailStatus.message}
                </p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password" className={labelClass}>비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={inputClass()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={labelClass}>비밀번호 확인 *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className={inputClass()}
              />
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="nickname" className={labelClass}>닉네임 *</Label>
              <div className="flex gap-2">
                <Input
                  id="nickname"
                  placeholder="닉네임을 입력해주세요"
                  value={formData.nickname}
                  onChange={(e) => handleChange("nickname", e.target.value)}
                  className={inputClass("flex-1")}
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
              {nicknameStatus.message && (
                <p className={`text-sm ${nicknameStatus.type === "success" ? "text-green-500" : "text-red-500"}`}>
                  {nicknameStatus.message}
                </p>
              )}
            </div>

            {/* 연락처 */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className={labelClass}>연락처 (선택)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="010-0000-0000"
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                className={inputClass()}
              />
            </div>

            {/* 정산 계좌 */}
            <div className={`space-y-3 pt-2 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
              <p className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>정산 계좌 정보 *</p>
              <div className="space-y-2">
                <Label htmlFor="bankName" className={labelClass}>은행명</Label>
                <Input
                  id="bankName"
                  placeholder="예) 국민은행"
                  value={formData.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  className={inputClass()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className={labelClass}>계좌번호</Label>
                <Input
                  id="accountNumber"
                  placeholder="- 없이 입력"
                  value={formData.accountNumber}
                  onChange={(e) => handleChange("accountNumber", e.target.value)}
                  className={inputClass()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolder" className={labelClass}>예금주</Label>
                <Input
                  id="accountHolder"
                  placeholder="예금주명"
                  value={formData.accountHolder}
                  onChange={(e) => handleChange("accountHolder", e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 shadow-lg shadow-orange-500/20 mt-2">
              {isLoading ? "처리 중..." : "크리에이터 가입"}
            </Button>

            <div className="text-center text-sm pt-2">
              <span className={isDark ? "text-slate-400" : "text-slate-500"}>이미 계정이 있으신가요?</span>{" "}
              <Button
                type="button"
                variant="link"
                className="text-orange-500 p-0 font-bold hover:text-orange-400"
                onClick={() => navigate("/creator/login")}
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
