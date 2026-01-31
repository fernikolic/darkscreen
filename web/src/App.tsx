import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { HowItWorks } from './pages/HowItWorks'
import { Identity } from './pages/Identity'
import { Payments } from './pages/Payments'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/identity" element={<Identity />} />
          <Route path="/payments" element={<Payments />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
