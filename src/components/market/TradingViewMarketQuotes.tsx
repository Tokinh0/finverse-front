import { memo, useEffect, useRef } from "react";
import { useI18n } from "../../i18n/context";
import { GLOBAL_SYMBOL_GROUPS } from "../../utils/market";

/** Live quotes embedded from TradingView (its script draws an iframe into the container). */
function TradingViewMarketQuotes({ height = 420 }: { height?: number }) {
  const { t, locale } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const groupNames = t.market.globalGroups;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height,
      symbolsGroups: GLOBAL_SYMBOL_GROUPS.map((group) => ({
        name: groupNames[group.key],
        originalName: group.key,
        symbols: group.symbols,
      })),
      showSymbolLogo: true,
      isTransparent: false,
      colorTheme: "dark",
      locale: locale === "en" ? "en" : "br",
    });

    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    container.appendChild(script);
  }, [height, locale, groupNames]);

  return <div className="tradingview-widget-container" ref={containerRef} style={{ minHeight: height }} />;
}

export default memo(TradingViewMarketQuotes);
