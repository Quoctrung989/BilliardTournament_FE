import React from "react";

const VerifyModal = () => {
  return (
    <div
      id="popup-delete"
      className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 animate-fadeIn"
    >
      <div className="relative py-4 w-full max-w-xl bg-white shadow dark:bg-gray-700 animate-slideIn">
        <button
          type="button"
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
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
          <span className="sr-only">Close modal</span>
        </button>
        <div className="py-2">
          <div className="flex-row px-12">
            <div className="w-full flex items-center">
              <h2 className="font-semibold text-xl">Xác thực OTP</h2>
            </div>
            <div className="w-full flex items-center mb-3">
              <span className="py-2 text-sm">
                Vui lòng nhập mã OTP đã được gửi tới email{" "}
              </span>
            </div>
            <div className="w-full flex items-center my-6 otp justify-center"></div>
            <div className="w-full flex items-center mb-3">
              <span className="py-2 text-sm w-[70%]">
                Không nhận được mã?{" "}
                <label className="font-semibold underline text-blue-800 cursor-pointer">
                  Gửi lại OTP
                </label>
              </span>
              <div className="">
                <span className="font-normal text-sm">
                  Mã sẽ hết hạn <b className="text-red-600"></b>
                </span>
              </div>
            </div>
            <div className="flex w-full justify-center my-6">
              <div className="w-[80%] flex justify-around">
                <button className="px-3 py-2 bg-gray-400 w-[45%] rounded-full text-black font-semibold duration-300 transition-all hover:opacity-70">
                  Huỷ
                </button>
                <button className="px-3 py-2 bg-blue-700 w-[45%] rounded-full text-white font-semibold duration-300 transition-all hover:opacity-70">
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyModal;
