import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/authStore";

const DashboardView = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const showProfile = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="">
      <div className="flex items-center justify-between h-[70px] shadow-lg px-[25px] ">
        <div className="flex items-center rounded-[5px]"></div>
        <div className="flex items-center gap-[20px]">
          <div className="flex items-center gap-[25px] border-r-[1px] pr-[25px]"></div>
          <div
            className="flex items-center gap-[15px] relative"
            onClick={showProfile}
          >
            <p className="font-semibold">ADMIN</p>
            <div className="h-[50px] w-[50px] rounded-full bg-[#4E73DF] cursor-pointer flex items-center justify-center relative z-40">
              <img
                src="https://i.pinimg.com/736x/1b/30/13/1b3013024531f649de7cd7494e5e9af9.jpg"
                alt=""
                className="rounded-full w-full"
              />
            </div>

            {open && (
              <div className="bg-white border h-[120px] w-[180px] absolute bottom-[-135px] z-20 right-0 pt-[15px] pl-[15px] space-y-[10px]">
                <p
                  className="cursor-pointer hover:text-[blue] font-semibold"
                  onClick={() => navigate("/admin/dashboard")}
                >
                  Tổng quan
                </p>
                <p
                  className="cursor-pointer hover:text-[blue] font-semibold"
                  onClick={() => navigate("/profile")}
                >
                  Thông tin cá nhân
                </p>
                <p
                  className="cursor-pointer hover:text-[blue] font-semibold"
                  onClick={() => handleLogout()}
                >
                  Đăng xuất
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
