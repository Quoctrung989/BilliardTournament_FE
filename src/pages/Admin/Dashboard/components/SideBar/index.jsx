import React from "react";
import {
  FaRegSun,
  FaStickyNote,
  FaChevronLeft,
  FaUserFriends,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { useNavigate } from "react-router";
import { BACKGROUND_IMAGE_URL_DARK } from "../../../../../constants/constUrl";

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div
      className=" px-[25px] h-screen"
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
        <h1 className="text-white text-[20px] leading-[24px] font-extrabold cursor-pointer">
          WNT
        </h1>
      </div>
      <div
        className="flex items-center gap-[15px] py-[20px] border-b-[1px] transition ease-in-out duration-300 rounded pl-4 hover:bg-secondary border-[#EDEDED]/[0.3] cursor-pointer "
        onClick={() => navigate("/admin/dashboard")}
      >
        <MdDashboard color="white" />
        <p className="text-[14px] leading-[20px] font-bold text-white ">
          Tổng quan
        </p>
      </div>
      <div className="pt-[15px] border-b-[1px] border-[#EDEDED]/[0.3]">
        <p className="text-[10px] font-extrabold leading-[16px] text-white/[0.4]">
          {" "}
          Người dùng
        </p>
        <div
          className="flex items-center justify-between gap-[10px] py-[15px] cursor-pointer transition ease-in-out duration-300 rounded pl-4 hover:bg-secondary"
          onClick={() => navigate("/admin")}
        >
          <div className="flex items-center gap-[10px]">
            <FaRegSun color="white" />{" "}
            <p className="text-[14px] leading-[20px] font-normal text-white">
              Quản lý người dùng
            </p>
          </div>
        </div>
      </div>
      <div className="pt-[15px] border-b-[1px] border-[#EDEDED]/[0.3]">
        <p className="text-[10px] font-extrabold leading-[16px] text-white/[0.4]">
          {" "}
          Giải đấu
        </p>
        <div
          className="flex items-center justify-between gap-[10px] py-[15px] cursor-pointer transition ease-in-out duration-300 rounded pl-4 hover:bg-secondary"
          onClick={() => navigate("/admin/accountsManagement")}
        >
          <div className="flex items-center gap-[10px]">
            <FaStickyNote color="white" />{" "}
            <p className="text-[14px] leading-[20px] font-normal text-white">
              Danh sách
            </p>
          </div>
        </div>
      </div>
      <div className="pt-[15px] border-b-[1px] border-[#EDEDED]/[0.3]">
        <p className="text-[10px] font-extrabold leading-[16px] text-white/[0.4]">
          {" "}
          Nhân viên
        </p>
        <div
          className="flex items-center justify-between gap-[10px] py-[15px] cursor-pointer transition ease-in-out duration-300 rounded pl-4 hover:bg-secondary"
          onClick={() => navigate("/admin/accountsManagement")}
        >
          <div className="flex items-center gap-[10px]">
            <FaUserFriends color="white" />{" "}
            <p className="text-[14px] leading-[20px] font-normal text-white">
              Quản lý nhân viên
            </p>
          </div>
        </div>
      </div>
      <div className="pt-[15px]">
        <div
          className="flex items-center justify-center"
          onClick={() => navigate("/")}
        >
          <div className="h-[40px] w-[40px] bg-[#3C5EC1] rounded-full flex items-center justify-center cursor-pointer">
            <FaChevronLeft color="white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
