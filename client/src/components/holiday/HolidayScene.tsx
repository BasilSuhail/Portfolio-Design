import { useEffect } from "react";
import { HolidayDecor } from "./HolidayDecor";
import { Snowfall } from "./Snowfall";

/**
 * Everything holiday mode draws. Kept in its own file so none of it is downloaded until the
 * mode is switched on. `onReady` fires once it is on screen.
 */
export default function HolidayScene({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <div className="holiday-scene">
      <HolidayDecor />
      <Snowfall />
    </div>
  );
}
