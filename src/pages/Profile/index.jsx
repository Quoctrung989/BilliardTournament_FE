import { HomeIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./styles.scss";

const Profile = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [userDetail, setUserDetail] = useState({});

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="profilePage">
      <div className="cardProfile">
        <div className="card-inner">
          <div className="front">
            <h2>Nguyen Trung</h2>
            <p>address</p>
            <button>hover me</button>
          </div>
          <div className="back">
            <div className="topBack">
              <span className="homeIcon" onClick={() => navigate("/")}>
                <HomeIcon />
              </span>
              {/* {userDetail?.avatar !== undefined ? (
                <img
                  className="avatarProfile"
                  src={`http://${userDetail?.avatar}`}
                />
              ) : ( */}
              <img
                className="avatarProfile"
                src={`https://cdn-icons-png.freepik.com/512/219/219986.png`}
              />
              {/* )} */}
            </div>
            <h1>
              Nguyen <br />
              <span>Quoc Trung</span>
            </h1>
            <p>
              <span>Email: email@gmail.com</span>
              <br />
              <span>SDT: 0888123123</span>
              <br />
              <span>Giới tính: Nam</span>
            </p>

            <div className="rowProfile">
              <div className="colProfile">
                <h2>3</h2>
                <p>Giải đấu</p>
              </div>
              <div className="colProfile">
                <h2>15</h2>
                <p>nhân viên</p>
              </div>
              <div className="colProfile">
                <h2>15</h2>
                <p>Cơ thủ</p>
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

export default Profile;
