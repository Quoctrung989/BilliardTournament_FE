const newsData = [
  {
    id: 1,
    title:
      "DON’T MISS YOUR CHANCE TO WITNESS THE UK OPEN LIVE — SECURE YOUR SEAT NOW!",
    image:
      "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp",
    large: true,
  },
  {
    id: 2,
    title:
      "TALKSPORT TO BROADCAST UK OPEN POOL CHAMPIONSHIP ALONGSIDE WNT TV AND GLOBAL ...",
    image:
      "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp",
  },
  {
    id: 3,
    title:
      "WORLD NINEBALL TOUR INTRODUCES FIRST SEEDED JUNIOR FIELD ON TOUR AT WNT NXT G...",
    image:
      "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp",
  },
  {
    id: 4,
    title:
      "YAPP DEFENDS CROWN, GORST RETURNS AND CHAMPIONS COLLIDE IN BLOCKBUSTER 2026 U...",
    image:
      "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp",
  },
];

const Schedule = () => {
  return (
    <div className="w-full flex flex-col gap-6 p-6">
      <div className="bg-[var(--wnt25-color-light)] p-4 rounded-md flex justify-between items-center">
        <h2 className="text-lg font-bold">Schedule</h2>
        <button className="flex h-10 w-wrapper items-center justify-center rounded-md border border-gray-300 text-sm transition hover:bg-gray-100 italic">
          Full Schedule
        </button>
      </div>
      <div className="mx-auto grid grid-cols-1 gap-6 p-2 lg:grid-cols-[1.4fr_1fr] items-stretch">
        <div className="h-full">
          <div className="group flex h-full flex-col overflow-hidden rounded-l-[24px] border border-gray-300 bg-white shadow-sm cursor-pointer">
            <img
              src={newsData[0].image}
              alt=""
              className="h-full min-h-[460px] w-full flex-1 object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
            />

            <div className="flex items-end justify-between p-5">
              <h1 className="max-w-[85%] text-[33px] font-black uppercase leading-[1.05] tracking-tight text-[#1d2430]">
                {newsData[0].title}
              </h1>

              <button className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-xl transition hover:bg-gray-100">
                ↗
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col gap-6">
          {newsData.slice(1).map((item) => (
            <div
              key={item.id}
              className="group flex-1 overflow-hidden rounded-r-[22px] border border border-gray-300 bg-white shadow-sm cursor-pointer"
            >
              <img
                src={item.image}
                alt=""
                className="h-[150px] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
              />

              <div className="flex items-end justify-between p-4">
                <h2 className="text-[12px] font-extrabold uppercase leading-[1.3] text-[#1d2430]">
                  {item.title}
                </h2>

                <button className="ml-3 flex h-9 w-9 min-w-[36px] items-center justify-center rounded-md border border-gray-300 text-lg transition hover:bg-gray-100">
                  ↗
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
