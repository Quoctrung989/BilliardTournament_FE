import Banner from "./components/Banner";
import News from "./components/News";
import Schedule from "./components/Schedule";
import Ranked from "./components/Ranked";
import Marquee from "./components/Marquee";
import "./home-motion.css";

const Home = () => {
  return (
    <div className="w-full bg-white dark:bg-[#0b0d12] transition-colors duration-300">
      <Banner />

      {/* Mỗi dải một nguồn và một hướng chạy, để ba dải không lặp y hệt nhau */}
      <Marquee source="news" direction="left" label="Tin mới" />
      <News />

      <Marquee source="tournaments" direction="right" label="Sắp diễn ra" />
      <Schedule />

      <Marquee source="tournaments" direction="left" label="Mùa giải 2026" />
      <Ranked />
    </div>
  );
};

export default Home;
