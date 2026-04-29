export interface Movie {
  id: number;
  title: string;
  creator: string;
  genre: string;
  rating: number;
  poster: string;
  duration?: number;
  time?: string;
  schedule?: string;
  views?: number;
  revenue?: number;
  status?: "public" | "private";
  tags?: string[];
  description?: string;
  price?: number;
}

export interface Creator {
  id: number;
  name: string;
  nickname?: string;
  tags: string[];
  followers: string;
  bio?: string;
  totalMovies?: number;
  totalViews?: number;
  averageRating?: number;
  avatar?: string;
}

export interface Settlement {
  id: number;
  amount: number;
  status: string;
  requestDate: string;
  completeDate: string;
}

export interface ScheduleItem {
  id: number;
  movieTitle: string;
  time: string;
  status: string;
}

export const CATEGORIES = [
  "전체", "액션", "SF", "로맨스", "스릴러", "코미디", "판타지", "호러", "다큐멘터리", "애니메이션"
];

export const MOCK_MOVIES: Movie[] = [
  {
    id: 1,
    title: "밤의 속삭임",
    creator: "김감독",
    genre: "스릴러",
    rating: 4.5,
    poster: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop",
    price: 5,
    tags: ["미스터리", "스릴러"],
    description: "어느 조용한 마을에서 시작된 미스터리한 사건들. 진실을 찾아가는 한 탐정의 이야기를 그린 스릴러 영화입니다.",
  },
  {
    id: 2,
    title: "별이 빛나는 밤",
    creator: "박로맨스",
    genre: "로맨스",
    rating: 4.8,
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
    price: 5,
    tags: ["로맨스", "드라마"],
    description: "아름다운 밤하늘 아래 펼쳐지는 두 남녀의 순수한 사랑 이야기.",
  },
  {
    id: 3,
    title: "도시의 그림자",
    creator: "최액션",
    genre: "액션",
    rating: 4.2,
    poster: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=400&h=600&fit=crop",
    price: 5,
    tags: ["액션", "범죄"],
    description: "거대 도시의 어두운 이면, 정의를 위해 싸우는 이들의 뜨거운 액션.",
  },
  {
    id: 4,
    title: "기억의 조각",
    creator: "정감독",
    genre: "드라마",
    rating: 4.6,
    poster: "https://images.unsplash.com/photo-1485081666276-03c39c44502?w=400&h=600&fit=crop",
    price: 5,
    tags: ["드라마", "감동"],
    description: "잃어버린 기억을 찾아 떠나는 특별한 여정.",
  },
  {
    id: 5,
    title: "웃음꽃",
    creator: "강코믹",
    genre: "코미디",
    rating: 4.3,
    poster: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
    price: 3,
    tags: ["코미디", "가족"],
    description: "지친 일상에 웃음과 감동을 선사할 유쾌한 가족 코미디.",
  },
  {
    id: 6,
    title: "사이버 시티",
    creator: "이SF",
    genre: "SF",
    rating: 4.4,
    poster: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop",
    price: 7,
    tags: ["SF", "미래"],
    description: "2077년, 고도로 발달한 과학 문명 뒤에 가려진 인류의 미래.",
  },
];

