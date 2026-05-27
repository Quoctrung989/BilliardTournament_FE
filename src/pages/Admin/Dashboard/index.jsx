import HighchartsReact from "highcharts-react-official";
import React from "react";
import { FaEllipsisV } from "react-icons/fa";
import Sidebar from "./components/SideBar";
import DashboardView from "./components/DashboardView";
import { formatVND } from "../../../utils/helpers";
import { PiMoneyWavy } from "react-icons/pi";
import { FiUserPlus } from "react-icons/fi";
import { LuPackage } from "react-icons/lu";
import Highcharts from "highcharts";
import { BACKGROUND_IMAGE_URL_HOME } from "../../../constants/constUrl";
import axiosClient from "../../../api/axiosClient";

const Dashboard = () => {
  const earning = {
    chart: {
      type: "line",
    },
    title: {
      text: `Thống kê doanh thu theo  "tuần này" `,
    },
    subtitle: {
      text: "Source: " + '<a target="_blank">WNT</a>',
    },
    xAxis: {
      categories: [],
    },
    yAxis: {
      title: {
        text: "VNĐ",
      },
    },
    plotOptions: {
      line: {
        dataLabels: {
          enabled: true,
        },
        enableMouseTracking: false,
      },
    },
    series: [
      {
        name: "Doanh số",
        data: [
          300000000, 250000000, 280000000, 320000000, 350000000, 400000000,
        ],
      },
    ],
  };

  const newRestaurants = {
    chart: {
      type: "line",
    },
    title: {
      text: `Thống kê số giải đấu mới theo `,
    },
    subtitle: {
      text: "Source: " + '<a target="_blank">WNT</a>',
    },
    xAxis: {
      categories: [],
    },
    yAxis: {
      title: {
        text: "VNĐ",
      },
    },
    plotOptions: {
      line: {
        dataLabels: {
          enabled: true,
        },
        enableMouseTracking: false,
      },
    },
    series: [
      {
        name: "Giải đấu",
        data: [5, 8, 6, 10, 12, 15],
      },
    ],
  };

  return (
    <div className="">
      <div className="flex">
        <div className="basis-[12%] h-[100vh]">
          <Sidebar />
        </div>
        <div
          className="basis-[88%] border overflow-scroll h-[100vh]"
          style={{
            backgroundImage: `url('${BACKGROUND_IMAGE_URL_HOME}')`,
          }}
        >
          <DashboardView />
          <div>
            <div className="px-[25px] pt-[25px] bg-[#F8F9FC] pb-[40px]">
              <div className="flex items-center justify-between">
                <h1 className="text-[28px] leading-[34px] font-normal text-[#5a5c69] cursor-pointer">
                  Dashboard
                </h1>
              </div>
              <div className="grid grid-cols-3 gap-[30px] mt-[25px] pb-[15px] ">
                <div className=" h-[100px] rounded-[8px] bg-white border-l-[4px] border-[#4E73DF] flex items-center justify-between px-[30px] cursor-pointer hover:shadow-lg transform hover:scale-[103%] transition duration-300 ease-out">
                  <div>
                    <h2 className="text-[#B589DF] text-[11px] leading-[17px] font-bold uppercase">
                      Doanh thu
                    </h2>
                    <h1 className="text-[20px] leading-[24px] font-bold text-[#5a5c69] mt-[5px]">
                      {formatVND(300000000)}
                    </h1>
                  </div>
                  <PiMoneyWavy fontSize={28} color="" />
                </div>

                <div className=" h-[100px] rounded-[8px] bg-white border-l-[4px] border-[#36B9CC] flex items-center justify-between px-[30px] cursor-pointer hover:shadow-lg transform hover:scale-[103%] transition duration-300 ease-out">
                  <div>
                    <h2 className="text-[#1cc88a] text-[11px] leading-[17px] font-bold uppercase">
                      Số khách hàng mới
                    </h2>
                    <h1 className="text-[20px] leading-[24px] font-bold text-[#5a5c69] mt-[5px]">
                      {123} người dùng
                    </h1>
                  </div>
                  <FiUserPlus fontSize={28} />
                </div>
                <div className=" h-[100px] rounded-[8px] bg-white border-l-[4px] border-[#F6C23E] flex items-center justify-between px-[30px] cursor-pointer hover:shadow-lg transform hover:scale-[103%] transition duration-300 ease-out">
                  <div>
                    <h2 className="text-[#1cc88a] text-[11px] leading-[17px] font-bold uppercase">
                      Tổng số giải đấu
                    </h2>
                    <h1 className="text-[20px] leading-[24px] font-bold text-[#5a5c69] mt-[5px]">
                      4 giải đấu
                    </h1>
                  </div>
                  <LuPackage fontSize={28} />
                </div>
              </div>
              <div className="flex-row mt-[22px] w-full gap-[30px]">
                <div className="flex row justify-start my-2 w-[20%]">
                  <form className="max-w-sm ">
                    <label
                      for="countries"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Chọn khoảng thời gian
                    </label>
                    <select
                      id="countries"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                      <option value="current-week">Tuần này</option>
                      <option value="last-week">Tuần trước</option>
                      <option value="current-month">Tháng này</option>
                      <option value="last-month">Tháng trước</option>
                    </select>
                  </form>
                </div>
                <div className="basis-[100%] border bg-white shadow-md cursor-pointer rounded-[4px]">
                  <div className="bg-[#F8F9FC] flex items-center justify-between py-[15px] px-[20px] border-b-[1px] border-[#EDEDED]">
                    <h2 className="text-[#4e73df] text-[16px] leading-[19px] font-bold">
                      Thống kê doanh thu theo{" "}
                    </h2>
                    <FaEllipsisV color="gray" className="cursor-pointer" />
                  </div>
                  <div className="px-[25px] space-y-[15px] py-[15px]">
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={earning}
                    />
                  </div>
                </div>
                <div className="basis-[100%] border bg-white shadow-md cursor-pointer rounded-[4px]">
                  <div className="bg-[#F8F9FC] flex items-center justify-between py-[15px] px-[20px] border-b-[1px] border-[#EDEDED]">
                    <h2 className="text-[#4e73df] text-[16px] leading-[19px] font-bold">
                      Thống kê khách hàng mới theo{" "}
                    </h2>
                    <FaEllipsisV color="gray" className="cursor-pointer" />
                  </div>
                  <div className="px-[25px] space-y-[15px] py-[15px]">
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={newRestaurants}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
