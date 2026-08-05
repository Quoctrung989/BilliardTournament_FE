import TvBrandingCell from "./TvBrandingCell";
import TvEmptyCell from "./TvEmptyCell";
import TvMatchCell from "./TvMatchCell";
import { LAYOUT_TRANSITION_MS } from "./tvLayout";

const TvLiveBoard = ({
  layout,
  flashState,
  pageKey,
  tournamentName,
  logoUrl,
}) => (
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
      if (slot.type === "branding") {
        return (
          <TvBrandingCell
            key={slot.key}
            tournamentName={tournamentName}
            logoUrl={logoUrl}
            gridColumn={slot.gridColumn}
            gridRow={slot.gridRow}
          />
        );
      }

      if (slot.type === "empty") {
        return (
          <TvEmptyCell
            key={slot.key}
            gridColumn={slot.gridColumn}
            gridRow={slot.gridRow}
          />
        );
      }

      const flash = flashState[slot.match.id] ?? {};
      return (
        <TvMatchCell
          key={slot.key}
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
