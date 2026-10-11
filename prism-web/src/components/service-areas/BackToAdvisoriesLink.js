import BackButton from '@/components/ui/BackButton'

export default function BackToAdvisoriesLink({ withMarginBottom = false }) {
  return (
    <BackButton
      href="/supervisor/advisories"
      label="Back to Advisories"
      withMarginBottom={withMarginBottom}
    />
  )
}