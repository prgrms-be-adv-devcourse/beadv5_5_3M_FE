import creatorApiClient from "./creatorApiClient";

export interface CreatorMe {
  creatorId: string;
  email: string;
  nickname: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export const creatorService = {
  /** 크리에이터 본인 정보 조회 */
  async getMe(): Promise<CreatorMe> {
    const res = await creatorApiClient.get<CreatorMe>("/api/creators/me");
    return res.data;
  }
};
