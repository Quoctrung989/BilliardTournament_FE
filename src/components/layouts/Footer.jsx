import React from "react";
import { FaInstagram, FaTiktok, FaYoutube, FaFacebook } from "react-icons/fa6";

const Footer = () => {
  const footerLinks = [
    ["Tin Mới Nhất", "Lịch Thi Đấu", "Vé", "Bảng Xếp Hạng"],
    ["Cầu Thủ", "Câu Hỏi Thường Gặp", "WPNPC", "Liên Hệ"],
    [
      "Điều Khoản & Điều Kiện",
      "Chính Sách Bảo Vệ",
      "Chính Sách Quyền Riêng Tư",
      "Chính Sách Cookie",
    ],
    [
      "Tuyên Bố Về Nô Lệ Hiện Đại và Buôn Người",
      "Chiến Lược Thuế Matchroom Group",
      "Quy Tắc Cờ Bạc Anh Quốc",
      "Cơ Quan Quản Lý Bida",
    ],
  ];

  return (
    <footer className="bg-[#ececec] px-4 pt-12 pb-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 gap-y-10 gap-x-12 border-b border-black/10 pb-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerLinks.map((group, index) => (
            <div key={index} className="flex flex-col gap-2">
              {group.map((item) => (
                <a
                  key={item}
                  href="/"
                  className="
                    w-fit
                    text-[12px]
                    font-light
                    text-[#1f1f1f]
                    transition-opacity
                    duration-200
                    hover:opacity-60
                  "
                >
                  {item}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-8 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center">
            <h1 className="text-[60px] font-black italic leading-none tracking-tight text-[#2b2b2b]">
              CAPS<span className="text-red-500">.</span>
            </h1>
          </div>

          <div className="max-w-[540px]">
            <p className="text-[12px] font-normal text-[#2b2b2b]">
              Matchroom Multi Sport Ltd, Mascalls, Mascalls Lane, Brentwood,
              Essex, England CM14 5LJ
            </p>

            <p className="mt-2 text-[12px] font-light text-[#2b2b2b]">
              © 2024 Matchroom Multi Sport Ltd. Bảo lưu mọi quyền.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <h2 className="text-[40px] font-black italic text-[#2b2b2b]">
              CAPS.tv
            </h2>

            <button className="transition-opacity hover:opacity-60">✕</button>

            <button className="transition-opacity hover:opacity-60">
              <FaFacebook size={22} />
            </button>

            <button className="transition-opacity hover:opacity-60">
              <FaInstagram size={22} />
            </button>

            <button className="transition-opacity hover:opacity-60">
              <FaYoutube size={24} />
            </button>

            <button className="transition-opacity hover:opacity-60">
              <FaTiktok size={22} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
