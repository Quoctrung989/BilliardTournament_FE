import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";
import CommonLayout from "../components/layouts/layout/CommonLayout";
import Dashboard from "../pages/Admin/Dashboard";
import { ROUTES } from "../constants/routes";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {ROUTES?.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              route.layout ? (
                <route.layout>
                  <route.component />
                </route.layout>
              ) : (
                <route.component />
              )
            }
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
