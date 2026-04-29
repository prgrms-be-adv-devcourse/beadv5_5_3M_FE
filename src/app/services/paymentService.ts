import apiClient from "./apiClient";

export type PaymentStatus = "READY" | "IN_PROGRESS" | "DONE" | "CANCELED" | "ABORTED";
export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PaymentInfo {
  paymentId: number;
  userId: string;
  amount: number;
  cookieAmount: number;
  status: PaymentStatus;
  paymentKey: string;
  orderId: string;
  createdAt: string;
}

export interface RefundInfo {
  refundId: number;
  paymentId: number;
  userId: string;
  cookieAmount: number;
  status: RefundStatus;
  createdAt: string;
}

export const paymentService = {
  /** 사용자의 전체 결제 내역 조회 */
  async getMyPayments(): Promise<PaymentInfo[]> {
    const res = await apiClient.get<PaymentInfo[]>("/api/payments/payment/users");
    return res.data;
  },

  /** 사용자의 전체 환불 내역 조회 */
  async getMyRefunds(): Promise<RefundInfo[]> {
    const res = await apiClient.get<RefundInfo[]>("/api/payments/refund/users");
    return res.data;
  },
};
