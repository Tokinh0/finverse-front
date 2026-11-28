import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Container, Form, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError, profilesApi } from "../api";
import { ErrorMessage, Loading } from "../components/LoadingState";
import ProfileAvatar from "../components/profiles/ProfileAvatar";
import { useI18n } from "../i18n/context";
import { messages } from "../i18n/locale";
import { useProfile } from "../profile/context";
import type { Profile } from "../types";
import { apiErrorText } from "../utils/profiles";
import "./ProfilePicker.css";

/** Where to go after entering: the page that sent the visitor here, else the dashboard. */
const useDestination = () => {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from !== "/" ? from : "/market";
};

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? apiErrorText(err.body, fallback) : fallback);

/**
 * The home page when nobody is signed in: pick a profile (with its password, if it has one) or
 * add a new one. The account will later have an email login; profiles let a few people share it.
 */
export default function ProfilePicker() {
  const { t } = useI18n();
  const p = t.profiles;
  const { signIn } = useProfile();
  const navigate = useNavigate();
  const destination = useDestination();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [locked, setLocked] = useState<Profile | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profilesApi
      .list()
      .then(setProfiles)
      .catch((err) => {
        console.error(err);
        setLoadError(messages().profiles.loadError);
      });
  }, []);

  const enter = async (profile: Profile, password?: string) => {
    await signIn(profile, password);
    navigate(destination, { replace: true });
  };

  const pick = async (profile: Profile) => {
    setError(null);
    if (profile.password_protected) {
      setLocked(profile);
      return;
    }
    try {
      await enter(profile);
    } catch (err) {
      setError(errorText(err, p.signInError));
    }
  };

  if (loadError) return <ErrorMessage message={loadError} />;
  if (!profiles) return <Loading message={p.loading} />;

  return (
    <Container className="profile-picker text-center">
      <h1>{p.title}</h1>
      <p className="text-muted">{p.subtitle}</p>
      {error && (
        <Alert variant="danger" className="text-start">
          {error}
        </Alert>
      )}

      <ul className="profile-grid list-unstyled">
        {profiles.map((profile) => (
          <li key={profile.id}>
            <button type="button" className="profile-tile w-100" onClick={() => pick(profile)} aria-label={p.enter(profile.name)}>
              <ProfileAvatar profile={profile} />
              <span className="profile-tile-name">{profile.name}</span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" className="profile-tile w-100" onClick={() => setAdding(true)}>
            <span className="profile-avatar-add" aria-hidden="true">
              +
            </span>
            <span className="profile-tile-name">{p.add}</span>
          </button>
        </li>
      </ul>

      {locked && <PasswordModal profile={locked} onEnter={enter} onClose={() => setLocked(null)} />}
      {adding && (
        <NewProfileModal
          onClose={() => setAdding(false)}
          onCreated={async (profile, password) => {
            setProfiles((list) => [...(list ?? []), profile]);
            setAdding(false);
            try {
              await enter(profile, password);
            } catch (err) {
              setError(errorText(err, p.signInError));
            }
          }}
        />
      )}
    </Container>
  );
}

function PasswordModal({
  profile,
  onEnter,
  onClose,
}: {
  profile: Profile;
  onEnter: (profile: Profile, password: string) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const p = t.profiles;
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onEnter(profile, password);
    } catch (err) {
      setError(errorText(err, p.signInError));
      setPassword("");
      setBusy(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered aria-labelledby="profile-password-title">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title id="profile-password-title">{p.passwordTitle(profile.name)}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          {error && (
            <Alert variant="danger" className="mb-0">
              {error}
            </Alert>
          )}
          <Form.Group controlId="profile-password">
            <Form.Label>{p.password}</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="dark" disabled={busy || !password}>
            {busy ? p.signingIn : p.signIn}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function NewProfileModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (profile: Profile, password?: string) => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const p = t.profiles;
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await profilesApi.create({ name: name.trim(), locale, ...(password ? { password } : {}) });
      await onCreated(created, password || undefined);
    } catch (err) {
      setError(errorText(err, p.createError));
      setBusy(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered aria-labelledby="new-profile-title">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title id="new-profile-title">{p.addTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3 text-start">
          <p className="text-muted mb-0">{p.addHelp}</p>
          {error && (
            <Alert variant="danger" className="mb-0">
              {error}
            </Alert>
          )}
          <Form.Group controlId="new-profile-name">
            <Form.Label>{p.name}</Form.Label>
            <Form.Control value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus required disabled={busy} />
          </Form.Group>
          <Form.Group controlId="new-profile-password">
            <Form.Label>{p.optionalPassword}</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
            <Form.Text>{p.passwordHelp}</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="dark" disabled={busy || !name.trim()}>
            {busy ? t.common.creating : t.common.create}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
