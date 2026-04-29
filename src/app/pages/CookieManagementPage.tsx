import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Cookie, CreditCard, Calendar, Filter, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/ui/header";
import apiClient from "../services/apiClient";
import { userService } from "../services/userService";
import { useUser } from "../contexts/UserContext";

declare global {
  function TossPayments(clientKey: string): any;
}

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || "";

const COOKIE_PACKAGES = [
  { amount: 10, price: 1000 },
  { amount: 50, price: 5000 },
  { amount: 100, price: 10000 },
  { amount: 200, price: 20000 },
];

interface Transaction {
  id: string;
  amount: number;       // 쿠키 수량
  wonAmount?: number;    // 원금 (결제 금액)
  type: string;         // CHARGE, USE, REFUND
  createdAt: string;
  paymentId?: string;   // CHARGE 항목의 경우 결제 ID (환불 시 필요)
  originalCookieAmount?: number;  // 원래 결제 쿠키 수 (부분 환불 계산용)
  refundedCookies?: number;       // 이미 환불된 쿠키 수
  rawCreatedAt?: string;          // 원본 ISO 날짜 (7일 계산용)
}

export function CookieManagementPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user, refreshUser, updateCookies } = useUser();
  const cookies = user?.cookieBalance ?? 0;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterStatus, setFilterStatus] = useState("모두");
  const [loading, setLoading] = useState(true);
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; transaction: Transaction | null }>({ open: false, transaction: null });
  const [refundCookieAmount, setRefundCookieAmount] = useState(0);

  // 결제/환불 데이터에서 쿠키 잔액 계산 + 거래 내역 조회
  const fetchTransactions = async () => {
    try {
      // 1) 결제 내역 조회
      const payData: any[] = await apiClient.get(`/api/payments/payment/users`).then(r => r.data).catch(() => []);

      // 2) 환불 내역 조회
      const refundData: any[] = await apiClient.get(`/api/payments/refund/users`).then(r => r.data).catch(() => []);

      // paymentId별 환불된 쿠키 합산
      const refundedCookiesMap = new Map<string, number>();
      refundData.forEach((r: any) => {
        if (r.status === "SUCCESS") {
          const prev = refundedCookiesMap.get(r.paymentId) || 0;
          refundedCookiesMap.set(r.paymentId, prev + (r.cookieAmount || r.amount));
        }
      });

      const merged: Transaction[] = [];

      // 결제 내역 → CHARGE 타입
      payData
        .filter((p: any) => p.status === "SUCCESS")
        .forEach((p: any) => {
          const cookieAmt = p.cookieAmount || p.amount;
          const refundedCookies = refundedCookiesMap.get(p.id) || 0;
          if (refundedCookies >= cookieAmt) return; // 완전 환불된 항목은 숨김
          merged.push({
            id: p.id,
            amount: cookieAmt,
            wonAmount: p.amount,
            type: "CHARGE",
            createdAt: new Date(p.createdAt).toLocaleString("ko-KR"),
            paymentId: p.id,
            originalCookieAmount: cookieAmt,
            refundedCookies,
            rawCreatedAt: p.createdAt,
          });
        });

      // 환불 내역 → REFUND 타입
      refundData
        .filter((r: any) => r.status === "SUCCESS")
        .forEach((r: any) => {
          merged.push({
            id: r.id,
            amount: r.cookieAmount || r.amount,
            type: "REFUND",
            createdAt: new Date(r.createdAt).toLocaleString("ko-KR"),
            rawCreatedAt: r.createdAt, // 정렬용 ISO 타임스탬프 추가
          });
        });

      // userInfo.cookieBalance 대신 전역 refreshUser 호출
      await refreshUser();

      // 최신순 정렬 (ISO 문자열 비교는 시간 순 정렬에 안전함)
      merged.sort((a, b) => {
        const timeA = a.rawCreatedAt ? new Date(a.rawCreatedAt).getTime() : 0;
        const timeB = b.rawCreatedAt ? new Date(b.rawCreatedAt).getTime() : 0;
        return timeB - timeA;
      });
      setTransactions(merged);
    } catch (e) {
      console.error("거래 내역 조회 실패:", e);
    }
  };

  // Toss 결제 콜백 처리 + 초기 데이터 로드
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");
    const cookieAmount = params.get("cookieAmount");

    if (paymentKey && orderId && amount && cookieAmount) {
      // Toss 결제 성공 → confirm 호출 (Payment 생성 + PG 승인을 한 번에)
      window.history.replaceState({}, "", "/cookies");
      window.history.pushState({}, "", "/cookies");
      confirmPayment(paymentKey, orderId, parseInt(amount), parseInt(cookieAmount)).then(async () => {
        // 즉시 화면에 반영 (낙관적 업데이트) - 헤더와 동기화
        updateCookies((user?.cookieBalance ?? 0) + parseInt(cookieAmount));
        toast.success(`쿠키 ${cookieAmount}개 충전 완료!`);
        fetchTransactions().finally(() => setLoading(false));
        // 백그라운드에서 Kafka 처리 완료 후 실제 잔액으로 동기화
        setTimeout(() => refreshUser(), 5000);
      });
      return;
    }

    const errorCode = params.get("code");
    if (errorCode) {
      toast.error(`결제 실패: ${params.get("message") || errorCode}`);
      window.history.replaceState({}, "", "/cookies");
    }

    fetchTransactions().finally(() => setLoading(false));
  }, []);

  // 결제 승인 (Toss 리다이렉트 후 호출 — Payment 생성 + PG 승인을 한 번에 처리)
  const confirmPayment = async (paymentKey: string, orderId: string, amount: number, cookieAmount: number) => {
    try {
      toast.info("결제 승인 처리 중...");
      const json = await apiClient.post("/api/payments/payment/confirm", { paymentKey, orderId, amount, cookieAmount }).then(r => r.data);
      toast.success(`결제 완료! 쿠키 ${json.cookieAmount}개 충전`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "결제 승인 실패");
    }
  };

  // 쿠키 충전 (바로 Toss 결제창 — createPayment 단계 없음)
  const handlePurchase = async (pkg: typeof COOKIE_PACKAGES[0]) => {
    try {
      const orderId = `order-${Date.now()}`;

      const tossPayments = TossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: user?.email || "guest" });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: pkg.price },
        orderId,
        orderName: `쿠키 ${pkg.amount}개 충전`,
        successUrl: `${window.location.origin}/cookies?amount=${pkg.price}&cookieAmount=${pkg.amount}`,
        failUrl: `${window.location.origin}/cookies?fail=true`,
      });
    } catch (e: any) {
      if (e?.code === "USER_CANCEL") {
        toast.info("결제가 취소되었습니다.");
      } else {
        toast.error(e?.message || "결제 처리 중 오류가 발생했습니다.");
      }
    }
  };

  // 환불 다이얼로그 열기
  const openRefundDialog = (transaction: Transaction) => {
    if (!transaction.paymentId) {
      toast.error("환불할 수 없는 항목입니다.");
      return;
    }
    // 7일 초과 체크
    if (transaction.rawCreatedAt) {
      const purchaseDate = new Date(transaction.rawCreatedAt);
      const daysDiff = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7) {
        toast.error("환불 가능 기간(구매 후 7일)이 지났습니다.");
        return;
      }
    }
    const remaining = (transaction.originalCookieAmount || transaction.amount) - (transaction.refundedCookies || 0);
    setRefundCookieAmount(remaining);
    setRefundDialog({ open: true, transaction });
  };

  // 환불 실행 (생성 → 자동 승인)
  const executeRefund = async () => {
    const transaction = refundDialog.transaction;
    if (!transaction?.paymentId) return;

    const remaining = (transaction.originalCookieAmount || transaction.amount) - (transaction.refundedCookies || 0);
    if (refundCookieAmount <= 0 || refundCookieAmount > remaining) {
      toast.error(`1 ~ ${remaining}개 사이로 입력하세요.`);
      return;
    }

    setRefundDialog({ open: false, transaction: null });
    setProcessingRefund(transaction.id);
    try {
      // 비례 원금 계산
      const wonAmount = Math.floor(refundCookieAmount * (transaction.wonAmount || 0) / (transaction.originalCookieAmount || transaction.amount));

      // 1. 환불 요청 생성
      const reqJson = await apiClient.post("/api/payments/refund", {
        paymentId: transaction.paymentId,
        cookieAmount: refundCookieAmount,
      }).then(r => r.data);

      const refundId = reqJson.id;

      // 2. 환불 승인 (Toss PG 취소 처리)
      await apiClient.post(`/api/payments/refund/${refundId}/approve`);
      toast.success(`쿠키 ${refundCookieAmount}개 환불 완료! (${wonAmount.toLocaleString()}원)`);
      // 즉시 화면에 반영 (낙관적 업데이트) - 헤더와 동기화
      updateCookies((user?.cookieBalance ?? 0) - refundCookieAmount);
      await fetchTransactions();
      // 백그라운드에서 실제 잔액으로 동기화
      setTimeout(() => refreshUser(), 5000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "환불 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessingRefund(null);
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "CHARGE": return "충전";
      case "USE": return "사용";
      case "REFUND": return "환불";
      default: return type;
    }
  };

  const isPositive = (type: string) => type === "CHARGE";

  const filteredTransactions = transactions.filter((t) => {
    if (filterStatus === "결제" && t.type !== "CHARGE") return false;
    if (filterStatus === "환불" && t.type !== "REFUND") return false;
    return true;
  });

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header title="쿠키 관리" showBackButton />

      <main className="container mx-auto px-6 py-8">
        {/* Current Balance */}
        <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 border-0 mb-8 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="text-white/80 mb-2">보유 쿠키</div>
              <div className="flex items-center justify-center gap-3">
                <Cookie className="w-12 h-12 text-amber-400" />
                <span className="text-6xl font-bold text-white">{cookies.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Packages */}
        <Card className={`border-none shadow-xl mb-8 transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
              <CreditCard className="w-5 h-5 text-purple-500" />
              쿠키 충전 (Toss 결제)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {COOKIE_PACKAGES.map((pkg, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl text-center space-y-4 transition-all border ${isDark ? "bg-slate-800 hover:bg-slate-800/80 border-slate-700" : "bg-slate-50 hover:bg-purple-50 border-slate-200 hover:border-purple-200 shadow-sm"}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Cookie className="w-8 h-8 text-amber-400" />
                    <span className={`text-3xl font-bold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>{pkg.amount}</span>
                  </div>
                  <div className="text-2xl font-black text-purple-600">
                    {pkg.price.toLocaleString()}원
                  </div>
                  <Button
                    type="button"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-purple-500/20"
                    onClick={() => handlePurchase(pkg)}
                  >
                    구매하기
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className={`border-none shadow-xl transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className={`flex items-center gap-2 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                <Calendar className="w-5 h-5 text-purple-500" />
                결제/환불 내역
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className={`w-28 h-10 transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white"}>
                    <SelectItem value="모두">모두</SelectItem>
                    <SelectItem value="결제">충전</SelectItem>
                    <SelectItem value="환불">환불</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                거래 내역이 없습니다
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`p-5 rounded-2xl flex items-center justify-between border transition-colors ${isDark ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100 shadow-sm"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDark ? "bg-slate-800" : "bg-white shadow-sm"}`}>
                        <Cookie className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                            {isPositive(transaction.type) ? "+" : "-"}
                            {transaction.amount.toLocaleString()} 쿠키
                          </span>
                          <Badge
                            className={`font-semibold ${isPositive(transaction.type)
                              ? "bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800"
                              : "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800"
                              }`}
                          >
                            {typeLabel(transaction.type)}
                          </Badge>
                        </div>
                        <div className={`text-sm font-medium transition-colors ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {transaction.createdAt}
                        </div>
                      </div>
                    </div>
                    {/* 충전 항목에 환불 가능한 쿠키가 남아 있고, 7일 이내일 때만 환불 버튼 표시 */}
                    {transaction.type === "CHARGE" && transaction.paymentId &&
                      ((transaction.originalCookieAmount || transaction.amount) - (transaction.refundedCookies || 0)) > 0 &&
                      (!transaction.rawCreatedAt || (Date.now() - new Date(transaction.rawCreatedAt).getTime()) / (1000 * 60 * 60 * 24) <= 7) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/30"
                          disabled={processingRefund === transaction.id}
                          onClick={() => openRefundDialog(transaction)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          {processingRefund === transaction.id ? "처리중..." : "환불"}
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 부분 환불 다이얼로그 */}
      <Dialog open={refundDialog.open} onOpenChange={(open) => !open && setRefundDialog({ open: false, transaction: null })}>
        <DialogContent className={isDark ? "bg-slate-900 border-slate-700 text-white" : ""}>
          <DialogHeader>
            <DialogTitle>쿠키 환불</DialogTitle>
            <DialogDescription>환불할 쿠키 수량을 입력하세요.</DialogDescription>
          </DialogHeader>
          {refundDialog.transaction && (() => {
            const t = refundDialog.transaction!;
            const remaining = (t.originalCookieAmount || t.amount) - (t.refundedCookies || 0);
            const calcWon = Math.floor(refundCookieAmount * (t.wonAmount || 0) / (t.originalCookieAmount || t.amount));
            const daysLeft = t.rawCreatedAt ? Math.max(0, Math.ceil(7 - (Date.now() - new Date(t.rawCreatedAt).getTime()) / (1000 * 60 * 60 * 24))) : 0;
            return (
              <div className="space-y-4 py-2">
                <div className={`text-sm space-y-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <div>원래 충전: {t.originalCookieAmount || t.amount}개 ({(t.wonAmount || 0).toLocaleString()}원)</div>
                  {(t.refundedCookies || 0) > 0 && <div>이미 환불됨: {t.refundedCookies}개</div>}
                  <div>환불 가능: 최대 {remaining}개</div>
                  <div className="text-orange-500">환불 마감: {daysLeft}일 남음</div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    환불 쿠키 수량
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={remaining}
                    value={refundCookieAmount}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setRefundCookieAmount(Math.min(v, remaining));
                    }}
                    className={isDark ? "bg-slate-800 border-slate-600 text-white" : ""}
                  />
                </div>
                <div className={`p-3 rounded-xl text-center ${isDark ? "bg-slate-800" : "bg-purple-50"}`}>
                  <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>환불 예상 금액</div>
                  <div className="text-2xl font-bold text-purple-600">{calcWon.toLocaleString()}원</div>
                  <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>({refundCookieAmount}개 쿠키)</div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog({ open: false, transaction: null })}>
              취소
            </Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={executeRefund}>
              환불하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
