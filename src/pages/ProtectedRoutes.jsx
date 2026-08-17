import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoutes(){
  const {isAuthenticated}=useAuth(),location=useLocation()
  return isAuthenticated?<Outlet/>:<Navigate to="/" replace state={{from:location}}/>
  
}
