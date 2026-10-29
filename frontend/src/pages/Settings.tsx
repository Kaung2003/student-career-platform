import { useState, type ReactNode, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { useI18n } from "../i18n/I18nContext";
import { api, ApiError } from "../lib/api";
import type { User } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { FileTextIcon, TrashIcon } from "../components/icons";

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <div className="md:col-span-2">{children}</div>
      </div>
    </Card>
  );
}

export function Settings() {
  const { user, updateUser } = useAuth();
  const { toast } = useUi();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function saveName(e: SubmitEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      const res = await api.patch<{ user: User }>("/account", { name: name.trim() });
      updateUser(res.user);
      toast(t("settings.saved"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("common.somethingWrong"), "error");
    } finally {
      setSavingName(false);
    }
  }

  const hasPassword = user?.hasPassword ?? true;

  async function changePassword(e: SubmitEvent) {
    e.preventDefault();
    setPasswordError(null);
    setSavingPassword(true);
    try {
      await api.post("/account/password", hasPassword ? { currentPassword, newPassword } : { newPassword });
      setCurrentPassword("");
      setNewPassword("");
      if (user && !hasPassword) updateUser({ ...user, hasPassword: true });
      toast(t("settings.passwordChanged"));
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : t("common.somethingWrong"));
    } finally {
      setSavingPassword(false);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const data = await api.get<unknown>("/account/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `career-platform-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("common.somethingWrong"), "error");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount(e: SubmitEvent) {
    e.preventDefault();
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.delete("/account", hasPassword ? { password: deletePassword } : { confirmEmail: deletePassword });
      updateUserAfterDelete();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : t("common.somethingWrong"));
      setDeleting(false);
    }
  }

  function updateUserAfterDelete() {
    toast(t("settings.deleted"), "info");
    // A full reload clears every cached piece of the old account.
    navigate("/");
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />

      <Section title={t("settings.accountTitle")} description={t("settings.accountDescription")}>
        <form onSubmit={saveName} className="space-y-4">
          <Field label={t("settings.name")}>
            <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("settings.email")} hint={t("settings.emailHint")}>
            <input value={user?.email ?? ""} disabled className={`${inputClass} cursor-not-allowed opacity-70`} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={savingName || !name.trim() || name.trim() === user?.name}>
              {savingName ? t("common.saving") : t("common.saveChanges")}
            </Button>
          </div>
        </form>
      </Section>

      <Section
        title={hasPassword ? t("settings.passwordTitle") : t("settings.setPasswordTitle")}
        description={hasPassword ? t("settings.passwordDescription") : t("settings.setPasswordDescription")}
      >
        <form onSubmit={changePassword} className="space-y-4">
          {hasPassword && (
            <Field label={t("settings.currentPassword")}>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          <Field label={t("auth.newPassword")} hint={t("auth.passwordPlaceholder")}>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          {passwordError && <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? t("common.saving") : hasPassword ? t("settings.changePassword") : t("settings.setPassword")}
            </Button>
          </div>
        </form>
      </Section>

      <Section title={t("settings.dataTitle")} description={t("settings.dataDescription")}>
        <Button variant="secondary" onClick={exportData} disabled={exporting}>
          <FileTextIcon className="h-4 w-4" /> {exporting ? t("settings.exporting") : t("settings.export")}
        </Button>
      </Section>

      <Card className="border-red-200 dark:border-red-500/30">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h2 className="font-semibold text-red-700 dark:text-red-400">{t("settings.dangerTitle")}</h2>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">{t("settings.dangerDescription")}</p>
            <Button variant="danger" className="mt-4" onClick={() => setDeleteOpen(true)}>
              <TrashIcon className="h-4 w-4" /> {t("settings.deleteAccount")}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("settings.deleteConfirmTitle")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="delete-account-form" variant="danger" disabled={deleting || !deletePassword}>
              {deleting ? t("common.saving") : t("settings.deleteAccount")}
            </Button>
          </>
        }
      >
        <form id="delete-account-form" onSubmit={deleteAccount} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {hasPassword ? t("settings.deleteConfirmMessage") : t("settings.deleteConfirmEmail", { email: user?.email ?? "" })}
          </p>
          <Field label={hasPassword ? t("auth.password") : t("settings.email")}>
            <input
              type={hasPassword ? "password" : "email"}
              required
              autoFocus
              autoComplete={hasPassword ? "current-password" : "off"}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
        </form>
      </Modal>
    </div>
  );
}
