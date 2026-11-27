import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import RuleOutlined from "@mui/icons-material/RuleOutlined";
import SyncOutlined from "@mui/icons-material/SyncOutlined";
import { useState } from "react";
import { Modal, Nav } from "react-bootstrap";
import {
  GUIDE_CATEGORY_SUGGESTIONS,
  GUIDE_PROGRESS,
  GUIDE_RULE,
  GUIDE_SUMMARY,
  RULES_STEPS,
  TRANSACTIONS_STEPS,
} from "../../utils/suggestionsGuide";
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

  return (
    <Modal show={show} onHide={onHide} size="xl" aria-labelledby="suggestions-guide-title">
      <Modal.Header closeButton>
        <Modal.Title id="suggestions-guide-title">How the Suggestions page works</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small">
          Finverse only <em>suggests</em>; nothing changes until you accept. The example below uses made-up data.
        </p>
        <Nav variant="pills" activeKey={view} className="mb-3" onSelect={(key) => key && setView(key as View)}>
          <Nav.Item>
            <Nav.Link eventKey="rules">Page and rule suggestions</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="transactions">Transaction suggestions</Nav.Link>
          </Nav.Item>
        </Nav>

        {view === "rules" ? (
          <GuideFrame steps={RULES_STEPS}>
            <div data-guide="progress">
              <SectionTitle icon={<InsightsOutlined fontSize="small" />} title="Progress" />
              <CategorizationProgressChart months={GUIDE_PROGRESS} />
            </div>
            <div data-guide="status">
              <SectionTitle icon={<SyncOutlined fontSize="small" />} title="Last run" />
              <RunStatus summary={GUIDE_SUMMARY} starting={false} onSuggestAgain={() => {}} />
            </div>
            <Nav variant="tabs" activeKey="rules" className="mb-3" data-guide="tabs">
              <Nav.Item>
                <Nav.Link eventKey="rules">
                  <RuleOutlined fontSize="small" className="me-1" />
                  Rules (1)
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="transactions">
                  <ReceiptLongOutlined fontSize="small" className="me-1" />
                  Transactions (3)
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <RuleSuggestionCard suggestion={GUIDE_RULE} guide categories={[]} showTotals onAccept={noop} onReject={noop} />
          </GuideFrame>
        ) : (
          <GuideFrame steps={TRANSACTIONS_STEPS}>
            <CategorySuggestionGroups
              suggestions={GUIDE_CATEGORY_SUGGESTIONS}
              categories={[]}
              showTotals
              acceptAll={noop}
              acceptMerchant={noop}
              acceptAs={noop}
              reject={noop}
            />
          </GuideFrame>
        )}

        <p className="text-muted small mt-3 mb-0">
          Pending suggestions also appear on the Transactions page, under the transaction's current category, with the same accept /
          change / reject buttons. After you fix the same merchant by hand a few times, Finverse offers to create a rule for it.
        </p>
      </Modal.Body>
    </Modal>
  );
}
