import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Search, Compass, Flame, Star, Sparkles, PlayCircle, Sun, Moon, ChevronLeft, ChevronRight, Plus, TrendingUp } from "lucide-react";
import { Header } from "../components/ui/header";

import { useSearchMovies, useCategories, useAllPublicMovies } from "../hooks/useMovies";
import { getPlaceholderPoster, getImageUrl, movieService, ApiMovieCard } from "../services/movieService";

/**
 * ES에서 받은 highlight 문자열(<em>XXX</em> 포함)을 JSX로 안전하게 렌더링.
 * dangerouslySetInnerHTML 대신 split + map 방식 → XSS 걱정 X
 */
function renderHighlighted(highlighted: string | null | undefined, fallback: string) {
  const raw = highlighted ?? fallback;
  if (!highlighted) return raw; // 하이라이트 없으면 그냥 문자열
  const parts = raw.split(/(<em>.*?<\/em>)/g);
  return parts.map((part, i) => {
    const match = part.match(/^<em>(.*?)<\/em>$/);
    if (match) {
      return (
        <em
          key={i}
          style={{
            backgroundColor: "#FDE68A",
            color: "#0F172A",
            fontStyle: "normal",
            padding: "0 2px",
            borderRadius: "2px",
          }}
        >
          {match[1]}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function SearchPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryIds, setActiveCategoryIds] = useState<number[]>([]); // 빈 배열 = 전체
  const scrollRef = useRef<HTMLDivElement>(null);

  const { categories, loading: categoriesLoading } = useCategories();
  const { movies: allMovies, loading: allLoading } = useAllPublicMovies();

  // ES 확장 기능 상태
  const [autocompleteResults, setAutocompleteResults] = useState<Array<{ movieId: number; title: string; creatorNickname: string }>>([]);
  const [popularKeywords, setPopularKeywords] = useState<Array<{ keyword: string; count: number }>>([]);
  const [filterCounts, setFilterCounts] = useState<{ categories: Array<{ categoryName: string; count: number }> } | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // 페이지 열릴 때: 인기검색어 + 필터카운트 로딩
  useEffect(() => {
    movieService.getPopularKeywords(10).then(data => setPopularKeywords(data.keywords)).catch(() => {});
    movieService.getFilterCounts().then(data => setFilterCounts(data)).catch(() => {});
  }, []);

  // 검색어 디바운스 (300ms) — 자동완성/검색 둘 다 참조
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 타이핑할 때: 자동완성 (1글자 이상, 디바운스 후, IME 조합 완료 후만)
  useEffect(() => {
    const q = debouncedQuery.trim();
    // 한글 자모(ㄱ~ㅎ, ㅏ~ㅣ) 단독 포함 시 IME 조합 미완성 → 스킵
    const hasHangulJamo = /[\u3131-\u318E]/.test(q);
    if (q.length >= 1 && !hasHangulJamo) {
      movieService.autocomplete(q, 5)
        .then(data => { setAutocompleteResults(data.suggestions); setShowAutocomplete(true); })
        .catch(() => setAutocompleteResults([]));
    } else {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
  }, [debouncedQuery]);

  const toggleCategory = (id: number) => {
    setActiveCategoryIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(c => c !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const [genreResults, setGenreResults] = useState<ApiMovieCard[]>([]);
  const [genreLoading, setGenreLoading] = useState(false);

  // 장르 필터링 (OR 조건)
  useEffect(() => {
    if (activeCategoryIds.length === 0) {
      setGenreResults([]);
      return;
    }

    setGenreLoading(true);
    Promise.all(activeCategoryIds.map(id => movieService.getMoviesByGenre(id)))
      .then(results => {
        // 중복 제거하며 병합
        const merged = new Map<number, ApiMovieCard>();
        results.flat().forEach(m => merged.set(m.movieId, m));
        setGenreResults(Array.from(merged.values()));
      })
      .catch(() => setGenreResults([]))
      .finally(() => setGenreLoading(false));
  }, [activeCategoryIds]);

  // 검색 결과 결정
  const isSearchActive = searchQuery !== "" || activeCategoryIds.length > 0;

  // 텍스트 검색 결과 (텍스트 있을 때만)
  const { movies: textResults, loading: textLoading } = useSearchMovies(
    debouncedQuery.trim().length > 0 ? debouncedQuery.trim() : ""
  );

  // 최종 결과 계산
  let searchResults: ApiMovieCard[] = [];
  if (debouncedQuery.trim().length > 0) {
    searchResults = textResults;
  } else if (activeCategoryIds.length > 0) {
    searchResults = genreResults;
  }

  const searchLoading = textLoading || genreLoading;

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header title="둘러보기" showBackButton />

      <main className="container mx-auto px-6 py-8">
        {/* Search Hero */}
        <div className="max-w-3xl mx-auto mb-12 text-center scale-95 md:scale-100 transition-transform">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6 drop-shadow-sm leading-tight">
            어떤 이야기를 찾고 계신가요?
          </h1>
          <div className={`relative group shadow-[0_0_40px_-15px_rgba(168,85,247,0.4)] ${!isDark && "shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)]"} transition-all duration-500`}>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400 group-focus-within:text-pink-500 transition-colors" />
            <Input
              placeholder="영화 제목, 크리에이터 제안 등..."
              className={`pl-14 py-8 text-lg rounded-2xl focus:ring-4 focus:ring-purple-500/20 transition-all ${isDark ? "bg-slate-900/80 border-slate-700/50 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm"}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 1 && setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
            />
            {/* 자동완성 드롭다운 */}
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl z-50 overflow-hidden ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
                {autocompleteResults.map((item) => (
                  <div
                    key={item.movieId}
                    className={`px-5 py-3 cursor-pointer flex items-center justify-between ${isDark ? "hover:bg-slate-800" : "hover:bg-purple-50"}`}
                    onMouseDown={() => { setSearchQuery(item.title); setShowAutocomplete(false); }}
                  >
                    <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{item.title}</span>
                    <span className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.creatorNickname}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 인기 검색어 */}
          {!searchQuery && popularKeywords.length > 0 && (
            <div className="max-w-3xl mx-auto mt-4 flex flex-wrap items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pink-500" />
              <span className={`text-sm font-semibold mr-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>인기</span>
              {popularKeywords.slice(0, 8).map((kw, i) => (
                <button
                  key={i}
                  onClick={() => setSearchQuery(kw.keyword)}
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${isDark ? "bg-slate-800 text-slate-300 hover:bg-purple-900/50 hover:text-purple-300" : "bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-600"}`}
                >
                  {kw.keyword}
                </button>
              ))}
            </div>
          )}

          {/* 필터 카운트 (카테고리별 영화 수) */}
          {filterCounts && !searchQuery && filterCounts.categories.length > 0 && (
            <div className="max-w-3xl mx-auto mt-3 flex flex-wrap items-center gap-2">
              <span className={`text-sm font-semibold mr-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>장르별</span>
              {filterCounts.categories.map((cat, i) => (
                <span key={i} className={`text-xs px-2 py-1 rounded-full ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                  {cat.categoryName}({cat.count})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        <section className="mb-14 sticky top-20 z-10 -mx-6 px-6 py-2 bg-inherit backdrop-blur-md">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            <Button
              variant={activeCategoryIds.length === 0 ? "default" : "outline"}
              onClick={() => setActiveCategoryIds([])}
              className={`rounded-full px-6 py-5 whitespace-nowrap snap-center transition-all ${
                activeCategoryIds.length === 0
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white border-none shadow-lg shadow-purple-500/30 ring-2 ring-purple-500/20"
                  : (isDark ? "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-purple-400" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-purple-300 shadow-sm")
              }`}
            >
              전체
            </Button>
            {categories.map((cat) => {
              const isSelected = activeCategoryIds.includes(cat.categoryId);
              return (
                <Button
                  key={cat.categoryId}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => toggleCategory(cat.categoryId)}
                  className={`rounded-full px-6 py-5 whitespace-nowrap snap-center transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white border-none shadow-lg shadow-purple-500/30 ring-2 ring-purple-500/20"
                      : (isDark ? "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-purple-400" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-purple-300 shadow-sm")
                  }`}
                >
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {isSearchActive && (
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <h2 className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {debouncedQuery.trim().length > 0 ? "검색 결과" : "카테고리 결과"}
                </h2>
                {!searchLoading && (
                  <Badge variant="secondary" className="px-3 py-1 font-bold bg-purple-500/10 text-purple-500 border-purple-500/20">
                    {searchResults.length}개
                  </Badge>
                )}
              </div>
              <Button variant="ghost" onClick={() => {
                setSearchQuery("");
                setDebouncedQuery("");
                setActiveCategoryIds([]);
              }} className="text-slate-500 hover:text-purple-500 transition-colors">
                초기화
              </Button>
            </div>
          )}

          {(() => {
            const displayMovies = isSearchActive ? searchResults : allMovies;
            const isLoading = isSearchActive ? searchLoading : allLoading;

            if (isLoading) {
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {Array(10).fill(0).map((_, i) => (
                    <div key={i} className="aspect-[2/3] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                  ))}
                </div>
              );
            }

            if (displayMovies.length === 0) {
              return (
                <div className="text-center py-24 px-6 rounded-3xl border-2 border-dashed border-slate-800/50 bg-slate-900/20 backdrop-blur-sm">
                  <Compass className="w-20 h-20 text-slate-700 mx-auto mb-6 animate-bounce" />
                  <h3 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>결과를 찾을 수 없습니다</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">다른 검색어를 입력하시거나 카테고리를 변경해 보세요.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {displayMovies.map((movie) => (
                  <Card
                    key={movie.movieId}
                    className={`cursor-pointer hover:border-purple-500 hover:-translate-y-2 transition-all duration-300 overflow-hidden group shadow-md ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                    onClick={() => navigate(`/movie/${movie.movieId}`)}
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <img
                        src={getImageUrl(movie.imageUrl) || getPlaceholderPoster(movie.movieId)}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-slate-950/80 backdrop-blur-md text-amber-400 border border-slate-800 flex items-center gap-1 scale-75 origin-right">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {movie.averageRating != null ? movie.averageRating.toFixed(1) : "-"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className={`font-bold text-base mb-1 truncate group-hover:text-purple-500 ${isDark ? "text-white" : "text-slate-900"}`}>
                        {renderHighlighted(movie.highlightedTitle, movie.title)}
                      </h3>
                      <p className={`text-xs mb-3 truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {renderHighlighted(movie.highlightedNickname, movie.nickname)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </section>
      </main>
    </div>
  );
}