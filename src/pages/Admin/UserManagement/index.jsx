import React from "react";
import { FaEdit, FaSearch } from "react-icons/fa";

const UserManagement = () => {
  return (
    <div className="rounded-lg bg-white dark:bg-[#161a22] p-16 shadow min-h-[90vh]">
      <h1 className="font-black text-3xl">Danh sách người dùng</h1>

      <div className="flex mt-6 flex-col gap-4 md:flex-row justify-between">
        <div className="relative grow rounded-md border-2 border-gray-300 dark:border-white/15">
          <FaSearch className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            className="w-full px-4 py-3 pl-10 outline-none italic"
            placeholder="Nhập tên/email cửa hàng"
          />
        </div>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-gray-700 dark:text-white/75 uppercase bg-gray-50 dark:bg-white/5">
            <tr>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Tên người dùng</th>
              <th scope="col" className="px-6 py-3">SĐT</th>
              <th scope="col" className="px-6 py-3"><span className="sr-only">Chỉnh sửa</span></th>
            </tr>
          </thead>
          <tbody>
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <tr className="bg-white dark:bg-[#161a22] border-b hover:bg-gray-50 dark:hover:bg-white/5" key={index}>
                  <td className="px-6 py-4">123</td>
                  <td className="px-6 py-4">412</td>
                  <td className="px-6 py-4">0123456789</td>
                  <td className="px-6 py-4 flex justify-center">
                    <button className="py-2 px-5 bg-secondary font-semibold text-white rounded hover:bg-primary transition-all duration-300 flex items-center">
                      <FaEdit className="mr-1" />
                      Thông tin
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <nav
          className="flex items-center flex-wrap md:flex-row justify-between pt-4"
          aria-label="Table navigation"
        >
          <span className="text-sm font-normal text-gray-500 mb-4 md:mb-0 block w-full md:inline md:w-auto">
            Hiển thị <span className="font-semibold text-gray-900 dark:text-white">1</span> trong{" "}
            <span className="font-semibold text-gray-900 dark:text-white">10</span> người dùng
          </span>
          <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
            <li>
              <button className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white dark:bg-[#161a22] border border-gray-300 dark:border-white/15 rounded-s-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white/75">
                Trước
              </button>
            </li>
            {Array.from({ length: 10 }).map((_, index) => (
              <li key={index}>
                <button className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white dark:bg-[#161a22] border border-gray-300 dark:border-white/15 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white/75">
                  {index + 1}
                </button>
              </li>
            ))}
            <li>
              <button className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white dark:bg-[#161a22] border border-gray-300 dark:border-white/15 rounded-e-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white/75">
                Sau
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default UserManagement;
