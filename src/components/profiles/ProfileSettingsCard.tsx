import { FormEvent, useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { ApiError, profilesApi, type ProfileUpdate } from "../../api";
import { useI18n } from "../../i18n/context";
import { useProfile } from "../../profile/context";
import { apiErrorText } from "../../utils/profiles";

type Notice = { variant: "success" | "danger"; text: string };

/** The signed-in profile's name and password. Changing or removing a password asks for the current one. */
export default function ProfileSettingsCard() {
  const { t } = useI18n();
  const s = t.settings.profile;
  const { profile, setProfile } = useProfile();
  const [name, setName] = useState(profile?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  if (!profile) return null;
  const protectedProfile = profile.password_protected;

  const save = async (changes: ProfileUpdate, success: string) => {
    setBusy(true);
    setNotice(null);
    try {
      setProfile(await profilesApi.update(changes));
      setCurrentPassword("");
      setNewPassword("");
      setNotice({ variant: "success", text: success });
    } catch (err) {
      setNotice({ variant: "danger", text: err instanceof ApiError ? apiErrorText(err.body, s.saveError) : s.saveError });
    } finally {
      setBusy(false);
    }
  };

  const saveName = (e: FormEvent) => {
    e.preventDefault();
    save({ name: name.trim() }, s.nameSaved);
  };

  const savePassword = (e: FormEvent) => {
    e.preventDefault();
    save({ password: newPassword, ...(protectedProfile ? { current_password: currentPassword } : {}) }, s.passwordSaved);
  };

  return (
    <Card className="mb-3">
      <Card.Body className="d-grid gap-3">
        <div>
          <Card.Title className="mb-1">{s.title}</Card.Title>
          <Card.Text className="text-muted mb-0">{s.description}</Card.Text>
        </div>
        {notice && (
          <Alert variant={notice.variant} className="mb-0" dismissible onClose={() => setNotice(null)}>
            {notice.text}
          </Alert>
        )}

        <Form onSubmit={saveName} className="d-flex flex-wrap gap-2 align-items-end">
          <Form.Group controlId="profile-name" style={{ minWidth: 220, flex: "1 1 220px", maxWidth: 360 }}>
            <Form.Label>{s.name}</Form.Label>
            <Form.Control value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required disabled={busy} />
          </Form.Group>
          <Button type="submit" variant="outline-dark" disabled={busy || !name.trim() || name.trim() === profile.name}>
            {s.saveName}
          </Button>
        </Form>

        <Form onSubmit={savePassword} className="d-grid gap-2">
          <div>
            <strong>{s.passwordTitle}</strong>
            <div className="text-muted small">{protectedProfile ? s.hasPassword : s.noPassword}</div>
          </div>
          {protectedProfile && (
            <Form.Group controlId="profile-current-password" style={{ maxWidth: 360 }}>
              <Form.Label>{s.currentPassword}</Form.Label>
              <Form.Control
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={busy}
              />
            </Form.Group>
          )}
          <Form.Group controlId="profile-new-password" style={{ maxWidth: 360 }}>
            <Form.Label>{s.newPassword}</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={busy}
            />
          </Form.Group>
          <div className="d-flex flex-wrap gap-2">
            <Button type="submit" variant="dark" disabled={busy || !newPassword || (protectedProfile && !currentPassword)}>
              {protectedProfile ? s.changePassword : s.setPassword}
            </Button>
            {protectedProfile && (
              <Button
                variant="outline-danger"
                disabled={busy || !currentPassword}
                onClick={() => save({ remove_password: true, current_password: currentPassword }, s.passwordRemoved)}
              >
                {s.removePassword}
              </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
