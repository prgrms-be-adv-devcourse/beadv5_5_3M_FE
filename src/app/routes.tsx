import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { MainPage } from "./pages/MainPage";
import { MovieDetailPage } from "./pages/MovieDetailPage";
import { TheaterPage } from "./pages/TheaterPage";
import { MyPage } from "./pages/MyPage";
import { CreatorDashboard } from "./pages/CreatorDashboard";
import { CookieManagementPage } from "./pages/CookieManagementPage";
import { CartPage } from "./pages/CartPage";
import { SearchPage } from "./pages/SearchPage";
import { CreatorProfilePage } from "./pages/CreatorProfilePage";
import { MovieUploadPage } from "./pages/MovieUploadPage";
import { AllMoviesPage } from "./pages/AllMoviesPage";
import { OpenSchedulesPage } from "./pages/OpenSchedulesPage";
import { CreatorLoginPage } from "./pages/CreatorLoginPage";
import { CreatorJoinPage } from "./pages/CreatorJoinPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { MainLayout } from "./components/layout/MainLayout";
import { GeneralErrorPage } from "./components/GeneralErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
    errorElement: <GeneralErrorPage />,
  },
  {
    path: "/login",
    Component: LoginPage,
    errorElement: <GeneralErrorPage />,
  },
  {
    path: "/signup",
    Component: SignupPage,
    errorElement: <GeneralErrorPage />,
  },
  {
    path: "/creator/login",
    Component: CreatorLoginPage,
    errorElement: <GeneralErrorPage />,
  },
  {
    path: "/creator/join",
    Component: CreatorJoinPage,
    errorElement: <GeneralErrorPage />,
  },
  {
    path: "/oauth2/callback",
    Component: OAuthCallbackPage,
    errorElement: <GeneralErrorPage />,
  },
  {
    element: <MainLayout />,
    errorElement: <GeneralErrorPage />,
    children: [
      {
        path: "/main",
        Component: MainPage,
      },
      {
        path: "/movie/:id",
        Component: MovieDetailPage,
      },
      {
        path: "/theater/:scheduleId",
        Component: TheaterPage,
      },
      {
        path: "/mypage",
        Component: MyPage,
      },
      {
        path: "/creator",
        Component: CreatorDashboard,
      },
      {
        path: "/creator/movie/new",
        Component: MovieUploadPage,
      },
      {
        path: "/cookies",
        Component: CookieManagementPage,
      },
      {
        path: "/search",
        Component: SearchPage,
      },
      {
        path: "/creator/:creatorId",
        Component: CreatorProfilePage,
      },
      {
        path: "/all-movies",
        Component: AllMoviesPage,
      },
      {
        path: "/cart",
        Component: CartPage,
      },
      {
        path: "/tickets/open",
        Component: OpenSchedulesPage,
      },
    ]
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
