import Card from '@/components/ui/Card'
import RateDelta from '@/components/billing/RateDelta'
import { INPUT, toNum } from '@/lib/billing/powerRates'

// One consumer-class card. formClass = form[cls.key], total = totals[cls.key],
// previousRate = previous[cls.key]. The page owns all state.
export default function RateClassCard({
  cls,
  formClass,
  total,
  previousRate,
  setTotal,
  setComponent,
  addComponent,
  removeComponent,
}) {
  const hasComponents = formClass.components.some(
    (x) => x.label.trim() && toNum(x.amount) != null
  )

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">
          {cls.label}
        </h3>

        <p className="text-xs text-gray-400">
          {cls.hint}
        </p>
      </div>

      {/* Optional Breakdown */}
      <div className="mb-4 space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Breakdown{' '}
            <span className="font-normal normal-case text-gray-400">
              (optional)
            </span>
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Add individual charges to calculate the total rate.
          </p>
        </div>

        {formClass.components.map((x, i) => (
          <div
            key={i}
            className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-2"
          >
            <input
              value={x.label}
              maxLength={60}
              onChange={(e) =>
                setComponent(cls.key, i, {
                  label: e.target.value,
                })
              }
              placeholder="Charge name (e.g. Generation)"
              className={INPUT}
            />

            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.0001"
                min="0"
                value={x.amount}
                onChange={(e) =>
                  setComponent(cls.key, i, {
                    amount: e.target.value,
                  })
                }
                placeholder="0.0000"
                className={`${INPUT} min-w-0 flex-1`}
              />

              <button
                type="button"
                onClick={() => removeComponent(cls.key, i)}
                className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addComponent(cls.key)}
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          + Add charge
        </button>
      </div>

      {/* Total Rate */}
      <div className="border-t border-gray-100 pt-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
            Total {hasComponents ? '(sum of breakdown)' : 'per kWh'}
          </span>

          <input
            type="number"
            step="0.0001"
            min="0"
            disabled={hasComponents}
            value={
              hasComponents
                ? total ?? ''
                : formClass.total
            }
            onChange={(e) => setTotal(cls.key, e.target.value)}
            placeholder="0.0000"
            className={`${INPUT} disabled:opacity-70`}
          />
        </label>

        <div className="mt-3">
          <RateDelta
            current={total}
            previous={
              previousRate
                ? Number(previousRate.total_rate)
                : null
            }
          />
        </div>
      </div>
    </Card>
  )
}