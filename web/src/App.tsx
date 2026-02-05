import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { HowItWorks } from './pages/HowItWorks'
import { Identity } from './pages/Identity'
import { Payments } from './pages/Payments'
import { Bounties } from './pages/Bounties'
import { BountyDetail } from './pages/BountyDetail'
import { Agents } from './pages/Agents'
import { AgentProfile } from './pages/AgentProfile'
import { SkillLanding } from './pages/SkillLanding'
import { Admin } from './pages/Admin'
import { Content } from './pages/Content'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/identity" element={<Identity />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/bounties" element={<Bounties />} />
          <Route path="/bounty/:id" element={<BountyDetail />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/skill/:skill" element={<SkillLanding />} />
          <Route path="/skills/:skill" element={<SkillLanding />} />
          <Route path="/agent/:id" element={<AgentProfile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/docs/:slug" element={<Content />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
