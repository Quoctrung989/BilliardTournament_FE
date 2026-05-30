import Sidebar from "../components/SideBar";
import DashboardView from "../components/DashboardView";
import { FaEdit, FaKey, FaPlus, FaSearch } from "react-icons/fa";
import { useState } from "react";

const StaffManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const handleClick = (page) => {
    if (page < 1) return;
    setCurrentPage(page);
  };
  return (
    <div className="">
      <div className="flex ">
        <div className="basis-[12%] h-[100vh]">
          <Sidebar />
        </div>
        <div className="basis-[88%] border overflow-scroll h-[100vh]">
          <DashboardView />
          <div className="min-w-[40]x rounded-lg bg-white p-16 shadow min-h-[90vh] mt-2">
            <h1 className="font-black text-3xl">Quản lý nhân viên</h1>

            <div className="flex mt-6 flex-col gap-4 md:flex-row justify-between">
              <div className="">
                <div className="relative grow rounded-md border-2 border-gray-300">
                  <FaSearch className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full px-4 py-3 pl-10 outline-none italic "
                    placeholder="Nhập tên nhân viên"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div>
                  <button className="py-2 px-5 bg-blue-500 font-semibold text-white rounded hover:bg-blue-500 transition-all duration-300 flex items-center">
                    <FaPlus className="mr-1" />
                    Thêm nhân viên
                  </button>
                </div>
              </div>
            </div>

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Tên Nhân Viên
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Tên tài khoản
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Số điện thoại
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Vai trò
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <span className="sr-only">Chỉnh sửa</span>
                      {/* <span className="sr-only">Xóa</span> */}
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <span className="sr-only">Đổi mật khẩu</span>
                      {/* <span className="sr-only">Xóa</span> */}
                    </th>
                    {/* <th scope="col" className="px-6 py-3">
                                            <span className="sr-only">Xoá</span>
                                        </th> */}
                  </tr>
                </thead>
                <tbody>
                  {Array(5)
                    .fill()
                    .map((e, index) => (
                      <tr
                        key={index}
                        className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700"
                      >
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Nguyễn Văn A
                        </th>
                        <td className="px-6 py-4">nguyenvana</td>
                        <td className="px-6 py-4">0123456789</td>
                        <td className="px-6 py-4">Quản Lý</td>
                        <td className="px-6 py-4 ">
                          <button className="py-2 px-5 bg-blue-500 font-semibold text-white rounded hover:bg-primary transition-all duration-300 flex items-center">
                            <FaEdit className="mr-1" />
                            Chỉnh sửa
                          </button>
                        </td>
                        <td className="px-6 py-4 ">
                          <button className="py-2 px-5 bg-secondary font-semibold text-white rounded hover:bg-primary transition-all duration-300 flex items-center">
                            <FaKey className="mr-1" />
                            Đổi mật khẩu
                          </button>
                        </td>
                      </tr>
                    ))}
                  {true && (
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <td className="px-6 py-4 text-red-500">
                        Không tìm thấy thông tin nhân viên tương ứng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <nav
                className="flex items-center flex-column flex-wrap md:flex-row justify-between pt-4"
                aria-label="Table navigation"
              >
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto">
                  Hiển thị{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    10
                  </span>{" "}
                  trong{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {20}{" "}
                  </span>
                  nhân viên
                </span>
                <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
                  <li>
                    <a
                      href="#"
                      className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      Trước
                    </a>
                  </li>
                  {Array.from({
                    length: 10,
                  }).map((_, index) => (
                    <li onClick={() => setCurrentPage(index + 1)}>
                      <a
                        href="#"
                        aria-current="page"
                        className={`flex items-center justify-center px-3 h-8 leading-tight ${
                          currentPage === index + 1
                            ? "text-blue-600 border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                            : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        }`}
                      >
                        {index + 1}
                      </a>
                    </li>
                  ))}
                  <li onClick={() => handleClick(currentPage + 1)}>
                    <a
                      href="#"
                      className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      Sau
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
