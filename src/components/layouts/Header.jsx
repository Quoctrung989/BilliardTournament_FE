import React from "react";

const Header = () => {
  return (
    <div className="w-full bg-[#333333] text-white px-16 h-[100px] sticky top-0 z-50">
      <div className="max-w-[1600px] flex items-center justify-between font-bold mx-auto h-full">
        <div className="text-2xl font-bold ">WNT</div>
        <div className="flex gap-8 text-lg justify-center items-center h-full">
          <div className="flex items-center border-y-[8px] border-transparent px-4 hover:border-y-[8px] hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer ">
            Lastest
          </div>
          <div className="flex items-center border-y-[8px] border-transparent px-4 hover:border-y-[8px] hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer ">
            LiveScores
          </div>
          <div className="flex items-center border-y-[8px] border-transparent px-4 hover:border-y-[8px] hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer ">
            Schedule
          </div>
          <div className="flex items-center border-y-[8px] border-transparent px-4 hover:border-y-[8px] hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer ">
            Tickets
          </div>
          <div className="flex items-center border-y-[8px] border-transparent px-4 hover:border-y-[8px] hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer">
            Rankings
          </div>
          <div className="flex items-center border-y-[8px] border-transparent px-4 hover:border-y-[8px] hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer ">
            Players
          </div>
          <div className="flex items-center border-y-[8px] border-transparent px-4 hover:border-y-[8px] hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer ">
            Store
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default Header;
