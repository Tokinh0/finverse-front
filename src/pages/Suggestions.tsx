import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import CreateNewFolderOutlined from "@mui/icons-material/CreateNewFolderOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import RuleOutlined from "@mui/icons-material/RuleOutlined";
import SyncOutlined from "@mui/icons-material/SyncOutlined";
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Container, Nav } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { ApiError, categoriesApi, reportsApi, suggestionsApi } from "../api";
import { ErrorMessage, Loading } from "../components/LoadingState";
import CategorizationProgressChart from "../components/suggestions/CategorizationProgressChart";
import CategorySuggestionGroups from "../components/suggestions/CategorySuggestionGroups";
import RuleSuggestionCard from "../components/suggestions/RuleSuggestionCard";
import RunStatus from "../components/suggestions/RunStatus";
import NewSubcategoryModal from "../components/suggestions/NewSubcategoryModal";
import SectionTitle from "../components/suggestions/SectionTitle";
import SuggestionsGuideModal from "../components/suggestions/SuggestionsGuideModal";
import { isRunActive, useSuggestionsSummary } from "../hooks/suggestionsSummary";
import { useI18n } from "../i18n/context";
import type { CategorizationProgressMonth, Category, CategorySuggestion, RuleSuggestion } from "../types";
import { messages } from "../i18n/locale";

interface Props {
  showTotals: boolean;
}

type Tab = "rules" | "transactions";

const errorText = (err: unknown, fallback: string) =>
  (err instanceof ApiError ? (err.body as { errors?: string[] } | undefined)?.errors?.join(", ") : undefined) || fallback;

/**
 * The one place to review everything the app suggests: rule changes (which make future imports
 * more automatic) and subcategories for transactions the rules couldn't place.
 */
