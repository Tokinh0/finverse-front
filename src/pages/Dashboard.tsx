import { Container } from "react-bootstrap";
import TradingViewWidget from "../components/TradingViewWidget";
import { useI18n } from "../i18n/context";

export default function Dashboard() {
  const { t, locale } = useI18n();
  return (
    <Container className="mt-4">
      <h1>{t.dashboard.title}</h1>
      <TradingViewWidget symbol="BITSTAMP:BTCUSD" locale={locale === "en" ? "en" : "br"} />
    </Container>
  );
}
