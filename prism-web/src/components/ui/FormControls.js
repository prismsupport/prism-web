export const CONTROL_CLASS =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400'

function Field({ label, optional, hint, wrapperClassName = 'mb-4', children }) {
  return (
    <div className={wrapperClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {optional && (
            <>
              {' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </>
          )}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export function FormInput({ label, optional, hint, wrapperClassName, className = '', ...props }) {
  return (
    <Field label={label} optional={optional} hint={hint} wrapperClassName={wrapperClassName}>
      <input className={`${CONTROL_CLASS} ${className}`} {...props} />
    </Field>
  )
}

export function FormSelect({ label, optional, hint, wrapperClassName, className = '', children, ...props }) {
  return (
    <Field label={label} optional={optional} hint={hint} wrapperClassName={wrapperClassName}>
      <select className={`${CONTROL_CLASS} ${className}`} {...props}>
        {children}
      </select>
    </Field>
  )
}

export function FormTextarea({ label, optional, hint, wrapperClassName, className = '', ...props }) {
  return (
    <Field label={label} optional={optional} hint={hint} wrapperClassName={wrapperClassName}>
      <textarea className={`${CONTROL_CLASS} ${className}`} {...props} />
    </Field>
  )
}
