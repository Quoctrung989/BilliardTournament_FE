import Banner from "./components/Banner";
import {
  BACKGROUND_IMAGE_URL_DARK,
  BACKGROUND_IMAGE_URL_HOME,
} from "../../constants/constUrl";
import News from "./components/News";
import Schedule from "./components/Schedule";
import Ranked from "./components/Ranked";
import { useThemeStore } from "../../store/themeStore";

const Home = () => {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";

  return (
    <div className="w-full bg-white dark:bg-[#0b0d12] transition-colors duration-300">
      <div
        className="w-full"
        style={{
          backgroundImage: isDark
            ? "none"
            : `url('${BACKGROUND_IMAGE_URL_HOME}')`,
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
          backgroundImage: isDark
            ? "none"
            : `url('${BACKGROUND_IMAGE_URL_HOME}')`,
        }}
      >
        <Ranked />
      </div>
    </div>
  );
};

export default Home;
