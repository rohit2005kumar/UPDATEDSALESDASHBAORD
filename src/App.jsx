import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SalesDashboard from './pages/SalesDashboard'
import SalesPayPreview from './pages/SalesPayPreview'
import SalesWorkspacePage from './pages/SalesWorkspacePage'
import { SalesDataProvider } from './context/SalesDataContext'
import Login from './pages/Login'
import ProtectedRoutes from './pages/ProtectedRoutes'
import { AuthProvider } from './context/AuthContext'
import SalesRecordDetail from './pages/SalesRecordDetail'

export default function App() {
  return <AuthProvider>
    <SalesDataProvider>
      <BrowserRouter>
      <Routes>
    <Route path='/' element={<Login/>}/>
    <Route element={<ProtectedRoutes/>}>
      <Route path="/sales-dashboard" element={<SalesDashboard />} />
      <Route path="/sales-dashboard/create-order" element={<SalesDashboard />} />
      <Route path="/sales-dashboard/customers/:customerId" element={<SalesRecordDetail type="customer" />} />
      <Route path="/sales-dashboard/orders/:orderId" element={<SalesRecordDetail type="order" />} />
      <Route path="/sales-dashboard/:section" element={<SalesWorkspacePage />} />
    </Route>
    <Route path="/pay/:token" element={<SalesPayPreview/>} />
    <Route path="/sales/pay/:token" element={<SalesPayPreview />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  </BrowserRouter>
  </SalesDataProvider>
  </AuthProvider>
}
