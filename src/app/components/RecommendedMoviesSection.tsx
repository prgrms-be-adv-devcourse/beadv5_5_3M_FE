import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Sparkles } from "lucide-react";
import { Card } from "./ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { useUser } from "../contexts/UserContext";
import { aiService } from "../services/aiService";
import {
  ApiMovieDetail,
  getImageUrl,
  getPlaceholderPoster,
  movieService,
} from "../services/movieService";

interface RecommendedItem {
  logId: number;
  movie: ApiMovieDetail;
}

const SKELETON_COUNT = 6;

export function RecommendedMoviesSection() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useUser();
  const isDark = theme === "dark";

  const [items, setItems] = useState<RecommendedItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    (async () => {
      try {
        const recs = await aiService.getRecommendations();
        if (cancelled) return;

        if (recs.length === 0) {
          setItems([]);
          return;
        }

        const settled = await Promise.allSettled(
          recs.map((r) => movieService.getMovieDetail(r.movieId))
        );
        if (cancelled) return;

        const enriched: RecommendedItem[] = [];
        settled.forEach((res, i) => {
          if (res.status === "fulfilled") {
            enriched.push({ logId: recs[i].logId, movie: res.value });
          }
        });
        setItems(enriched);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;
  if (failed) return null;
  if (!loading && items && items.length === 0) return null;

  const handleClick = (logId: number, movieId: number) => {
    aiService.clickRecommendation(logId).catch(() => {});
    navigate(`/movie/${movieId}`);
  };

  return (
    <section className="mb-16">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-6 h-6 text-purple-500" />
        <h3
          className={`text-2xl font-black tracking-tight ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          당신을 위한 추천
        </h3>
      </div>

      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent className="-ml-4">
          {loading
            ? Array(SKELETON_COUNT)
                .fill(0)
                .map((_, i) => (
                  <CarouselItem
                    key={i}
                    className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6"
                  >
                    <div className="aspect-[2/3] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                  </CarouselItem>
                ))
            : items?.map(({ logId, movie }) => (
                <CarouselItem
                  key={logId}
                  className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6"
                >
                  <Card
                    className="group cursor-pointer border-none transition-all duration-300 hover:-translate-y-2 bg-transparent shadow-none"
                    onClick={() => handleClick(logId, movie.movieId)}
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-purple-500/20">
                      <img
                        src={
                          getImageUrl(movie.imageUrl) ||
                          getPlaceholderPoster(movie.movieId)
                        }
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getPlaceholderPoster(movie.movieId);
                          if (target.src !== fallback) target.src = fallback;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <h4
                        className={`font-bold text-lg truncate mb-1 transition-colors group-hover:text-purple-500 ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {movie.title}
                      </h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 truncate">
                          {movie.nickname}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-amber-400 font-bold">★</span>
                          <span
                            className={isDark ? "text-slate-300" : "text-slate-700"}
                          >
                            {movie.averageRating != null
                              ? movie.averageRating.toFixed(1)
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}
