import { Container } from 'react-bootstrap';
import TradingViewWidget from '../components/TradingViewWidget';

export default function Dashboard() {
  return (
    <Container className="mt-4">
      <h1>Dashboard</h1>
      <TradingViewWidget symbol="BITSTAMP:BTCUSD" colorTheme="light" dateRange="1D" />
    </Container>
  );
}
