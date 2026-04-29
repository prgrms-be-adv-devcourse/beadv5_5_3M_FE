import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { PlayCircle, Star, Search } from "lucide-react";
import { Header } from "../components/ui/header";

import { useAllPublicMovies, useCategories, useSearchMovies } from "../hooks/useMovies";
import { getPlaceholderPoster, getImageUrl, movieService, ApiMovieCard } from "../services/movieService";

export function AllMoviesPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { movies: allMovies, loading } = useAllPublicMovies();
  const { categories } = useCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategoryIds, setActiveCategoryIds] = useState<number[]>([]);
  const [genreResults, setGenreResults] = useState<ApiMovieCard[]>([]);
  const [genreLoading, setGenreLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { movies: searchResults, loading: searchLoading } = useSearchMovies(debouncedQuery.trim());

  useEffect(() => {
    if (activeCategoryIds.length === 0) {
      setGenreResults([]);
      return;
    }
    setGenreLoading(true);
    Promise.all(activeCategoryIds.map(id => movieService.getMoviesByGenre(id)))
      .then(results => {
        const merged = new Map<number, ApiMovieCard>();
        results.flat().forEach(m => merged.set(m.movieId, m));
        setGenreResults(Array.from(merged.values()));
      })
      .catch(() => setGenreResults([]))
      .finally(() => setGenreLoading(false));
  }, [activeCategoryIds]);

  const toggleCategory = (id: number) => {
    setActiveCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const displayMovies = debouncedQuery.trim().length > 0 ? searchResults : activeCategoryIds.length > 0 ? genreResults : allMovies;
  const isLoading = debouncedQuery.trim().length > 0 ? searchLoading : activeCategoryIds.length > 0 ? genreLoading : loading;

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header title="전체 영화" showBackButton />

      <main className="container mx-auto px-6 py-8">
        <h1 className={`text-3xl font-extrabold mb-6 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>모든 영화 보기</h1>

        {/* 검색창 */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="영화 제목, 크리에이터 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-12 h-12 rounded-xl transition-colors ${isDark ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm"}`}
          />
        </div>

        {/* 카테고리 필터 */}
        <section className="mb-8 sticky top-20 z-10 -mx-6 px-6 py-2 bg-inherit backdrop-blur-md">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={activeCategoryIds.length === 0 ? "default" : "outline"}
              onClick={() => setActiveCategoryIds([])}
              className={`rounded-full px-5 py-4 whitespace-nowrap transition-all ${
                activeCategoryIds.length === 0
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white border-none shadow-lg shadow-purple-500/30"
                  : isDark ? "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-purple-400" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-purple-300 shadow-sm"
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
                  className={`rounded-full px-5 py-4 whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white border-none shadow-lg shadow-purple-500/30"
                      : isDark ? "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-purple-400" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-purple-300 shadow-sm"
                  }`}
                >
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </section>

        {/* 영화 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {displayMovies.map((movie) => (
              <Card
                key={movie.movieId}
                className={`cursor-pointer hover:border-purple-500 hover:-translate-y-2 transition-all duration-300 overflow-hidden group shadow-lg ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                onClick={() => navigate(`/movie/${movie.movieId}`)}
              >
                <div className="aspect-[2/3] relative overflow-hidden">
                  <img
                    src={getImageUrl(movie.imageUrl) || getPlaceholderPoster(movie.movieId)}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PlayCircle className="w-12 h-12 text-white drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-slate-900/80 backdrop-blur-md text-amber-400 border border-slate-700 flex items-center gap-1 shadow-md text-xs py-0 px-1.5">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {movie.averageRating != null ? movie.averageRating.toFixed(1) : "-"}
                    </Badge>
                  </div>
                </div>
                <CardContent className={`p-4 transition-colors flex flex-col items-start ${isDark ? "bg-slate-900" : "bg-white"}`}>
                  <h3 className={`font-bold mb-1 w-full truncate transition-colors group-hover:text-purple-500 ${isDark ? "text-white" : "text-slate-900"}`}>{movie.title}</h3>
                  <p className={`text-xs transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}>{movie.nickname}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
