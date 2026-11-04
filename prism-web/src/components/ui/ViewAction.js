import { Eye } from "lucide-react";
import Link from "next/link";

export default function ViewAction({ href, onClick, label = "View details" }) {
  const props = {
    "aria-label": label,
    className:
      "inline-flex items-center justify-center rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600",
    title: label,
  };

  if (href) {
    return (
      <Link href={href} {...props} onClick={onClick}>
        <Eye size={18} strokeWidth={2} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} {...props}>
      <Eye size={18} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
