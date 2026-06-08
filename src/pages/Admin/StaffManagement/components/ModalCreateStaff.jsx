import { useEffect, useState } from "react";
import axiosClient from "../../../../api/axiosClient";
import { toast } from "react-toastify";
import Loading from "../../../../components/layouts/Loading/Loading";

const ModalCreateStaff = ({ closeModal, setIsCreateSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [responseImageUrl, setResponseImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [staffType, setStaffType] = useState("REFEREE");
  const [errors, setErrors] = useState({});

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warn("Vui lòng chọn một file ảnh trước!");
      return;
    }
    setIsLoading(true);

    const formData = new FormData();

    formData.append("file", selectedFile);

    await axiosClient
      .post(`/storage/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        toast.success("Tải ảnh lên thành công!");
        setResponseImageUrl(response.data.data.url);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const validateField = (name, value, currentErrors = errors) => {
    const newErrors = { ...currentErrors };

    switch (name) {
      case "email":
        if (!value) newErrors.email = "Email là bắt buộc";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          newErrors.email = "Email không hợp lệ";
        else delete newErrors.email;
        break;

      case "fullName":
        if (!value.trim()) newErrors.fullName = "Tên nhân viên là bắt buộc";
        else delete newErrors.fullName;
        break;
      case "displayName":
        if (!value.trim()) newErrors.displayName = "Tên hiển thị là bắt buộc";
        else delete newErrors.displayName;
        break;

      case "password":
        if (!value) newErrors.password = "Mật khẩu là bắt buộc";
        else if (value.length < 6)
          newErrors.password = "Mật khẩu phải từ 6 ký tự";
        else delete newErrors.password;
        break;

      case "confirmPassword":
        if (!value) newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
        else if (value !== password)
          newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        else delete newErrors.confirmPassword;
        break;

      case "phoneNumber":
        if (!value) newErrors.phoneNumber = "Số điện thoại là bắt buộc";
        else if (!/^(0[3|5|7|8|9])+([0-9]{8})\b$/.test(value))
          newErrors.phoneNumber = "Số điện thoại không hợp lệ (10 số)";
        else delete newErrors.phoneNumber;
        break;

      case "dateOfBirth":
        if (!value) newErrors.dateOfBirth = "Ngày sinh là bắt buộc";
        else delete newErrors.dateOfBirth;
        break;

      case "gender":
        if (!value) newErrors.gender = "Vui lòng chọn giới tính";
        else delete newErrors.gender;
        break;

      case "staffType":
        if (!value) newErrors.staffType = "Vui lòng chọn loại nhân viên";
        else delete newErrors.staffType;
        break;

      case "avatar":
        if (!value) newErrors.avatar = "Vui lòng tải lên ảnh đại diện";
        else delete newErrors.avatar;
        break;

      default:
        break;
    }
    return newErrors;
  };

  const validateAll = () => {
    let currentErrors = {};

    currentErrors = validateField("email", email, currentErrors);
    currentErrors = validateField("fullName", fullName, currentErrors);
    currentErrors = validateField("displayName", displayName, currentErrors);
    currentErrors = validateField("password", password, currentErrors);
    currentErrors = validateField(
      "confirmPassword",
      confirmPassword,
      currentErrors,
    );
    currentErrors = validateField("phoneNumber", phoneNumber, currentErrors);
    currentErrors = validateField("dateOfBirth", dateOfBirth, currentErrors);
    currentErrors = validateField("gender", gender, currentErrors);
    currentErrors = validateField("staffType", staffType, currentErrors);
    currentErrors = validateField("avatar", responseImageUrl, currentErrors);

    setErrors(currentErrors);

    return Object.keys(currentErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateAll()) {
      const staffData = {
        email,
        fullName,
        displayName,
        password,
        phone: phoneNumber,
        dateOfBirth,
        gender,
        bio: staffType,
        avatarUrl: responseImageUrl,
      };
      console.log(staffData);
      await axiosClient
        .post("/manager/accounts/staff", staffData)
        .then((response) => {
          toast.success("Nhân viên đã được thêm thành công!");
          closeModal();
          setIsCreateSuccess(true);
        })
        .catch((error) => {
          toast.error("Có lỗi xảy ra khi thêm nhân viên!");
        });
    } else {
      toast.error("Vui lòng kiểm tra lại thông tin nhân viên!");
    }
  };

  useEffect(() => {
    if (selectedFile) {
      handleUpload();
    }
  }, [selectedFile]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 ">
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-xl z-50 overflow-y-auto max-h-screen ">
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
        >
          <svg
            className="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
          <span className="sr-only">Close modal</span>
        </button>
        <h2 className="text-xl font-semibold mb-4">Thêm nhân viên</h2>
        <div className="flex gap-4 mb-4 justify-between">
          <div className="w-[50%]">
            <label className="block mb-2">
              Email nhân viên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Email nhân viên"
              className="w-full px-3 py-2 border rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div className="w-[50%]">
            <label className="block mb-2">
              Tên nhân viên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Tên nhân viên"
              className="w-full px-3 py-2 border rounded-md"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-2">
            Tên hiển thị <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Tên hiển thị"
            className="w-full px-3 py-2 border rounded-md"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          {errors.displayName && (
            <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block mb-2">
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full px-3 py-2 border rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block mb-2">
            Xác nhận mật khẩu <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            className="w-full px-3 py-2 border rounded-md"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>
        <div className="flex gap-4 mb-4 justify-between">
          <div className="mb-4 w-[50%]">
            <label className="block mb-2">
              Số điện thoại nhân viên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Số điện thoại nhân viên"
              className="w-full px-3 py-2 border rounded-md"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(
                  e.target.value.length <= 10 ? e.target.value : phoneNumber,
                )
              }
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>
          <div className="mb-4 w-[50%]">
            <label className="block mb-2">
              Ngày sinh <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              placeholder="Ngày sinh"
              className="w-full px-3 py-2 border rounded-md"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
            )}
          </div>
        </div>
        <div className="mb-4 flex justify-between gap-4">
          <div className="w-[50%]">
            <label className="block mb-2">
              Giới tính <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-6 py-2">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="radio"
                  name="gender"
                  value="MALE"
                  checked={gender === "MALE"}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                />
                <span className="ms-2 text-sm font-medium text-gray-900">
                  Nam
                </span>
              </label>

              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="radio"
                  name="gender"
                  value="FEMALE"
                  checked={gender === "FEMALE"}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                />
                <span className="ms-2 text-sm font-medium text-gray-900">
                  Nữ
                </span>
              </label>
            </div>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
            )}
          </div>
          <div className="w-[50%]">
            <label className="block mb-2">
              Loại nhân viên <span className="text-red-500">*</span>
            </label>

            <select
              id="countries"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 
                                            focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
                                            dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={staffType}
              onChange={(e) => setStaffType(e.target.value)}
            >
              <option defaultChecked value="REFEREE">
                Trọng tài
              </option>
              <option value="VENUE_STAFF">Nhân viên thời vụ</option>
            </select>
            {errors.staffType && (
              <p className="text-red-500 text-xs mt-1">{errors.staffType}</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-2">
            Avatar nhân viên <span className="text-red-500">*</span>
          </label>
          <div className="flex w-full px-3 py-2 ">
            {responseImageUrl && (
              <img
                src={responseImageUrl}
                alt="Avatar"
                className="w-32 h-32 object-cover mb-2"
              />
            )}
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp, image/gif"
              className="w-full px-3 py-2 border rounded-md"
              onChange={handleFileChange}
            />
          </div>
          {errors.avatar && (
            <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            className="text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            onClick={handleSubmit}
          >
            <svg
              className="me-1 -ms-1 w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            Thêm
          </button>
        </div>
      </div>
      {isLoading && <Loading />}
    </div>
  );
};

export default ModalCreateStaff;
