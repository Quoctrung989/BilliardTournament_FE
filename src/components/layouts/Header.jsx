import React from "react";

const Header = () => {
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
      <div></div>
    </div>
  );
};

export default Header;
