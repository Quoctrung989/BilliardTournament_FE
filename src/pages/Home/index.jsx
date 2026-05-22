import Banner from "./components/Banner";
import { BACKGROUND_IMAGE_URL_HOME } from "../../constants/constUrl";
import News from "./components/News";
import Schedule from "./components/Schedule";

const Home = () => {
  return (
    <div
      className="w-full "
      style={{
        backgroundImage: `url('${BACKGROUND_IMAGE_URL_HOME}')`,
      }}
    >
      <Banner />
      <News />
      <Schedule />
      <div className="w-full h-[400px]"></div>
    </div>
  );
};

export default Home;
