import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "../pages/NotFound";
import { ROUTES } from "../constants/routes";
import AdminLayout from "../components/admin/AdminLayout";
import AdminRoute from "../components/guards/AdminRoute";
import OwnerRoute from "../components/guards/OwnerRoute";
import ManagerRoute from "../components/guards/ManagerRoute";
import StaffRoute from "../components/guards/StaffRoute";
import { ADMIN_NAV } from "../constants/adminNav";
import { OWNER_NAV } from "../constants/ownerNav";
import { MANAGER_NAV } from "../constants/managerNav";
import { STAFF_NAV } from "../constants/staffNav";

/**
 * Mỗi section (admin/owner/manager/staff) chỉ mount AdminLayout 1 lần — các route con render
 * qua <Outlet/> bên trong nó thay vì mỗi trang tự bọc guard+layout riêng. Nếu không, mỗi lần
 * điều hướng React Router sẽ remount lại toàn bộ sidebar/header vì mỗi route trỏ tới 1 component
 * "Wrapped" khác nhau (xem with*Page.jsx).
 */
const SECTIONS = {
  admin: { Guard: AdminRoute, navConfig: ADMIN_NAV },
  owner: { Guard: OwnerRoute, navConfig: OWNER_NAV },
  manager: { Guard: ManagerRoute, navConfig: MANAGER_NAV },
  /* Trọng tài chỉ có đúng một mục ("Trận của tôi") — một cột dọc 260px để chứa
     một dòng là phí, nhất là trên tablet cầm tay ở bàn đấu. Bỏ sidebar, mọi
     đường đi dồn lên header. */
  staff: { Guard: StaffRoute, navConfig: STAFF_NAV, hideSidebar: true },
};

function AppRoutes() {
  const legacyRoutes = ROUTES?.filter((r) => !r.component.__routeSection) || [];
  const sectioned = Object.keys(SECTIONS).reduce((acc, key) => {
    acc[key] = ROUTES?.filter((r) => r.component.__routeSection === key) || [];
    return acc;
  }, {});

  return (
    <BrowserRouter>
      <Routes>
        {legacyRoutes.map((route) => (
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

        {Object.entries(SECTIONS).map(([key, { Guard, navConfig, hideSidebar }]) => (
          <Route
            key={key}
            element={
              <Guard>
                <AdminLayout navConfig={navConfig} hideSidebar={hideSidebar} />
              </Guard>
            }
          >
            {sectioned[key].map((route) => (
              <Route key={route.path} path={route.path} element={<route.component />} />
            ))}
          </Route>
        ))}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
