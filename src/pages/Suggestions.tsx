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
import type { CategorizationProgressMonth, Category, CategorySuggestion, Reapply, RuleSuggestion } from "../types";

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
      setError("Could not load suggestions.");
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
      setNotice({ variant: "danger", text: errorText(err, "That didn't work. Try again.") });
    }
    await Promise.all([load(), refresh()]);
  };

  const suggestAgain = async () => {
    setStarting(true);
    await act(() => suggestionsApi.startRun(), () => "Generating suggestions for everything uncategorized…");
    setStarting(false);
  };

  const tab: Tab =
    (searchParams.get("tab") as Tab | null) ?? (ruleSuggestions && ruleSuggestions.length > 0 ? "rules" : "transactions");
  const setTab = (next: Tab) => setSearchParams({ tab: next });

  if (error) return <ErrorMessage message={error} />;
  if (!categorySuggestions || !ruleSuggestions) return <Loading message="Loading suggestions..." />;

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  return (
    <Container className="mt-4 text-start">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Suggestions</h2>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setCreating({})}>
            <CreateNewFolderOutlined fontSize="small" className="me-1" aria-hidden />
            New category / subcategory
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowGuide(true)}>
            <MenuBookOutlined fontSize="small" className="me-1" aria-hidden />
            How this page works
          </Button>
        </div>
      </div>

      {progress.some((m) => m.total > 0) && (
        <section aria-label="Progress">
          <SectionTitle
            icon={<InsightsOutlined fontSize="small" />}
            title="Progress"
            help="How each month's transactions got their category. As you accept rules, the blue part grows and there's less to review."
          />
          <CategorizationProgressChart months={progress} />
        </section>
      )}
      <section aria-label="Last run">
        <SectionTitle
          icon={<SyncOutlined fontSize="small" />}
          title="Last run"
          help="Suggestions are generated after each import. Your own history is used first; Claude only sees what history couldn't place."
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
            Rules ({ruleSuggestions.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="transactions">
            <ReceiptLongOutlined fontSize="small" className="me-1" aria-hidden />
            Transactions ({categorySuggestions.length})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {tab === "rules" ? (
        ruleSuggestions.length === 0 ? (
          <p className="text-muted my-4 text-center">No rule suggestions right now.</p>
        ) : (
          <div className="d-grid gap-3">
            <p className="text-muted small mb-0">
              Accepted rules become regular keyword rules, so future imports categorize these transactions on their own.
            </p>
            {ruleSuggestions.map((suggestion) => (
              <RuleSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                categories={categories}
                showTotals={showTotals}
                onNewSubcategory={requestNewSubcategory}
                onAccept={(params: { name?: string; subcategory_id?: number; reapply: Reapply }) =>
                  act(
                    () => suggestionsApi.acceptRule(suggestion.id, params),
                    (result) => {
                      const moved = (result as { updated_count: number }).updated_count;
                      return `Rule saved.${moved > 0 ? ` ${plural(moved, "transaction")} moved.` : ""}`;
                    }
                  )
                }
                onReject={() => act(() => suggestionsApi.rejectRule(suggestion.id), () => "Rejected. It won't be suggested again unless your data changes a lot.")}
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
              (result) => `${plural((result as { accepted_count: number }).accepted_count, "suggestion")} accepted.`
            )
          }
          acceptMerchant={(merchantKey) =>
            act(
              () => suggestionsApi.bulkAccept({ merchant_key: merchantKey }),
              (result) => `${plural((result as { accepted_count: number }).accepted_count, "transaction")} categorized.`
            )
          }
          acceptAs={(group, subcategoryId) =>
            act(
              () => Promise.all(group.map((s) => suggestionsApi.acceptCategory(s.id, subcategoryId))),
              () => `${plural(group.length, "transaction")} moved.`
            )
          }
          dontKnow={(group) =>
            act(
              () => Promise.all(group.map((s) => suggestionsApi.dontKnow(s.id))),
              () => `Marked ${plural(group.length, "transaction")} as "can't remember". They stay in Outros.`
            )
          }
          reject={(group) =>
            act(
              () => Promise.all(group.map((s) => suggestionsApi.rejectCategory(s.id))),
              () => "Rejected. That subcategory won't be suggested for this merchant again."
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
          setNotice({ variant: "success", text: `Subcategory "${subcategory.name}" created.` });
        }}
      />
    </Container>
  );
}