export default function Suggestions({ showTotals }: Props) {
  const { summary, refresh } = useSuggestionsSummary();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestion[] | null>(null);
  const [ruleSuggestions, setRuleSuggestions] = useState<RuleSuggestion[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [progress, setProgress] = useState<CategorizationProgressMonth[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ variant: "success" | "danger"; text: string } | null>(null);
  const [starting, setStarting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { t } = useI18n();
  const sg = t.suggestions;
  // Open while creating a subcategory; `select` (when set) puts the new one in the picker that asked.
  const [creating, setCreating] = useState<{ select?: (subcategoryId: number) => void } | null>(null);

  const load = useCallback(async () => {
    try {
      const [cats, rules, progressMonths] = await Promise.all([
        suggestionsApi.categories(),
        suggestionsApi.rules(),
        reportsApi.categorizationProgress(6),
      ]);
      setCategorySuggestions(cats);
      setRuleSuggestions(rules);
      setProgress(progressMonths);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(messages().suggestions.loadError);
    }
  }, []);

  const loadCategories = useCallback(() => categoriesApi.list().then(setCategories).catch((err) => console.error(err)), []);

  useEffect(() => {
    load();
    loadCategories();
  }, [load, loadCategories]);

  const requestNewSubcategory = (select: (subcategoryId: number) => void) => setCreating({ select });

  // Reload when a background run finishes.
  const active = isRunActive(summary);
  const [wasActive, setWasActive] = useState(active);
  useEffect(() => {
    if (wasActive && !active) load();
    setWasActive(active);
  }, [active, wasActive, load]);

  const act = async (action: () => Promise<unknown>, success: (result: unknown) => string) => {
    setNotice(null);
    try {
      const result = await action();
      setNotice({ variant: "success", text: success(result) });
    } catch (err) {
      setNotice({ variant: "danger", text: errorText(err, sg.actionError) });
    }
    await Promise.all([load(), refresh()]);
  };

  const suggestAgain = async () => {
    setStarting(true);
    await act(() => suggestionsApi.startRun(), () => sg.startedRun);
    setStarting(false);
  };

  const tab: Tab =
    (searchParams.get("tab") as Tab | null) ?? (ruleSuggestions && ruleSuggestions.length > 0 ? "rules" : "transactions");
  const setTab = (next: Tab) => setSearchParams({ tab: next });

  if (error) return <ErrorMessage message={error} />;
  if (!categorySuggestions || !ruleSuggestions) return <Loading message={sg.loading} />;

  return (
    <Container className="mt-4 text-start">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">{sg.title}</h2>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setCreating({})}>
            <CreateNewFolderOutlined fontSize="small" className="me-1" aria-hidden />
            {sg.newCategory}
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowGuide(true)}>
            <MenuBookOutlined fontSize="small" className="me-1" aria-hidden />
            {sg.howItWorks}
          </Button>
        </div>
      </div>

      {progress.some((m) => m.total > 0) && (
        <section aria-label={sg.progress}>
          <SectionTitle
            icon={<InsightsOutlined fontSize="small" />}
            title={sg.progress}
            help={sg.progressHelp}
          />
          <CategorizationProgressChart months={progress} />
        </section>
      )}
      <section aria-label={sg.lastRun}>
        <SectionTitle
          icon={<SyncOutlined fontSize="small" />}
          title={sg.lastRun}
          help={sg.lastRunHelp}
        />
        <RunStatus summary={summary} starting={starting} onSuggestAgain={suggestAgain} />
      </section>

      {notice && (
        <Alert variant={notice.variant} dismissible onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <Nav variant="tabs" activeKey={tab} className="mb-3" onSelect={(key) => key && setTab(key as Tab)}>
        <Nav.Item>
          <Nav.Link eventKey="rules">
            <RuleOutlined fontSize="small" className="me-1" aria-hidden />
            {sg.rulesTab(ruleSuggestions.length)}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="transactions">
            <ReceiptLongOutlined fontSize="small" className="me-1" aria-hidden />
            {sg.transactionsTab(categorySuggestions.length)}
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {tab === "rules" ? (
        ruleSuggestions.length === 0 ? (
          <p className="text-muted my-4 text-center">{sg.noRules}</p>
        ) : (
          <div className="d-grid gap-3">
            <p className="text-muted small mb-0">{sg.rulesIntro}</p>
            {ruleSuggestions.map((suggestion) => (
              <RuleSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                categories={categories}
                showTotals={showTotals}
                onNewSubcategory={requestNewSubcategory}
                onAccept={(params: Parameters<typeof suggestionsApi.acceptRule>[1]) =>
                  act(
                    () => suggestionsApi.acceptRule(suggestion.id, params),
                    (result) => sg.ruleSaved((result as { updated_count: number }).updated_count)
                  )
                }
                onReject={() => act(() => suggestionsApi.rejectRule(suggestion.id), () => sg.ruleRejected)}
              />
            ))}
          </div>
        )
      ) : (
        <CategorySuggestionGroups
          suggestions={categorySuggestions}
          categories={categories}
          showTotals={showTotals}
          onNewSubcategory={requestNewSubcategory}
          acceptAll={(minConfidence) =>
            act(
              () => suggestionsApi.bulkAccept({ min_confidence: minConfidence }),
              (result) => sg.accepted((result as { accepted_count: number }).accepted_count)
            )
          }
          acceptMerchant={(merchantKey) =>
            act(
              () => suggestionsApi.bulkAccept({ merchant_key: merchantKey }),
              (result) => sg.categorized((result as { accepted_count: number }).accepted_count)
            )
          }
          acceptAs={(group, subcategoryId) =>
            act(
              () => Promise.all(group.map((s) => suggestionsApi.acceptCategory(s.id, subcategoryId))),
              () => sg.moved(group.length)
            )
          }
          dontKnow={(group) =>
            act(
              () => Promise.all(group.map((s) => suggestionsApi.dontKnow(s.id))),
              () => sg.markedUnknown(group.length)
            )
          }
          reject={(group) =>
            act(
              () => Promise.all(group.map((s) => suggestionsApi.rejectCategory(s.id))),
              () => sg.rejected
            )
          }
        />
      )}
      <SuggestionsGuideModal show={showGuide} onHide={() => setShowGuide(false)} />
      <NewSubcategoryModal
        show={creating !== null}
        categories={categories}
        onHide={() => setCreating(null)}
        onCreated={async (subcategory) => {
          await loadCategories();
          creating?.select?.(subcategory.id);
          setCreating(null);
          setNotice({ variant: "success", text: sg.subcategoryCreated(subcategory.name) });
        }}
      />
    </Container>
  );
}
