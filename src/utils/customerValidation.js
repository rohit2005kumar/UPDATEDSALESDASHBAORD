const textValue = value => String(value || '').trim()

export function normalizeCustomerForm(form) {
  return {
    full_name: textValue(form.full_name).replace(/\s+/g, ' '),
    phone: textValue(form.phone).replace(/[\s()-]/g, ''),
    email: textValue(form.email).toLowerCase(),
    address_line1: textValue(form.address_line1).replace(/\s+/g, ' '),
    city: textValue(form.city).replace(/\s+/g, ' '),
    state: textValue(form.state).replace(/\s+/g, ' '),
    postal_code: textValue(form.postal_code),
  }
}

export function validateCustomerForm(form) {
  const value = normalizeCustomerForm(form)
  const errors = {}

  if (!value.full_name) errors.full_name = 'Full name is required.'
  else if (value.full_name.length < 2) errors.full_name = 'Enter at least 2 characters.'
  else if (!/^[\p{L}][\p{L}\p{M} .'’-]*$/u.test(value.full_name)) errors.full_name = 'Use letters, spaces, apostrophes, or hyphens only.'

  if (!value.phone) errors.phone = 'Phone number is required.'
  else if (!/^(?:\+91)?[6-9]\d{9}$/.test(value.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.'

  if (!value.email) errors.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value.email)) errors.email = 'Enter a valid email address.'

  if (!value.address_line1) errors.address_line1 = 'Address is required.'
  else if (value.address_line1.length < 5) errors.address_line1 = 'Enter a more complete address.'

  for (const key of ['city', 'state']) {
    const label = key === 'city' ? 'City' : 'State'
    if (!value[key]) errors[key] = `${label} is required.`
    else if (value[key].length < 2) errors[key] = `${label} must contain at least 2 characters.`
    else if (!/^[\p{L}\p{M} .'-]+$/u.test(value[key])) errors[key] = `${label} can contain letters, spaces, periods, or hyphens only.`
  }

  if (!value.postal_code) errors.postal_code = 'Pincode is required.'
  else if (!/^[1-9]\d{5}$/.test(value.postal_code)) errors.postal_code = 'Enter a valid 6-digit Indian pincode.'

  return { value, errors, isValid: Object.keys(errors).length === 0 }
}
