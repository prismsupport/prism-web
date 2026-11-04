import ArchiveIcon from "@/components/ui/icons/ArchiveIcon";
import PencilIcon from "@/components/ui/icons/PencilIcon";
import TrashIcon from "@/components/ui/icons/TrashIcon";

export default function RowActions({
  onEdit,
  onDelete,
  archive = false,
  className = "",
}) {
  const actionClassName =
    "inline-flex items-center justify-center rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={onEdit}
        className={`${actionClassName} text-blue-600 hover:bg-blue-50 hover:text-blue-800`}
        title="Edit"
        aria-label="Edit"
      >
        <PencilIcon />
      </button>
      {archive
        ? <button
            type="button"
            onClick={onDelete}
            className={`${actionClassName} text-amber-600 hover:bg-amber-50 hover:text-amber-800`}
            title="Archive"
            aria-label="Archive"
          >
            <ArchiveIcon />
          </button>
        : <button
            type="button"
            onClick={onDelete}
            className={`${actionClassName} text-red-500 hover:bg-red-50 hover:text-red-700`}
            title="Delete"
            aria-label="Delete"
          >
            <TrashIcon />
          </button>}
    </div>
  );
}
