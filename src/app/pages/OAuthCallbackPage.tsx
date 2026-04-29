import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { authService, tokenStorage } from "../services/authService";
import { useUser } from "../contexts/UserContext";
import { toast } from "sonner";

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useUser();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // useSearchParams는 + 를 공백으로 디코딩하므로 raw URL에서 직접 추출
    const rawCode = window.location.search.match(/[?&]code=([^&]+)/)?.[1];
    const code = rawCode ? decodeURIComponent(rawCode) : null;
    if (!code) {
      toast.error("Google 로그인에 실패했습니다.");
      navigate("/login");
      return;
    }

    // 같은 code 재처리 방지 (remount 대비)
    const processedKey = `oauth_code_${code}`;
    if (sessionStorage.getItem(processedKey)) {
      navigate("/main");
      return;
    }
    sessionStorage.setItem(processedKey, "1");

    // 기존 stale 토큰 제거 (SESSION_EXPIRED 인터셉터 간섭 방지)
    tokenStorage.clearTokens();

    authService
      .googleLogin(code)
      .then(() => refreshUser())
      .then(() => {
        toast.success("Google 로그인 성공!");
        navigate("/main");
      })
      .catch(() => {
        // processedKey를 삭제하지 않음:
        // 백엔드가 Google에 code를 이미 교환한 뒤 실패하면 code는 소진된 상태.
        // processedKey를 삭제하면 브라우저 뒤로가기 시 같은 code로 재시도해 invalid_grant 발생.
        // 유저는 /login으로 돌아가 Google 버튼을 다시 눌러 새 code를 받아야 함.
        toast.error("Google 로그인에 실패했습니다. 다시 시도해주세요.");
        navigate("/login");
      });
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="text-white text-lg">Google 로그인 처리 중...</div>
    </div>
  );
}
