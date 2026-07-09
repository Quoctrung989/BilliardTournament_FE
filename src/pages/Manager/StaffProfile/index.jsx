import { HomeIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../../api/axiosClient";
import "./StaffProfile.scss";

const StaffProfile = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [userDetail, setUserDetail] = useState({});

  const fetchUserDetail = async () => {
    const response = await axiosClient.get(`/manager/employees/${slug}`);
    setUserDetail(response.data.data);
    console.log(response.data.data);
  };

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetchUserDetail();
  }, [slug]);

  return (
    <div className="staffProfilePage">
      <div className="cardProfile">
        <div className="card-inner">
          <div className="front">
            <h2>{userDetail?.displayName || "Tên hiển thị"}</h2>
            <p>{userDetail?.dateOfBirth || "Ngày sinh"}</p>
            <button>hover me</button>
          </div>
          <div className="back">
            <div className="topBack">
              <span className="homeIcon mb-10" onClick={() => navigate("/")}>
                <HomeIcon />
              </span>
              {userDetail?.avatarUrl ? (
                <img
                  className="avatarProfile"
                  src={`${userDetail?.avatarUrl}`}
                />
              ) : (
                <img
                  className="avatarProfile"
                  src={`https://cdn-icons-png.freepik.com/512/219/219986.png`}
                />
              )}
            </div>
            <h1>
              {userDetail?.fullName?.split(" ")[0] || " "} <br />
              <span>
                {userDetail?.fullName?.split(" ").slice(1).join(" ") || " "}
              </span>
            </h1>
            <p>
              <span>Email: {userDetail?.email || "Email"}</span>
              <br />
              <span>SDT: {userDetail?.phone || "Số điện thoại"}</span>
              <br />
              <span>
                Giới tính: {userDetail?.gender === "MALE" ? "Nam" : "Nữ"}
              </span>
            </p>

            <div className="rowProfile">
              <div className="colProfile">
                <h2 className="text-sm">Chức vụ</h2>
                <p>{userDetail?.bio === "STAFF" ? "Nhân viên" : "Trọng tài"}</p>
              </div>
              <div className="colProfile">
                <h2 className="text-sm">Trạng thái</h2>
                <p> {userDetail?.status === "ACTIVE" ? "Hoạt động" : "Nghỉ"}</p>
              </div>
            </div>

            <div className="rowProfile">
              <button variant="outlined" onClick={() => handleBack()}>
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
