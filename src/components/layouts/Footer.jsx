import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaTiktok, FaYoutube, FaFacebook } from "react-icons/fa6";

const Footer = () => {
  const footerLinks = [
    { label: "Tin Mới Nhất", to: "/news" },
    { label: "Bảng Xếp Hạng", to: "/rankings" },
  ];

  return (
    <footer className="bg-[#ececec] dark:bg-[#0f1117] dark:text-gray-200 px-4 pt-12 pb-28 transition-colors duration-300">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-black/10 dark:border-white/10 pb-10">
          {footerLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="
                ui-underline
                w-fit
                pb-0.5
                text-[12px]
                font-light
                text-[#1f1f1f]
                dark:text-gray-300
                transition-colors
                duration-200
                hover:text-[var(--wnt25-color-red)]
              "
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-8 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center">
            <Link
              to="/"
              aria-label="Về trang chủ CAPSTONE"
              className="ui-logo-zoom text-[60px] font-black italic leading-none tracking-tight text-[#2b2b2b] dark:text-white"
            >
              CAPS<span className="text-red-500">.</span>
            </Link>
          </div>

          <div className="max-w-[540px]">
            <p className="text-[12px] font-normal text-[#2b2b2b] dark:text-gray-300">
              Matchroom Multi Sport Ltd, Mascalls, Mascalls Lane, Brentwood,
              Essex, England CM14 5LJ
            </p>

            <p className="mt-2 text-[12px] font-light text-[#2b2b2b] dark:text-gray-400">
              © 2024 Matchroom Multi Sport Ltd. Bảo lưu mọi quyền.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <h2 className="text-[40px] font-black italic text-[#2b2b2b] dark:text-white">
              CAPS.tv
            </h2>

            <button className="ui-icon-lift">✕</button>

            <a
              href="https://www.facebook.com/profile.php?id=61591577595713"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Trang Facebook CAPSTONE"
              className="ui-icon-lift"
            >
              <FaFacebook size={22} />
            </a>

            <button className="ui-icon-lift">
              <FaInstagram size={22} />
            </button>

            <button className="ui-icon-lift">
              <FaYoutube size={24} />
            </button>

            <button className="ui-icon-lift">
              <FaTiktok size={22} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
