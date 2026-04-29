import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Loader2, Film, Upload } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/ui/header";
import { movieService, ApiCategory } from "../services/movieService";

export function MovieUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const movieId: number | undefined = location.state?.movieId;
  const isEditMode = movieId !== undefined;

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    additionalCookie: 0,
    categoryIds: [] as number[],
  });

  // 카테고리 목록 로드
  useEffect(() => {
    movieService.getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // 수정 모드: 기존 영화 정보 로드
  useEffect(() => {
    if (!isEditMode || !movieId) return;
    movieService.getCreatorMovieDetail(movieId)
      .then((detail) => {
        setForm({
          title: detail.title,
          description: detail.description,
          additionalCookie: detail.additionalCookie,
          categoryIds: detail.categoryIds ?? [],
        });
      })
      .catch(() => toast.error("영화 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [isEditMode, movieId]);

  const toggleCategory = (id: number) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const handleRegisterCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const newId = await movieService.registerCategory(trimmed);
      toast.success(`카테고리 '${trimmed}'가 등록되었습니다.`);
      // 목록 갱신 및 자동 선택
      const updatedCategories = await movieService.getCategories();
      setCategories(updatedCategories);
      setForm(prev => ({
        ...prev,
        categoryIds: [...prev.categoryIds, newId]
      }));
    } catch (e: any) {
      const msg = e.response?.data?.message || "카테고리 등록에 실패했습니다.";
      toast.error(msg);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("제목과 설명을 입력해주세요.");
      return;
    }
    if (!isEditMode && (!videoFile || !imageFile)) {
      toast.error("영상 파일과 포스터 이미지를 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode && movieId !== undefined) {
        await movieService.updateMovieDetail(movieId, {
          title: form.title,
          description: form.description,
          additionalCookie: form.additionalCookie,
          categoryIds: form.categoryIds,
        });
        toast.success("영화 정보가 수정되었습니다.");
      } else {
        await movieService.registerCreatorMovie({
          title: form.title,
          description: form.description,
          additionalCookie: form.additionalCookie,
          categoryIds: form.categoryIds,
          image: imageFile!,
          video: videoFile!,
        });
        toast.success("영화가 비공개로 등록되었습니다.");
      }
      navigate("/creator");
    } catch (e: any) {
      const msg = e.response?.data?.message || (isEditMode ? "수정에 실패했습니다." : "등록에 실패했습니다.");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header title={isEditMode ? "영화 수정" : "새 영화 등록"} showBackButton />

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-6">
          <h2 className={`text-3xl font-extrabold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            {isEditMode ? "영화 정보를 수정합니다." : "어떤 멋진 영화를 공유하실 건가요?"}
          </h2>
          <p className={isDark ? "text-slate-400" : "text-slate-500"}>
            {isEditMode
              ? "수정된 정보는 즉시 저장됩니다."
              : "등록된 영화는 기본적으로 비공개로 설정됩니다."}
          </p>
        </div>

        <Card className={`border shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <CardHeader>
            <CardTitle className={isDark ? "text-white" : "text-slate-900"}>영화 정보</CardTitle>
            <CardDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              필수 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* 제목 */}
            <div className="space-y-2">
              <Label className={isDark ? "text-white" : "text-slate-700"}>영화 제목 *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="제목을 입력하세요"
                className={isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white"}
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label className={isDark ? "text-white" : "text-slate-700"}>상세 설명 *</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="영화 소개를 입력해주세요."
                className={`min-h-[120px] resize-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white"}`}
              />
            </div>

            {/* 미디어 업로드 (등록 시에만) */}
            {!isEditMode && (
              <div className={`pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-100"} space-y-4`}>
                <div className="flex flex-col space-y-1">
                  <Label className={isDark ? "text-white" : "text-slate-700"}>미디어 파일 *</Label>
                  <p className="text-[11px] text-slate-500">영상(.mp4)과 포스터(.jpg, .png, .webp) 파일을 업로드해주세요.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    videoFile
                      ? "border-purple-500 bg-purple-500/10"
                      : isDark ? "bg-slate-800/30 border-slate-700 hover:border-slate-500" : "bg-slate-50 border-slate-200 hover:border-slate-400"
                  }`}>
                    <Film className={`w-5 h-5 ${videoFile ? "text-purple-500" : "text-slate-400"}`} />
                    <span className={`text-[10px] font-bold ${videoFile ? "text-purple-500" : "text-slate-500"}`}>
                      {videoFile ? videoFile.name : "영상 파일 선택"}
                    </span>
                    <input
                      type="file"
                      accept="video/mp4"
                      className="hidden"
                      onChange={e => setVideoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <label className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    imageFile
                      ? "border-purple-500 bg-purple-500/10"
                      : isDark ? "bg-slate-800/30 border-slate-700 hover:border-slate-500" : "bg-slate-50 border-slate-200 hover:border-slate-400"
                  }`}>
                    <Upload className={`w-5 h-5 ${imageFile ? "text-purple-500" : "text-slate-400"}`} />
                    <span className={`text-[10px] font-bold ${imageFile ? "text-purple-500" : "text-slate-500"}`}>
                      {imageFile ? imageFile.name : "포스터 이미지 선택"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => setImageFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 카테고리 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className={isDark ? "text-white" : "text-slate-700"}>카테고리 (다중 선택)</Label>
                <span className="text-xs text-slate-500">{form.categoryIds.length}개 선택됨</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const isSelected = form.categoryIds.includes(cat.categoryId);
                  return (
                    <Badge
                      key={cat.categoryId}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1.5 transition-all text-sm font-medium ${
                        isSelected
                          ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                          : isDark
                            ? "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => toggleCategory(cat.categoryId)}
                    >
                      {cat.name}
                    </Badge>
                  );
                })}
                
                {/* 새 카테고리 추가 인풋 (뒤로 이동) */}
                <div className="flex items-center gap-1 ml-1 scale-90 origin-left">
                  <Input
                    placeholder="새 장르"
                    className={`h-7 w-24 py-0 px-2 text-[11px] ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white"}`}
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleRegisterCategory(newCategoryName);
                        setNewCategoryName("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-7 w-7 rounded-lg p-0 flex items-center justify-center bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      handleRegisterCategory(newCategoryName);
                      setNewCategoryName("");
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* 추가 입장료 */}
            <div className={`pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}>
              <div className="space-y-2">
                <Label className={isDark ? "text-white" : "text-slate-700"}>추가 입장료 (쿠키)</Label>
                <p className="text-[11px] text-slate-500">기본 입장료는 영상 파일 크기에 따라 자동 계산됩니다.</p>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    value={form.additionalCookie || ""}
                    onChange={e => setForm({ ...form, additionalCookie: Number(e.target.value) })}
                    placeholder="0"
                    className={`pl-8 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white"}`}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🍪</span>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-lg mt-6"
        >
          {submitting
            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> 처리 중...</>
            : isEditMode ? "변경 사항 저장하기" : "영화 등록하기 (비공개로 생성)"}
        </Button>
      </main>
    </div>
  );
}
