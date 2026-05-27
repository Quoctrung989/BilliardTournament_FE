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
      "TALKSPORT TO BROADCAST UK OPEN POOL CHAMPIONSHIP ALONGSIDE CAPSTONE TV AND GLOBAL ...",
    image:
      "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp",
  },
  {
    id: 3,
    title:
      "WORLD NINEBALL TOUR INTRODUCES FIRST SEEDED JUNIOR FIELD ON TOUR AT CAPSTONE NXT G...",
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
    <div className="w-full flex flex-col gap-6 p-6 max-w-[1600px] mx-auto">
      <div className="bg-[var(--wnt25-color-light)] p-4 rounded-md flex justify-between items-center">
        <h2 className="text-lg font-bold">Schedule</h2>
        <button className="flex h-10 w-wrapper items-center justify-center rounded-md border border-gray-300 text-sm transition hover:bg-gray-100 italic">
          Full Schedule
        </button>
      </div>
      <div className="mx-auto grid grid-cols-1 gap-6 p-4 lg:grid-cols-[1fr_1fr] items-stretch">
        <div className="h-full">
          <div className="group flex h-full flex-col overflow-hidden rounded-l-[24px] border border-gray-300 bg-white shadow-sm cursor-pointer">
            <img
              src={newsData[0].image}
              alt=""
              className="h-full min-h-[100px] max-h-[400px] w-full flex-1 object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
            />

            <div className="flex flex-col p-6 gap-4">
              <div className="flex w-full justify-between">
                <div className="flex justify-between gap-2 items-center">
                  <span className="text-[14px] font-bold px-2 py-1 border-[1px] rounded-lg border-[var(--wnt25-color-red)] text-[var(--wnt25-color-red)] text-xs">
                    May 26 - 31 2026
                  </span>
                  <span className="text-[22px] font-bold  text-[var(--wnt25-color-dark)] text-sm">
                    CAPSTONE
                  </span>
                </div>

                <span className="font-italic text-[12px] text-[var(--wnt25-color-dark)] text-sm font-bold ">
                  Major
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold ">
                  UK Open Pool Championship
                </h3>
                <span className="text-sm font-bold">Brentwood, Essex, UK</span>
                <p className="text-sm font-italic font-bold opacity-[80%]">
                  Prize Fund: $225,000
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col gap-6 ">
          {newsData.slice(1).map((item) => (
            <div
              key={item.id}
              className="group flex-1 overflow-hidden flex rounded-r-[22px] border border-l-transparent border-gray-300 bg-white shadow-sm cursor-pointer"
            >
              <div className="flex justify-center items-center p-4  max-w-[30%]">
                <img
                  src={item.image}
                  alt=""
                  className="h-[150px]  object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                />
              </div>
              <div className="h-[84%] my-auto py-4 w-[1px] bg-gray-300"></div>

              <div className="flex flex-col p-4 gap-4 min-w-[70%]">
                <div className="flex w-full justify-between items-center">
                  <div className="flex justify-between gap-2 items-center">
                    <span className="text-[14px] p-1 font-bold border-[1px] rounded-lg border-[var(--wnt25-color-red)] text-[var(--wnt25-color-red)] text-xs">
                      May 26 - 31 2026
                    </span>
                    <span className="text-[14px] font-bold  text-[var(--wnt25-color-dark)] text-sm">
                      CAPSTONE
                    </span>
                  </div>

                  <span className="font-italic text-[12px] text-[var(--wnt25-color-dark)] text-xs font-bold opacity-[90%]">
                    Ranking
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold ">
                    UK Open Pool Championship
                  </h3>
                  <span className="text-sm font-bold">
                    Brentwood, Essex, UK
                  </span>
                  <p className="text-sm font-italic font-bold opacity-[80%]">
                    Prize Fund: $225,000
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
