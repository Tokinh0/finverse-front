import type { ReactNode } from "react";
import InfoTip from "./InfoTip";

interface Props {
  icon: ReactNode;
  title: string;
  help?: ReactNode;
  /** marks the element for the page guide */
  guide?: string;
}

/** A section heading with an identifying icon and an optional explanation. */
export default function SectionTitle({ icon, title, help, guide }: Props) {
  return (
    <h3 className="h6 d-flex align-items-center gap-2 mb-2" data-guide={guide}>
      <span className="text-secondary d-inline-flex" aria-hidden>
        {icon}
      </span>
      {title}
      {help && <InfoTip label={title}>{help}</InfoTip>}
    </h3>
  );
}
