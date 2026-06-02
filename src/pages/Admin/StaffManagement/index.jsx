import { useState } from "react";
import { FaEdit, FaKey, FaPlus, FaSearch } from "react-icons/fa";

const StaffManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="rounded-lg bg-white p-16 shadow min-h-[90vh]">
      <h1 className="font-black text-3xl">Quản lý nhân viên</h1>

      <div className="flex mt-6 flex-col gap-4 md:flex-row justify-between">
        <div className="relative grow rounded-md border-2 border-gray-300">
          <FaSearch className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            className="w-full px-4 py-3 pl-10 outline-none italic"
            placeholder="Nhập tên nhân viên"
          />
        </div>
        <div className="flex items-center">
          <button className="py-2 px-5 bg-blue-500 font-semibold text-white rounded hover:bg-blue-600 transition-all duration-300 flex items-center">
            <FaPlus className="mr-1" />
            Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Tên Nhân Viên</th>
              <th scope="col" className="px-6 py-3">Tên tài khoản</th>
              <th scope="col" className="px-6 py-3">Số điện thoại</th>
              <th scope="col" className="px-6 py-3">Vai trò</th>
              <th scope="col" className="px-6 py-3"><span className="sr-only">Chỉnh sửa</span></th>
              <th scope="col" className="px-6 py-3"><span className="sr-only">Đổi mật khẩu</span></th>
            </tr>
          </thead>
          <tbody>
            {Array(5)
              .fill()
              .map((_, index) => (
                <tr key={index} className="odd:bg-white even:bg-gray-50 border-b">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    Nguyễn Văn A
                  </th>
                  <td className="px-6 py-4">nguyenvana</td>
                  <td className="px-6 py-4">0123456789</td>
                  <td className="px-6 py-4">Quản Lý</td>
                  <td className="px-6 py-4">
                    <button className="py-2 px-5 bg-blue-500 font-semibold text-white rounded hover:bg-primary transition-all duration-300 flex items-center">
                      <FaEdit className="mr-1" />
                      Chỉnh sửa
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button className="py-2 px-5 bg-secondary font-semibold text-white rounded hover:bg-primary transition-all duration-300 flex items-center">
                      <FaKey className="mr-1" />
                      Đổi mật khẩu
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
            Hiển thị <span className="font-semibold text-gray-900">10</span> trong{" "}
            <span className="font-semibold text-gray-900">20</span> nhân viên
          </span>
          <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
            <li>
              <button className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700">
                Trước
              </button>
            </li>
            {Array.from({ length: 10 }).map((_, index) => (
              <li key={index}>
                <button
                  onClick={() => setCurrentPage(index + 1)}
                  className={`flex items-center justify-center px-3 h-8 leading-tight border border-gray-300 ${
                    currentPage === index + 1
                      ? "text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                      : "text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700"
              >
                Sau
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default StaffManagement;
