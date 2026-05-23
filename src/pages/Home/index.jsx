import Banner from "./components/Banner";
import {
  BACKGROUND_IMAGE_URL_DARK,
  BACKGROUND_IMAGE_URL_HOME,
} from "../../constants/constUrl";
import News from "./components/News";
import Schedule from "./components/Schedule";
import Ranked from "./components/Ranked";

const Home = () => {
  return (
    <div className="w-full">
      <div
        className="w-full"
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGE_URL_HOME}')`,
        }}
      >
        <Banner />
        <div className=" ">
          <News />
          <Schedule />
        </div>
      </div>
      <div
        className="w-full"
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGE_URL_DARK}')`,
        }}
      >
        <Ranked />
      </div>
    </div>
  );
};

export default Home;
