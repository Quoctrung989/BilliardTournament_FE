const TvPageDots = ({ pageIndex, totalPages }) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className="flex shrink-0 items-center justify-center gap-2 py-[clamp(0.35rem,0.8vmin,0.6rem)]"
      aria-hidden
    >
      {Array.from({ length: totalPages }).map((_, i) => (
        <span
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === pageIndex ? "1.25rem" : "0.4rem",
            height: "0.4rem",
            background:
              i === pageIndex
                ? "rgba(232, 185, 35, 0.85)"
                : "rgba(255, 255, 255, 0.18)",
          }}
        />
      ))}
    </div>
  );
};

export default TvPageDots;
