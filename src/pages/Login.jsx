import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { IoIosEyeOff } from "react-icons/io";

import { IoIosEye } from "react-icons/io";
<IoIosEye />

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const[isVisible,setIsVisible]=useState(false)

  if (isAuthenticated) return <Navigate to="/sales-dashboard" replace />

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/sales-dashboard', { replace: true })
      localStorage.setItem("agent",JSON.stringify(form.email))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return <main className="dashboard-shell flex min-h-screen items-center justify-center px-4 py-10">
    <section className="dashboard-card w-full max-w-md p-7 sm:p-9">
      <div className="mb-7 text-center">
        <img src="/ayudravya-logo.png" alt="Ayudravya" className="mx-auto size-24 object-contain mix-blend-multiply" />
        <h1 className="dashboard-title mt-2 text-2xl text-[#705019]">Sales Team Dashboard</h1>
        <p className="mt-1 text-xs text-muted">Welcome back to your sales workspace</p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-semibold">Email address
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-line bg-[#faf9f5] px-4 focus-within:border-brand">
            <Mail size={17} className="text-muted" />
            <input required autoComplete="username" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="h-14 w-full bg-transparent outline-none" placeholder="agent@ayudravya.com" />
          </div>
        </label>
        <label className="block text-sm font-semibold">Password
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-line bg-[#faf9f5] px-4 focus-within:border-brand">
            <LockKeyhole size={17} className="text-muted" />
            <input 
            required minLength={8}
             maxLength={128}
              autoComplete="current-password" 
              type={`${isVisible ?"text":"password"}`}
              value={form.password}
               onChange={event => setForm({ ...form, password: event.target.value })} 
               className="h-14 w-full bg-transparent outline-none" 
               placeholder="Enter your password" />
              {
                isVisible ? <IoIosEye size={30} onClick={()=>{setIsVisible(!isVisible)}} /> :<IoIosEyeOff size={30} onClick={()=>{setIsVisible(!isVisible)}}  /> 
              }
          </div>
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={loading} className="h-14 w-full rounded-2xl bg-brand font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">{loading ? 'Signing in…' : 'Login to dashboard'}</button>
      </form>
      <p className="mt-5 text-center text-[10px] text-muted">Secure sign-in · session ends when this tab is closed.</p>
    </section>
  </main>
}
