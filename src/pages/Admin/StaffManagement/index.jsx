import { useEffect, useState } from "react";
import { FaEdit, FaKey, FaPlus, FaSearch } from "react-icons/fa";
import axiosClient from "../../../api/axiosClient";
import ModalChangeStatus from "./components/ModalChangeStatus";
import ModalCreateStaff from "./components/ModalCreateStaff";
import { useNavigate } from "react-router-dom";

const StaffManagement = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [listStaffs, setListStaffs] = useState([]);
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    isLast: false,
  });
  const [showModalStatus, setShowModalStatus] = useState(false);
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isCreateSuccess, setIsCreateSuccess] = useState(false);

  const start =
    pagination.totalElements === 0
      ? 0
      : pagination.pageNumber * pagination.pageSize + 1;

  const end = Math.min(
    (pagination.pageNumber + 1) * pagination.pageSize,
    pagination.totalElements,
  );

  const fetchStaffs = async (
    page = currentPage,
    size = 10,
    searchKeyword = keyword,
  ) => {
    await axiosClient.get("/manager/accounts/staffs").then((response) => {
      const data = response.data.data;
      setListStaffs(data.content);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        isLast: data.isLast,
      });
    });
  };

  useEffect(() => {
    fetchStaffs();
  }, [currentPage, keyword, isCreateSuccess]);

  const handlePageChange = (page) => {
    if (page >= 0 && page < pagination.totalPages) {
      setCurrentPage(page);
      fetchStaffs();
    }
  };

  const handleSubmitChangeStatus = async () => {
    await axiosClient
      .put(`/manager/accounts/staffs/${selectedStaff.id}/deactivate`)
      .then((response) => {
        fetchStaffs();
        setShowModalStatus(false);
      });
  };

  return (
    <div className="rounded-lg bg-white dark:bg-[#161a22] p-16 shadow min-h-[90vh]">
      <h1 className="font-black text-3xl">Quản lý nhân viên</h1>

      <div className="flex mt-6 flex-col gap-4 md:flex-row justify-between">
        <div className="relative grow rounded-md border-2 border-gray-300 dark:border-white/15">
          <FaSearch className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            className="w-full px-4 py-3 pl-10 outline-none italic"
            placeholder="Nhập tên nhân viên"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <button
            className="py-2 px-5 bg-blue-500 font-semibold text-white rounded hover:bg-blue-600 transition-all duration-300 flex items-center"
            onClick={() => setShowModalCreate(true)}
          >
            <FaPlus className="mr-1" />
            Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-gray-700 dark:text-white/75 uppercase bg-gray-50 dark:bg-white/5">
            <tr>
              <th scope="col" className="px-6 py-3">
                Tên Nhân Viên
              </th>
              <th scope="col" className="px-6 py-3">
                Email
              </th>
              <th scope="col" className="px-6 py-3">
                Số điện thoại
              </th>
              <th scope="col" className="px-6 py-3">
                Avatar
              </th>
              <th scope="col" className="px-6 py-3">
                Sinh nhật
              </th>
              <th scope="col" className="px-6 py-3">
                Giới tính
              </th>
              <th scope="col" className="px-6 py-3">
                Loại nhân viên
              </th>
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Thông tin</span>
              </th>
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Đổi mật khẩu</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {listStaffs.map((staff, index) => (
              <tr key={index} className="odd:bg-white dark:odd:bg-[#161a22] even:bg-gray-50 dark:even:bg-white/5 border-b dark:border-white/10">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap"
                >
                  {staff.fullName}
                </th>
                <td className="px-6 py-4">{staff.email}</td>
                <td className="px-6 py-4">{staff.phone}</td>
                <td className="px-6 py-4">
                  <img
                    src={staff.avatarUrl}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                </td>
                <td className="px-6 py-4">{staff.dateOfBirth}</td>
                <td className="px-6 py-4">{staff.gender}</td>
                <td className="px-6 py-4">
                  {staff.bio == "REFEREE" ? "Trọng tài" : "Nhân viên"}
                </td>
                <td className="px-6 py-4">
                  <button
                    className="py-2 px-5 bg-blue-500 font-semibold text-white rounded hover:bg-primary transition-all duration-300 flex items-center"
                    onClick={() => navigate(`/staffProfile/${staff.id}`)}
                  >
                    <FaEdit className="mr-1" />
                    Xem
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    className="py-2 px-5 bg-secondary font-semibold text-white rounded hover:bg-primary transition-all duration-300 flex items-center"
                    onClick={() => {
                      setSelectedStaff(staff);
                      setShowModalStatus(true);
                    }}
                  >
                    Đổi trạng thái
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
            Hiển thị{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {start}-{end}
            </span>{" "}
            trong{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {pagination.totalElements}
            </span>{" "}
            nhân viên
          </span>
          <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
            <li>
              <button
                className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white dark:bg-[#161a22] border border-gray-300 dark:border-white/15 rounded-s-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white/75"
                onClick={() => handlePageChange(pagination.pageNumber - 1)}
              >
                Trước
              </button>
            </li>
            {Array.from({ length: pagination.totalPages }).map((_, index) => (
              <li key={index}>
                <button
                  onClick={() => handlePageChange(index)}
                  className={`flex items-center justify-center px-3 h-8 leading-tight border border-gray-300 ${
                    pagination.pageNumber === index
                      ? "text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                      : "text-gray-500 bg-white dark:bg-[#161a22] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white/75"
                  }`}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => handlePageChange(pagination.pageNumber + 1)}
                className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white dark:bg-[#161a22] border border-gray-300 dark:border-white/15 rounded-e-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white/75"
              >
                Sau
              </button>
            </li>
          </ul>
        </nav>
      </div>
      {showModalStatus && (
        <ModalChangeStatus
          status={selectedStaff.status}
          closeModal={() => setShowModalStatus(false)}
          staff={selectedStaff}
          handleSubmit={handleSubmitChangeStatus}
        />
      )}

      {showModalCreate && (
        <ModalCreateStaff
          closeModal={() => setShowModalCreate(false)}
          // listRoles={listRoles}
          setIsCreateSuccess={setIsCreateSuccess}
        />
      )}
    </div>
  );
};

export default StaffManagement;
