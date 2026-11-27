import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { GuideStep } from "../../utils/suggestionsGuide";

interface Props {
  steps: GuideStep[];
  /** the example UI; elements carry data-guide="<step target>" */
  children: ReactNode;
}

const MARKER = "#c2185b";

function Marker({ n }: { n: number }) {
  return (
    <span
      className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold flex-shrink-0"
      style={{ width: 22, height: 22, background: MARKER, color: "#fff", fontSize: 12 }}
    >
      {n}
    </span>
  );
}

/**
 * An annotated "screenshot": the real components rendered with example data, a numbered arrow
 * pointing at each part, and the explanations alongside. Positions are measured from the live
 * layout, so the arrows follow the UI as it changes.
 */
export default function GuideFrame({ steps, children }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  // Positions are kept with the steps they were measured for, so switching views never pairs
  // old markers with new steps.
  const [measured, setMeasured] = useState<{ steps: GuideStep[]; positions: ({ top: number; left: number } | null)[] }>({
    steps: [],
    positions: [],
  });
  const positions = measured.steps === steps ? measured.positions : [];

  useLayoutEffect(() => {
    const measure = () => {
      const root = frame.current;
      if (!root) return;
      const box = root.getBoundingClientRect();
      setMeasured({
        steps,
        positions: steps.map((step) => {
          const target = root.querySelector(`[data-guide="${step.target}"]`);
          if (!target) return null;
          const rect = target.getBoundingClientRect();
          return { top: rect.top - box.top + Math.min(rect.height / 2, 14), left: rect.left - box.left };
        }),
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined" || !frame.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [steps]);

  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <div className="border rounded bg-white position-relative" style={{ padding: "12px 12px 12px 44px" }}>
          <div ref={frame} className="position-relative">
            {/* Example only: not interactive and hidden from screen readers (the list explains it). */}
            <div inert aria-hidden style={{ pointerEvents: "none" }}>
              {children}
            </div>
            {positions.map((pos, i) =>
              pos ? (
                <span
                  key={steps[i].target}
                  className="position-absolute d-flex align-items-center"
                  style={{ top: pos.top - 11, left: pos.left - 40 }}
                  data-testid="guide-marker"
                >
                  <Marker n={i + 1} />
                  <span style={{ width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: `10px solid ${MARKER}` }} />
                </span>
              ) : null
            )}
          </div>
        </div>
      </div>
      <div className="col-lg-5">
        <ol className="list-unstyled d-grid gap-2 mb-0">
          {steps.map((step, i) => (
            <li key={step.target} className="d-flex gap-2">
              <Marker n={i + 1} />
              <div>
                <div className="fw-semibold">{step.title}</div>
                <div className="small text-muted">{step.text}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
