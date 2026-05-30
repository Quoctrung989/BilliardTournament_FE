import React, { useState } from "react";
import {
  FaRegSun,
  FaStickyNote,
  FaChevronLeft,
  FaUserFriends,
  FaChevronRight,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { useNavigate } from "react-router";
import { BACKGROUND_IMAGE_URL_DARK } from "../../../../constants/constUrl";

const Sidebar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`h-full ${collapsed ? "w-20" : "w-64"} transition-all duration-300 ease-in-out px-[15px] `}
      style={{
        backgroundImage: `url('${BACKGROUND_IMAGE_URL_DARK}')`,
      }}
    >
      <div className="px-[15px] py-[30px] flex items-center justify-center border-b-[1px] border-[#EDEDED]/[0.3]">
        <img
          src="https://i.pinimg.com/736x/1b/30/13/1b3013024531f649de7cd7494e5e9af9.jpg"
          alt=""
          className="w-10 inline-block items-center rounded-full mr-2"
        />
        {!collapsed && (
          <h1 className="text-white text-[20px] leading-[24px] font-extrabold cursor-pointer whitespace-nowrap overflow-hidden transition-all duration-300">
            CAPSTONE
          </h1>
        )}
      </div>
      <div
        className="flex items-center gap-[15px] py-[20px] border-b-[1px] transition ease-in-out duration-300 rounded pl-4 hover:bg-secondary border-[#EDEDED]/[0.3] cursor-pointer "
        onClick={() => navigate("/admin/dashboard")}
      >
        <MdDashboard color="white" />
        {!collapsed && (
          <p className="text-[14px] leading-[20px] font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300">
            Tổng quan
          </p>
        )}
      </div>
      <div className="pt-[15px] border-b-[1px] border-[#EDEDED]/[0.3]">
        {!collapsed && (
          <p className="text-[10px] font-extrabold leading-[16px] text-white/[0.4] whitespace-nowrap overflow-hidden transition-all duration-300">
            Người dùng
          </p>
        )}
        <div
          className="flex items-center justify-between gap-[10px] py-[15px] cursor-pointer transition ease-in-out duration-300 rounded pl-4 hover:bg-secondary"
          onClick={() => navigate("/admin/users")}
        >
          <div className="flex items-center gap-[10px]">
            <FaRegSun color="white" />{" "}
            {!collapsed && (
              <p className="text-[14px] leading-[20px] font-normal text-white whitespace-nowrap overflow-hidden transition-all duration-300">
                Quản lý người dùng
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="pt-[15px] border-b-[1px] border-[#EDEDED]/[0.3]">
        {!collapsed && (
          <p className="text-[10px] font-extrabold leading-[16px] text-white/[0.4] whitespace-nowrap overflow-hidden transition-all duration-300">
            Giải đấu
          </p>
        )}
        <div
          className="flex items-center justify-between gap-[10px] py-[15px] cursor-pointer transition ease-in-out duration-300 rounded pl-4 hover:bg-secondary"
          onClick={() => navigate("/admin/accountsManagement")}
        >
          <div className="flex items-center gap-[10px]">
            <FaStickyNote color="white" />{" "}
            {!collapsed && (
              <p className="text-[14px] leading-[20px] font-normal text-white whitespace-nowrap overflow-hidden transition-all duration-300">
                Danh sách
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="pt-[15px] border-b-[1px] border-[#EDEDED]/[0.3]">
        {!collapsed && (
          <p className="text-[10px] font-extrabold leading-[16px] text-white/[0.4] whitespace-nowrap overflow-hidden transition-all duration-300">
            {" "}
            Nhân viên
          </p>
        )}
        <div
          className="flex items-center justify-between gap-[10px] py-[15px] cursor-pointer transition ease-in-out duration-300 rounded pl-4 hover:bg-secondary"
          onClick={() => navigate("/admin/staffManagement")}
        >
          <div className="flex items-center gap-[10px]">
            <FaUserFriends color="white" />{" "}
            {!collapsed && (
              <p className="text-[14px] leading-[20px] font-normal text-white">
                Quản lý nhân viên
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="pt-[15px]">
        <div
          className="flex items-center justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="h-[40px] w-[40px] bg-[#3C5EC1] rounded-full flex items-center justify-center cursor-pointer">
            {collapsed ? (
              <FaChevronRight color="white" />
            ) : (
              <FaChevronLeft color="white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
