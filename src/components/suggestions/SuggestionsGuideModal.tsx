import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import RuleOutlined from "@mui/icons-material/RuleOutlined";
import SyncOutlined from "@mui/icons-material/SyncOutlined";
import { useState } from "react";
import { Modal, Nav } from "react-bootstrap";
import { useI18n } from "../../i18n/context";
import { GUIDE_PROGRESS, GUIDE_SUMMARY, guideCategorySuggestions, guideRule, rulesSteps, transactionsSteps } from "../../utils/suggestionsGuide";
import CategorizationProgressChart from "./CategorizationProgressChart";
import CategorySuggestionGroups from "./CategorySuggestionGroups";
import GuideFrame from "./GuideFrame";
import RuleSuggestionCard from "./RuleSuggestionCard";
import RunStatus from "./RunStatus";
import SectionTitle from "./SectionTitle";

interface Props {
  show: boolean;
  onHide: () => void;
}

type View = "rules" | "transactions";

const noop = async () => {};

/** "How this page works": the page's parts, rendered with example data and annotated. */
export default function SuggestionsGuideModal({ show, onHide }: Props) {
  const [view, setView] = useState<View>("rules");
  const { t } = useI18n();
  const g = t.suggestions.guide;

  return (
    <Modal show={show} onHide={onHide} size="xl" aria-labelledby="suggestions-guide-title">
      <Modal.Header closeButton>
        <Modal.Title id="suggestions-guide-title">{g.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small">{g.intro}</p>
        <Nav variant="pills" activeKey={view} className="mb-3" onSelect={(key) => key && setView(key as View)}>
          <Nav.Item>
            <Nav.Link eventKey="rules">{g.rulesView}</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="transactions">{g.transactionsView}</Nav.Link>
          </Nav.Item>
        </Nav>

        {view === "rules" ? (
          <GuideFrame steps={rulesSteps()}>
            <div data-guide="progress">
              <SectionTitle icon={<InsightsOutlined fontSize="small" />} title={t.suggestions.progress} />
              <CategorizationProgressChart months={GUIDE_PROGRESS} />
            </div>
            <div data-guide="status">
              <SectionTitle icon={<SyncOutlined fontSize="small" />} title={t.suggestions.lastRun} />
              <RunStatus summary={GUIDE_SUMMARY} starting={false} onSuggestAgain={() => {}} />
            </div>
            <Nav variant="tabs" activeKey="rules" className="mb-3" data-guide="tabs">
              <Nav.Item>
                <Nav.Link eventKey="rules">
                  <RuleOutlined fontSize="small" className="me-1" />
                  {t.suggestions.rulesTab(1)}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="transactions">
                  <ReceiptLongOutlined fontSize="small" className="me-1" />
                  {t.suggestions.transactionsTab(3)}
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <RuleSuggestionCard suggestion={guideRule()} guide categories={[]} showTotals onAccept={noop} onReject={noop} />
          </GuideFrame>
        ) : (
          <GuideFrame steps={transactionsSteps()}>
            <CategorySuggestionGroups
              suggestions={guideCategorySuggestions()}
              categories={[]}
              showTotals
              acceptAll={noop}
              acceptMerchant={noop}
              acceptAs={noop}
              reject={noop}
              dontKnow={noop}
            />
          </GuideFrame>
        )}

        <p className="text-muted small mt-3 mb-0">{g.footer}</p>
      </Modal.Body>
    </Modal>
  );
}
