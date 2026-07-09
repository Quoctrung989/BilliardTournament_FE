import TvMatchCell from "./TvMatchCell";
import { LAYOUT_TRANSITION_MS } from "./tvLayout";

const TvLiveBoard = ({ layout, flashState, pageKey }) => (
  <div
    key={pageKey}
    className="tv-grid tv-page-fade-in grid min-h-0 flex-1"
    style={{
      gridTemplateColumns: layout.gridTemplateColumns,
      gridTemplateRows: layout.gridTemplateRows,
      gap: layout.gap,
      transitionDuration: `${LAYOUT_TRANSITION_MS}ms`,
    }}
  >
    {layout.slots.map((slot) => {
      const id = slot.match.id;
      const flash = flashState[id] ?? {};
      return (
        <TvMatchCell
          key={id}
          match={slot.match}
          layout={layout}
          gridColumn={slot.gridColumn}
          gridRow={slot.gridRow}
          cellFlash={flash.cell}
          scoreFlash={{ p1: flash.p1, p2: flash.p2 }}
        />
      );
    })}
  </div>
);

export default TvLiveBoard;
