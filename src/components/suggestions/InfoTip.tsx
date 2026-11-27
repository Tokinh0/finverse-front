import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { useId, type ReactNode } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useI18n } from "../../i18n/context";

interface Props {
  /** what the tooltip explains, read by screen readers as the button's name */
  label: string;
  children: ReactNode;
}

/** A small (?) that explains the thing next to it, on hover or keyboard focus. */
export default function InfoTip({ label, children }: Props) {
  const id = useId();
  const { t } = useI18n();
  return (
    <OverlayTrigger placement="top" trigger={["hover", "focus"]} overlay={<Tooltip id={id}>{children}</Tooltip>}>
      <button type="button" className="btn btn-link p-0 border-0 align-baseline text-secondary lh-1" aria-label={t.common.about(label)}>
        <HelpOutlineOutlined sx={{ fontSize: 16 }} aria-hidden />
      </button>
    </OverlayTrigger>
  );
}
