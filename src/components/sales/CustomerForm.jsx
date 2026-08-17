import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { validateCustomerForm } from '../../utils/customerValidation'

const fields = [
    { key: 'full_name', label: 'Full Name', placeholder: 'Priya Sharma', type: 'text', autoComplete: 'name', maxLength: 80 },
    { key: 'phone', label: 'Phone Number', placeholder: '98765 43210', type: 'tel', autoComplete: 'tel', maxLength: 16, inputMode: 'tel' },
    { key: 'email', label: 'Email Address', placeholder: 'priya@example.com', type: 'email', autoComplete: 'email', maxLength: 254 },
    { key: 'address_line1', label: 'Address Line', placeholder: '14, Green Park', type: 'text', autoComplete: 'address-line1', maxLength: 200 },
    { key: 'city', label: 'City', placeholder: 'Noida', type: 'text', autoComplete: 'address-level2', maxLength: 60 },
    { key: 'state', label: 'State', placeholder: 'U.P', type: 'text', autoComplete: 'address-level1', maxLength: 60 },
    { key: 'postal_code', label: 'Pincode', placeholder: '201301', type: 'text', autoComplete: 'postal-code', maxLength: 6, inputMode: 'numeric' },
]

export default function CustomerForm({ form, setForm, onSave, saving = false }) {
    const [errors, setErrors] = useState({})

    const updateField = (key, value) => {
        setForm({ ...form, [key]: value })
        if (errors[key]) setErrors(current => ({ ...current, [key]: '' }))
    }

    const submit = event => {
        event.preventDefault()
        const validation = validateCustomerForm(form)
        setErrors(validation.errors)
        if (validation.isValid) onSave(validation.value)
    }

    return <form onSubmit={submit} noValidate>
        <Header />
        <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(field => <label key={field.key} className="text-[10px] font-bold text-stone-600">
                {field.label}
                <input
                    required
                    type={field.type}
                    autoComplete={field.autoComplete}
                    inputMode={field.inputMode}
                    maxLength={field.maxLength}
                    value={form[field.key] || ''}
                    onChange={event => updateField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(errors[field.key])}
                    aria-describedby={errors[field.key] ? `${field.key}-error` : undefined}
                    className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-xs outline-none ${errors[field.key] ? 'border-red-400 focus:border-red-500' : 'border-line focus:border-brand'}`}
                />
                {errors[field.key] && <span id={`${field.key}-error`} role="alert" className="mt-1 block text-[9px] font-semibold text-red-600">{errors[field.key]}</span>}
            </label>)}
        </div>
        <button type="submit" disabled={saving} className="mt-4 w-full rounded-lg bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving customer…' : 'Save Customer'}</button>
    </form>
}

function Header() {
    return <div className="mb-4 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-[#edf2ef] text-brand">
            <UserPlus size={15} /></span><div><h3 className="dashboard-title text-sm">Customer details</h3>
            <p className="text-[10px] text-muted">Register the customer during the call</p></div></div>
}
