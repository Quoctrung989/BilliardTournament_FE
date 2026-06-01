import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthStore } from "../../store/authStore";
import { getHomeRouteForRole, isAdminUser } from "../../utils/auth";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, authReady } = useAuthStore();
  const location = useLocation();
  const warned = useRef(false);

  useEffect(() => {
    if (authReady && isAuthenticated && !isAdminUser(user) && !warned.current) {
      warned.current = true;
      toast.warn("Chỉ tài khoản ADMIN mới truy cập được khu vực quản trị.");
    }
  }, [authReady, isAuthenticated, user]);

  if (!authReady) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-500">
        Đang xác thực phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdminUser(user)) {
    return <Navigate to={getHomeRouteForRole(user?.role)} replace />;
  }

  return children;
};

export default AdminRoute;
