"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

function SettingRow({ title, description, action }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ManageButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
    >
      Manage
    </button>
  );
}

export default function DispatchSettingsModal({
  cooperativeId,
  threshold,
  target,
  isOwner,
  onClose,
  onSaved,
  onOpenOfficeHours,
  onOpenPriorityLevels,
  onOpenStatusNames,
}) {
  const [thresholdInput, setThresholdInput] = useState(String(threshold ?? 30));
  const [targetInput, setTargetInput] = useState(target != null ? String(target) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const newThreshold = parseInt(thresholdInput, 10);
  const newTarget = targetInput.trim() === "" ? null : parseInt(targetInput, 10);
  const unchanged = newThreshold === threshold && newTarget === (target ?? null);

  async function handleSave() {
    if (isNaN(newThreshold) || newThreshold <= 0) {
      setError("Response time threshold must be a positive number of minutes.");
      return;
    }
    if (newTarget !== null && (isNaN(newTarget) || newTarget <= 0)) {
      setError("Resolution target must be a positive number of minutes, or left blank.");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("cooperative_settings")
      .update({
        response_time_threshold_minutes: newThreshold,
        resolution_target_minutes: newTarget,
      })
      .eq("cooperative_id", cooperativeId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      toast.error(updateError.message);
      return;
    }

    toast.success("Dispatch settings updated");
    onSaved(newThreshold, newTarget);
    onClose();
  }

  const inputClass =
    "w-24 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dispatch Settings</h2>
            <p className="text-sm text-gray-500">
              Targets and workflow options for your cooperative.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <p className="mb-1 text-xs font-bold tracking-wide text-gray-400 uppercase">
          Targets
        </p>
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-4">
          <SettingRow
            title="Response Time Threshold"
            description="Pending tickets unassigned past this limit are flagged and notify supervisors once."
            action={
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  className={inputClass}
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
            }
          />
          <SettingRow
            title="Resolution Target"
            description="Time from report to final approval. Used by the dashboard. Leave blank for no target."
            action={
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="Not set"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className={inputClass}
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
            }
          />
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || unchanged}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save targets"}
          </button>
        </div>

        <p className="mb-1 mt-5 text-xs font-bold tracking-wide text-gray-400 uppercase">
          Workflow
        </p>
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-4">
          {isOwner && (
            <SettingRow
              title="Office Hours"
              description="When new outage reports are accepted (Owner only)."
              action={<ManageButton onClick={onOpenOfficeHours} />}
            />
          )}
          <SettingRow
            title="Priority Levels"
            description="The priority levels your cooperative uses."
            action={<ManageButton onClick={onOpenPriorityLevels} />}
          />
          <SettingRow
            title="Status Names"
            description="Rename ticket statuses and job steps."
            action={<ManageButton onClick={onOpenStatusNames} />}
          />
        </div>
      </div>
    </div>
  );
}