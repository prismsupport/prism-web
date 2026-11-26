import DispatchSettingsModal from '@/components/dispatch/DispatchSettingsModal'
import StatusNamesModal from '@/components/dispatch/StatusNamesModal'
import ManagePriorityLevelsModal from '@/components/dispatch/ManagePriorityLevelsModal'
import OfficeHoursModal from '@/components/dispatch/OfficeHoursModal'

// The Dispatch settings dialog and the three dialogs it opens. Only one is open at a time.
// active: null | 'settings' | 'statusNames' | 'priorityLevels' | 'officeHours'
export default function DispatchModals({
  active,
  onActiveChange,
  cooperativeId,
  threshold,
  target,
  isOwner,
  onSettingsSaved,
  onPriorityLevelsSaved,
}) {
  const close = () => onActiveChange(null)

  return (
    <>
      {active === 'settings' && (
        <DispatchSettingsModal
          cooperativeId={cooperativeId}
          threshold={threshold}
          target={target}
          isOwner={isOwner}
          onClose={close}
          onSaved={onSettingsSaved}
          onOpenOfficeHours={() => onActiveChange('officeHours')}
          onOpenPriorityLevels={() => onActiveChange('priorityLevels')}
          onOpenStatusNames={() => onActiveChange('statusNames')}
        />
      )}
      {active === 'statusNames' && <StatusNamesModal onClose={close} />}
      {active === 'officeHours' && <OfficeHoursModal onClose={close} />}
      {active === 'priorityLevels' && (
        <ManagePriorityLevelsModal onClose={close} onSaved={onPriorityLevelsSaved} />
      )}
    </>
  )
}