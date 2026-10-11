import BackButton from '@/components/ui/BackButton'

export default function BackToDispatchLink({ withMarginBottom = false }) {
  return (
    <BackButton
      href="/supervisor/dispatch"
      label="Back to Dispatch"
      withMarginBottom={withMarginBottom}
    />
  )
}