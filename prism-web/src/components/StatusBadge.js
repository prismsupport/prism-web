import StatusPill from "@/components/ui/StatusPill";

export default function StatusBadge({ status }) {
  return <StatusPill kind="coop" status={status} />;
}