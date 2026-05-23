import React from "react";
import { useAuthStore } from "../../store/authStore";
import { AiOutlineUser, AiOutlineLogout, AiOutlineQuestionCircle } from "react-icons/ai";

const Header = () => {
  const { openLogin, isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="w-full bg-[#333333] text-white px-16 h-[100px] flex items-center justify-between font-bold sticky top-0 z-50">
      <div className="text-2xl font-bold ">WNT</div>
      <div className="flex gap-8 text-lg justify-center items-center h-full">
        <div className="flex items-center border-b-6 border-transparent px-4 hover:border-b-6 hover:border-[#EF342A] h-full cursor-pointer ">
          Lastest
        </div>
        <div className="flex items-center border-b-6 border-transparent px-4 hover:border-b-6 hover:border-[#EF342A] h-full cursor-pointer ">
          LiveScores
        </div>
        <div className="flex items-center border-b-6 border-transparent px-4 hover:border-b-6 hover:border-[#EF342A] h-full cursor-pointer ">
          Schedule
        </div>
        <div className="flex items-center border-b-6 border-transparent px-4 hover:border-b-6 hover:border-[#EF342A] h-full cursor-pointer ">
          Tickets
        </div>
        <div className="flex items-center border-b-6 border-transparent px-4 hover:border-b-6 hover:border-[#EF342A] h-full cursor-pointer ">
          Rankings
        </div>
        <div className="flex items-center border-b-6 border-transparent px-4 hover:border-b-6 hover:border-[#EF342A] h-full cursor-pointer ">
          Players
        </div>
        <div className="flex items-center border-b-6 border-transparent px-4 hover:border-b-6 hover:border-[#EF342A] h-full cursor-pointer ">
          Store
        </div>
      </div>

      {/* User section */}
      {isAuthenticated && user ? (
        <div className="flex items-center gap-8 h-full">
          {/* My Profile */}
          <button className="flex items-center gap-2 text-gray-300 hover:text-[#EF342A] transition h-full border-b-6 border-transparent hover:border-b-6 hover:border-[#EF342A] px-2">
            <AiOutlineUser size={20} />
            <span className="text-base font-semibold">My Profile</span>
          </button>

          {/* Support */}
          <button className="flex items-center gap-2 text-gray-300 hover:text-[#EF342A] transition h-full border-b-6 border-transparent hover:border-b-6 hover:border-[#EF342A] px-2">
            <AiOutlineQuestionCircle size={20} />
            <span className="text-base font-semibold">Support</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-300 hover:text-[#EF342A] transition h-full border-b-6 border-transparent hover:border-b-6 hover:border-[#EF342A] px-2"
          >
            <AiOutlineLogout size={20} />
            <span className="text-base font-semibold">Logout</span>
          </button>
        </div>
      ) : (
        <button
  onClick={openLogin}
  className="border-2 border-[#EF342A] text-[#EF342A] hover:bg-[#EF342A] hover:text-white font-semibold px-6 py-2 rounded-full transition-all duration-300"
>
  Đăng Nhập
</button>
      )}
    </div>
  );
};

export default Header;
