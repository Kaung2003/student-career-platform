import { useEffect, useState } from "react";
import { useUi } from "../../context/UiContext";
import { api, ApiError } from "../../lib/api";
import type { AdminFeedback as Feedback, FeedbackStatus, FeedbackType } from "../../lib/types";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { CheckIcon, InboxIcon, TrashIcon } from "../../components/icons";
import { FEEDBACK_STATUS, FEEDBACK_TYPE } from "./adminLabels";

const STATUSES = Object.keys(FEEDBACK_STATUS) as FeedbackStatus[];
const TYPES = Object.keys(FEEDBACK_TYPE) as FeedbackType[];

export function AdminFeedback() {
  const { toast, confirm } = useUi();
  const [items, setItems] = useState<Feedback[]>([]);
  const [counts, setCounts] = useState<Partial<Record<FeedbackStatus, number>>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<FeedbackStatus | "">("NEW");
  const [type, setType] = useState<FeedbackType | "">("");

  function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    return api
      .get<{ feedback: Feedback[]; counts: Partial<Record<FeedbackStatus, number>> }>(`/admin/feedback?${params.toString()}`)
      .then((res) => {
        setItems(res.feedback);
        setCounts(res.counts);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type]);

  async function setItemStatus(item: Feedback, next: FeedbackStatus) {
    try {
      await api.patch(`/admin/feedback/${item.id}`, { status: next });
      toast(`Marked as ${FEEDBACK_STATUS[next].label.toLowerCase()}`);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "error");
    }
  }

  async function remove(item: Feedback) {
    const ok = await confirm({ title: "Delete this feedback?", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await api.delete(`/admin/feedback/${item.id}`);
      toast("Feedback deleted");
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", "error");
    }
  }

  const total = STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  return (
    <div>
      <PageHeader title="Feedback inbox" description="Bug reports, feature ideas, and comments from your users." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {(["", ...STATUSES] as const).map((s) => (
            <button
              key={s || "ALL"}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                status === s
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {s ? FEEDBACK_STATUS[s].label : "All"}{" "}
              <span className="tabular-nums text-slate-400">{s ? (counts[s] ?? 0) : total}</span>
            </button>
          ))}
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FeedbackType | "")}
          aria-label="Filter by type"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {FEEDBACK_TYPE[t].label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<InboxIcon className="h-6 w-6" />}
          title={status === "NEW" ? "Inbox zero 🎉" : "Nothing here"}
          description={status === "NEW" ? "No new feedback right now." : "No feedback matches these filters."}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={FEEDBACK_TYPE[item.type].tone}>{FEEDBACK_TYPE[item.type].label}</Badge>
                <Badge tone={FEEDBACK_STATUS[item.status].tone}>{FEEDBACK_STATUS[item.status].label}</Badge>
                <span className="ml-auto text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-800 dark:text-slate-200">{item.message}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Avatar name={item.userName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.userName}</p>
                    {item.userEmail && (
                      <a href={`mailto:${item.userEmail}`} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                        {item.userEmail}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status === "NEW" && (
                    <Button size="sm" variant="secondary" onClick={() => void setItemStatus(item, "IN_PROGRESS")}>
                      Start working
                    </Button>
                  )}
                  {item.status !== "RESOLVED" ? (
                    <Button size="sm" onClick={() => void setItemStatus(item, "RESOLVED")}>
                      <CheckIcon className="h-3.5 w-3.5" /> Resolve
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => void setItemStatus(item, "NEW")}>
                      Reopen
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => void remove(item)} aria-label="Delete feedback">
                    <TrashIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
