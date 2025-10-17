// TradingViewWidget.tsx
import React, { useEffect, useRef, memo } from "react";

interface TradingViewWidgetProps {
  symbol: string;
  theme?: "light" | "dark";
  interval?: "1" | "5" | "15" | "30" | "60" | "120" | "240" | "D" | "W" | "M";
  locale?: string;
  timezone?: string;
  backgroundColor?: string;
  gridColor?: string;
  allowSymbolChange?: boolean;
  autosize?: boolean;
  hideSideToolbar?: boolean;
  hideTopToolbar?: boolean;
  hideLegend?: boolean;
  hideVolume?: boolean;
  showCalendar?: boolean;
  showHotlist?: boolean;
  withDateRanges?: boolean;
  studies?: string[];
  compareSymbols?: string[];
  watchlist?: string[];
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  theme = "dark",
  interval = "D",
  locale = "en",
  timezone = "Etc/UTC",
  backgroundColor = "#0F0F0F",
  gridColor = "rgba(242, 242, 242, 0.06)",
  allowSymbolChange = true,
  autosize = true,
  hideSideToolbar = true,
  hideTopToolbar = false,
  hideLegend = false,
  hideVolume = false,
  showCalendar = false,
  showHotlist = false,
  withDateRanges = false,
  studies = [],
  compareSymbols = [],
  watchlist = [],
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
      symbol,
      theme,
      interval,
      locale,
      timezone,
      backgroundColor,
      gridColor,
      allow_symbol_change: allowSymbolChange,
      autosize,
      hide_side_toolbar: hideSideToolbar,
      hide_top_toolbar: hideTopToolbar,
      hide_legend: hideLegend,
      hide_volume: hideVolume,
      calendar: showCalendar,
      hotlist: showHotlist,
      withdateranges: withDateRanges,
      studies,
      compareSymbols,
      watchlist,
      save_image: true,
    });

    containerRef.current.innerHTML = ""; // Clear previous widget
    containerRef.current.appendChild(script);
  }, [
    symbol,
    theme,
    interval,
    locale,
    timezone,
    backgroundColor,
    gridColor,
    allowSymbolChange,
    autosize,
    hideSideToolbar,
    hideTopToolbar,
    hideLegend,
    hideVolume,
    showCalendar,
    showHotlist,
    withDateRanges,
    studies,
    compareSymbols,
    watchlist,
  ]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ width: "100%", height: "calc(100% - 32px)" }}
      />
      <div className="tradingview-widget-copyright">
        <a
          href="https://www.tradingview.com/"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
};

export default memo(TradingViewWidget);
