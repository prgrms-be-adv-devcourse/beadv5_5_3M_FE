import apiClient from "./apiClient";

export interface TicketCreateRequest {
  scheduleId: number;
}

export interface CartItemResponse {
  scheduleId: number;
  movieId: number;
  title: string;
  imageUrl: string | null;
  startTime: string;
  endTime: string;
  ticketingTime: string;
  cookie: number;
}

/** RESERVED = 가예약(구매 대기), CONFIRMED = 구매 완료 */
export type TicketStatus = "RESERVED" | "CONFIRMED";

export interface TicketResponse {
  ticketId: number;
  scheduleId: number;
  userId: string;
  movieId: number;
  status: TicketStatus;
  startTime: string;
  endTime: string;
  /** useTickets 훅이 movieService로 enrich 하는 런타임 필드 */
  movieTitle?: string;
  imageUrl?: string;
}

export interface PageResult<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

/** 백엔드 공용 PageResult: /api/tickets/schedules/open 등 (Spring Page와 달리 number 대신 page 사용) */
export interface BackendPageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type ScheduleStatus =
  | "CART"
  | "IN_PROGRESSING"
  | "TICKETING"
  | "STREAMING"
  | "FINISH";

export type SchedulePhase =
  | "CART_PERIOD"
  | "PROVISIONAL_PAYMENT"
  | "TICKETING_PERIOD";

export interface TicketableScheduleResponse {
  scheduleId: number;
  movieId: number;
  creatorId: string;
  title: string;
  imageUrl: string | null;
  startTime: string;
  endTime: string;
  ticketingTime: string;
  cookie: number;
  status: ScheduleStatus;
  phase: SchedulePhase;
  totalSeats: number;
  /** TICKETING 단계에서만 채워짐, 그 외 null */
  availableSeats: number | null;
}

export interface MovieScheduleResponse {
  scheduleId: number;
  startTime: string;
  endTime: string;
  ticketingTime: string;
  status: "CART" | "IN_PROGRESSING" | "TICKETING" | "STREAMING";
  totalSeats: number;
  /** TICKETING 단계에서만 채워짐, 그 외 null */
  availableSeats: number | null;
}

export interface QueueEntryResponse {
  type: "PURCHASED" | "QUEUED";
  ticket: TicketResponse | null;
  scheduleId: number | null;
  position: number | null;
}

export interface QueuePositionResponse {
  scheduleId: number;
  /** 0이면 대기열에 없음(이탈/완료), 1이상은 본인 순번 */
  position: number;
}

export const ticketService = {
  /** 내 티켓 목록 조회 */
  async getMyTickets(page = 0, size = 20): Promise<PageResult<TicketResponse>> {
    const res = await apiClient.get<PageResult<TicketResponse>>("/api/tickets", {
      params: { page, size },
    });
    return res.data;
  },

  /** 티켓 단건 조회 */
  async getTicketDetail(ticketId: number): Promise<TicketResponse> {
    const res = await apiClient.get<TicketResponse>(`/api/tickets/${ticketId}`);
    return res.data;
  },

  /** 가예약 → 구매 확정 (RESERVED → CONFIRMED, 쿠키 차감) */
  async payTicket(ticketId: number): Promise<TicketResponse> {
    const res = await apiClient.post<TicketResponse>(`/api/tickets/${ticketId}/pay`);
    return res.data;
  },

  /** 티켓 환불 (CONFIRMED → 삭제, 쿠키 복구) */
  async refundTicket(ticketId: number): Promise<void> {
    await apiClient.post(`/api/tickets/${ticketId}/refund`);
  },

  /** 티켓팅 진입 가능한 회차 목록 (CART/IN_PROGRESSING/TICKETING) */
  async listOpenSchedules(params: {
    status?: ScheduleStatus[];
    page: number;
    size: number;
    sort?: string;
  }): Promise<BackendPageResult<TicketableScheduleResponse>> {
    const queryParams: Record<string, string | number | string[]> = {
      page: params.page,
      size: params.size,
    };
    if (params.sort) queryParams.sort = params.sort;
    if (params.status && params.status.length > 0) {
      queryParams.status = params.status.join(",");
    }
    const res = await apiClient.get<BackendPageResult<TicketableScheduleResponse>>(
      "/api/tickets/schedules/open",
      { params: queryParams },
    );
    return res.data;
  },

  /** 티켓팅 큐 진입: 재고 있으면 즉시 구매, 없으면 대기열 등록 */
  async enterQueue(scheduleId: number): Promise<QueueEntryResponse> {
    const res = await apiClient.post<QueueEntryResponse>(
      `/api/queue/${scheduleId}/enter`,
    );
    return res.data;
  },

  /** 큐 순번 조회 (0=대기열에 없음) */
  async getQueuePosition(scheduleId: number): Promise<QueuePositionResponse> {
    const res = await apiClient.get<QueuePositionResponse>(
      `/api/queue/${scheduleId}/position`,
    );
    return res.data;
  },

  /** 영화별 진행 가능 회차 목록 (CART/IN_PROGRESSING/TICKETING/STREAMING, startTime ASC) */
  async listSchedulesByMovieId(movieId: number): Promise<MovieScheduleResponse[]> {
    const res = await apiClient.get<MovieScheduleResponse[]>(
      `/api/tickets/schedules/movie/${movieId}`,
    );
    return res.data;
  },
};

export const cartService = {
  /** 장바구니 담기 */
  async addCartItem(scheduleId: number): Promise<void> {
    await apiClient.post(`/api/cart/${scheduleId}`);
  },

  /** 장바구니 목록 조회 */
  async getCartItems(): Promise<CartItemResponse[]> {
    const res = await apiClient.get<CartItemResponse[]>("/api/cart");
    return res.data;
  },

  /** 장바구니 수요 조회 (몇 명이 담았는지) */
  async getCartCount(scheduleId: number): Promise<number> {
    const res = await apiClient.get<number>(`/api/cart/${scheduleId}/count`);
    return res.data;
  },

  /** 장바구니 항목 삭제 */
  async removeCartItem(scheduleId: number): Promise<void> {
    await apiClient.delete(`/api/cart/${scheduleId}`);
  },
};
