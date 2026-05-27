import CommonLayout from "../components/layouts/layout/CommonLayout";
import Dashboard from "../pages/Admin/Dashboard";
import Home from "../pages/Home";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";

export const ROUTES = [
  {
    path: "/admin/dashboard",
    component: Dashboard,
  },
  { path: "/", component: Home, layout: CommonLayout },
  { path: "/login", component: LoginPage, layout: null },
  { path: "/register", component: RegisterPage, layout: null },
  { path: "/forgot-password", component: ForgotPasswordPage, layout: null },
];
