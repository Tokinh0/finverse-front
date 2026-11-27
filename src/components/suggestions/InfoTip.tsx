import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { useId, type ReactNode } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

interface Props {
  /** what the tooltip explains, read by screen readers as the button's name */
  label: string;
  children: ReactNode;
}

/** A small (?) that explains the thing next to it, on hover or keyboard focus. */
export default function InfoTip({ label, children }: Props) {
  const id = useId();
  return (
    <OverlayTrigger placement="top" trigger={["hover", "focus"]} overlay={<Tooltip id={id}>{children}</Tooltip>}>
      <button type="button" className="btn btn-link p-0 border-0 align-baseline text-secondary lh-1" aria-label={`About ${label}`}>
        <HelpOutlineOutlined sx={{ fontSize: 16 }} aria-hidden />
      </button>
    </OverlayTrigger>
  );
}
