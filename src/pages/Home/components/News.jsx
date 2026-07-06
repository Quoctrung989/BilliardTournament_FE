const newsData = [
  {
    id: 1,
    title:
      "DON’T MISS YOUR CHANCE TO WITNESS THE UK OPEN LIVE — SECURE YOUR SEAT NOW!",
    image: "/images/tournaments/vn-player-1.jpg",
    large: true,
  },
  {
    id: 2,
    title:
      "TALKSPORT TO BROADCAST UK OPEN POOL CHAMPIONSHIP ALONGSIDE CAPSTONE TV AND GLOBAL ...",
    image: "/images/tournaments/pool-2.jpg",
  },
  {
    id: 3,
    title:
      "WORLD NINEBALL TOUR INTRODUCES FIRST SEEDED JUNIOR FIELD ON TOUR AT CAPSTONE NXT G...",
    image: "/images/tournaments/action-1.jpg",
  },
  {
    id: 4,
    title:
      "YAPP DEFENDS CROWN, GORST RETURNS AND CHAMPIONS COLLIDE IN BLOCKBUSTER 2026 U...",
    image: "/images/tournaments/pool-4.jpg",
  },
  {
    id: 5,
    title:
      "Bruin Capital Backs Matchroom Sport in Landmark Deal to Accelerate Global Exp...",
    image: "/images/tournaments/pool-6.jpg",
  },
];

const News = () => {
  return (
    <div className="h-wrapper w-full bg-cover bg-center px-6 py-8 max-w-[1600px] mx-auto">
      <div className="mx-auto grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="lg:col-span-1 ">
          <div className="group overflow-hidden rounded-l-[24px] border border-gray-300 dark:border-white/10 bg-white dark:bg-[#161a22] shadow-sm cursor-pointer">
            <img
              src={newsData[0].image}
              alt=""
              className="h-[460px] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
            />

            <div className="flex items-end justify-between p-5">
              <h1 className="max-w-[85%] text-[33px] font-black uppercase leading-[1.05] tracking-tight text-[#1d2430] dark:text-gray-100">
                {newsData[0].title}
              </h1>

              <button className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 dark:border-white/20 text-xl text-[#1d2430] dark:text-gray-200 transition hover:bg-gray-100 dark:hover:bg-white/10">
                ↗
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="bg-[var(--wnt25-color-light)] dark:bg-[#161a22] p-4 rounded-md flex justify-between items-center">
            <h2 className="text-lg font-bold dark:text-gray-100">CAPSTONE Latest</h2>
            <button className="flex w-wrapper items-center justify-center rounded-md border border-gray-300 dark:border-white/20 text-sm dark:text-gray-200 transition hover:bg-gray-100 dark:hover:bg-white/10 italic">
              All News
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {newsData.slice(1).map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-l-[22px] border border-gray-300 dark:border-white/10 bg-white dark:bg-[#161a22] shadow-sm cursor-pointer"
              >
                <img
                  src={item.image}
                  alt=""
                  className="h-[170px] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                />

                <div className="flex items-end justify-between p-4">
                  <h2 className="text-[12px] font-extrabold uppercase leading-[1.3] text-[#1d2430] dark:text-gray-100">
                    {item.title}
                  </h2>

                  <button className="ml-3 flex h-9 w-9 min-w-[36px] items-center justify-center rounded-md border border-gray-300 dark:border-white/20 text-lg text-[#1d2430] dark:text-gray-200 transition hover:bg-gray-100 dark:hover:bg-white/10">
                    ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