export const MOCK_UPCOMING_MOVIES: Movie[] = [
  { id: 14, title: "리듬 앤 블루스", creator: "이음악", genre: "음악/드라마", rating: 4.5, schedule: "2025.01.10", time: "18:00 - 20:15", poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=600&fit=crop" },
  { id: 15, title: "내일의 해", creator: "박드라마", genre: "드라마", rating: 4.6, schedule: "2025.01.20", time: "16:00 - 18:00", poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop" },
  { id: 16, title: "폭풍 속으로", creator: "강액션", genre: "액션", rating: 4.3, schedule: "2025.02.05", time: "22:00 - 23:50", poster: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop" },
];

export const TOP_CREATORS: Creator[] = [
  { 
    id: 1, 
    name: "이SF", 
    tags: ["SF", "판타지"], 
    followers: "12.4k",
    bio: "미래를 그리는 SF 전문 크리에이터 이SF입니다. 상상력이 현실이 되는 공간을 지향합니다.",
    totalMovies: 5,
    totalViews: 15400,
    averageRating: 4.6,
    avatar: "" 
  },
  { 
    id: 2, 
    name: "김감독", 
    tags: ["스릴러", "드라마"], 
    followers: "8.9k",
    bio: "독립영화를 사랑하는 크리에이터입니다. 관객과 함께 호흡하는 영화를 만들고 싶습니다.",
    totalMovies: 3,
    totalViews: 5432,
    averageRating: 4.5,
    avatar: "" 
  },
  { 
    id: 3, 
    name: "박로맨스", 
    tags: ["로맨스", "코미디"], 
    followers: "15.1k",
    bio: "사랑과 웃음을 전하는 박로맨스입니다. 당신의 일상에 작은 설렘을 더해드릴게요.",
    totalMovies: 7,
    totalViews: 28900,
    averageRating: 4.8,
    avatar: "" 
  },
];

export const SETTLEMENTS: Settlement[] = [
  { id: 1, amount: 150000, status: "완료", requestDate: "2026-03-10", completeDate: "2026-03-13" },
  { id: 2, amount: 200000, status: "확정", requestDate: "2026-03-15", completeDate: "-" },
  { id: 3, amount: 80000, status: "요청", requestDate: "2026-03-17", completeDate: "-" },
];

export const MOCK_SCHEDULE_ITEMS: ScheduleItem[] = [
  { id: 1, movieTitle: "밤의 속삭임", time: "10:00 - 11:38", status: "대기" },
  { id: 2, movieTitle: "밤의 속삭임", time: "13:00 - 14:38", status: "확정" },
  { id: 3, movieTitle: "별이 빛나는 밤", time: "16:00 - 17:45", status: "대기" },
  { id: 4, movieTitle: "별이 빛나는 밤", time: "19:00 - 20:45", status: "대기" },
  { id: 5, movieTitle: "도시의 그림자", time: "22:00 - 23:52", status: "대기" },
  { id: 6, movieTitle: "밤의 속삭임", time: "08:00 - 09:38", status: "대기" },
  { id: 7, movieTitle: "별이 빛나는 밤", time: "11:00 - 12:45", status: "대기" },
];

export const CREATOR_MOVIES: Movie[] = [
  { id: 1, title: "밤의 속삭임", status: "public", views: 1234, revenue: 61700, creator: "나", genre: "스릴러", rating: 4.5, poster: "" },
  { id: 2, title: "별이 빛나는 밤", status: "public", views: 2456, revenue: 122800, creator: "나", genre: "로맨스", rating: 4.8, poster: "" },
];

export const MOCK_SHOWTIMES = [
  { id: 1, date: "2024.11.10 (오늘)", time: "14:00 - 15:38", status: "상영중", cookies: 5 },
  { id: 2, date: "2024.11.10 (오늘)", time: "17:00 - 18:38", status: "예정", cookies: 5 },
  { id: 3, date: "2024.11.10 (오늘)", time: "20:00 - 21:38", status: "예정", cookies: 5 },
  { id: 4, date: "2024.11.11 (내일)", time: "10:00 - 11:38", status: "예정", cookies: 5 },
  { id: 5, date: "2024.11.11 (내일)", time: "13:00 - 14:38", status: "예정", cookies: 5 },
];

export const MOCK_ALL_MOVIES: Movie[] = [
  ...MOCK_MOVIES,
  ...MOCK_UPCOMING_MOVIES,
  { id: 21, title: "기억의 조각", creator: "정감독", genre: "드라마", rating: 4.6, poster: "https://images.unsplash.com/photo-1485081666276-03c39c44502?w=400&h=600&fit=crop" },
  { id: 22, title: "웃음꽃", creator: "강코믹", genre: "코미디", rating: 4.3, poster: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop" },
  { id: 23, title: "사이버 시티", creator: "이SF", genre: "SF", rating: 4.4, poster: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop" },
  { id: 24, title: "미지의 숲", creator: "최판타지", genre: "판타지", rating: 4.1, poster: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop" },
];

export const TRENDING_MOVIES = MOCK_MOVIES.slice(0, 4);

export interface UserReview {
  id: number;
  movieTitle: string;
  rating: number;
  content: string;
  date: string;
}

export interface CookieHistory {
  id: number;
  movieTitle: string;
  date: string;
  playDate: string;
  amount: number;
  status: "사용" | "환불됨";
}

export const MOCK_WATCHED_MOVIES: Movie[] = MOCK_MOVIES.slice(0, 3);

export const MOCK_COOKIE_HISTORY: CookieHistory[] = [
  { id: 1, movieTitle: "밤의 속삭임", date: "2026-03-18 14:20", playDate: "2026-03-18 15:00", amount: 5, status: "사용" },
  { id: 2, movieTitle: "별이 빛나는 밤", date: "2026-03-17 09:15", playDate: "2026-03-17 10:30", amount: 3, status: "사용" },
  { id: 3, movieTitle: "도시의 그림자", date: "2026-03-25 22:40", playDate: "2026-03-25 23:30", amount: 5, status: "사용" },
  { id: 4, movieTitle: "밤의 속삭임", date: "2026-03-22 18:05", playDate: "2026-03-22 19:00", amount: 5, status: "사용" },
];

export const MOCK_USER_REVIEWS: UserReview[] = [
  { id: 1, movieTitle: "밤의 속삭임", rating: 5, content: "정말 감동적인 영화였습니다. 연출이 최고예요!", date: "2026-03-18" },
  { id: 2, movieTitle: "별이 빛나는 밤", rating: 4, content: "영상미가 훌륭합니다. 다만 결말이 조금 아쉽네요. 다음 작품도 기대됩니다.", date: "2026-03-17" },
];
