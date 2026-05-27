import React from "react";

const players = [
  {
    rank: 1,
    name: "Fedor Gorst",
    country: "🇺🇸",
    image:
      "https://matchroompool.com/wp-content/uploads/fedor-web-scaled-1.webp",
    accent: "var(--accent-yellow)",
  },
  {
    rank: 2,
    name: "Carlo Biado",
    country: "🇵🇭",
    image: "https://matchroompool.com/wp-content/uploads/biado_1.webp",
    accent: "var(--accent-cyan)",
  },
  {
    rank: 3,
    name: "Aloysius Yapp",
    country: "🇸🇬",
    image:
      "https://matchroompool.com/wp-content/uploads/yapp-web-scaled-1.webp",
    accent: "var(--accent-red)",
  },
  {
    rank: 4,
    name: "Johann Chua",
    country: "🇵🇭",
    image: "https://matchroompool.com/wp-content/uploads/Johann-Chua.png",
    accent: "var(--accent-pink)",
  },
  {
    rank: 5,
    name: "Eklent Kaçi",
    country: "🇦🇱",
    image:
      "https://matchroompool.com/wp-content/uploads/eklent-kaci_profile.webp",
    accent: "var(--accent-purple)",
  },
  {
    rank: 6,
    name: "Moritz Neuhausen",
    country: "🇩🇪",
    image:
      "https://matchroompool.com/wp-content/uploads/Moritz-Neuhausen-2.png",
    accent: "var(--accent-green)",
  },
  {
    rank: 7,
    name: "Joshua Filler",
    country: "🇩🇪",
    image: "https://matchroompool.com/wp-content/uploads/Joshua-Filler-3.png",
    accent: "var(--accent-orange)",
  },
  {
    rank: 8,
    name: "Ko Pin Yi",
    country: "🇹🇼",
    image: "https://matchroompool.com/wp-content/uploads/ko-pin-yi-2.png",
    accent: "var(--accent-gray)",
  },
  {
    rank: 9,
    name: "Francisco Sánchez Ruíz",
    country: "🇪🇸",
    image:
      "https://matchroompool.com/wp-content/uploads/Francisco-Sanchez-Ruiz-2.png",
    accent: "var(--accent-yellow)",
  },
];

const Ranked = () => {
  return (
    <div className="flex flex-col gap-10 w-full py-8 px-16 max-w-[1600px] mx-auto">
      <div className=" w-full bg-[var(--wnt25-color-dark)] p-4 rounded-md flex justify-between items-center text-[var(--wnt25-color-light)]">
        <h2 className="text-lg font-bold tracking-tight">
          WNT Nineball's Top 9 Ranked
        </h2>
        <button className="flex h-10 w-wrapper items-center justify-center rounded-md border border-gray-300 text-sm transition hover:bg-gray-100 italic">
          All Ranked Players
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1.15fr_2.2fr]">
        <div className="group overflow-hidden rounded-l-[16px] border-b-[2px] border-l-[2px] border-white">
          <div className="relative overflow-hidden">
            <div
              className={`h-[300px] flex items-end relative bg-[var(--wnt25-color-light)] border-b-[30px]  w-full `}
              style={{
                borderColor: players[0].accent,
              }}
            >
              <img
                src={players[0].image}
                alt=""
                className="
                h-[270px]
                w-full
                object-contain
                 object-center
                transition-transform
                duration-700
                ease-[cubic-bezier(0.25,1,0.5,1)]
                group-hover:scale-105
                z-index-10
                absolute
                inset-0 
              "
              />
            </div>

            <div className="absolute left-5 top-5 text-7xl">
              {players[0].country}
            </div>

            <div className="absolute right-5 top-5 text-[60px] font-black">
              <span className="text-[30px] font-italic font-bold  tracking-tight">
                #
              </span>
              {players[0].rank}
            </div>
          </div>

          <div className="flex items-end justify-between px-6 py-4">
            <div>
              <p className="text-[20px] font-medium leading-none text-white">
                Fedor
              </p>

              <h3 className="text-[36px] font-black uppercase leading-none text-white">
                Gorst
              </h3>
            </div>

            <button className="flex h-12 w-12 items-center justify-center rounded-md border border-white/30 text-2xl transition hover:bg-white/10">
              ↗
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-y-12 gap-x-6 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {players.slice(1).map((player) => {
            const [firstName, ...rest] = player.name.split(" ");
            return (
              <div key={player.rank} className="group ">
                <div className="relative ">
                  <div
                    className={`w-full bg-white border-b-[15px]  relative h-[120px] overflow-visible rounded-tl-[8px] `}
                    style={{
                      borderColor: player.accent,
                    }}
                  >
                    <img
                      src={player.image}
                      alt=""
                      className=" h-[150px] w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 absolute left-0 bottom-0 z-index-50"
                    />
                  </div>

                  <div className="absolute left-1 top-1 text-lg">
                    {player.country}
                  </div>

                  <div className="absolute right-1 top-1 text-2xl font-black">
                    <span className="font-bold text-sm ">#</span>
                    {player.rank}
                  </div>
                </div>

                <div
                  className={`p-4 rounded-bl-[8px] border-b border-l border-white h-[70px] `}
                >
                  <h3 className="text-[15px] font-black uppercase leading-tight text-[var(--wnt25-color-light)] flex flex-col">
                    <span>{firstName}</span>
                    <span>{rest.join(" ")}</span>
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Ranked;
