import { RiskAssessment } from '../components/RiskAssessment'
import { sampleRisks } from '../utils/sampleRisks'

export function TestRiskAssessment() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Risk Assessment Test</h1>
      <RiskAssessment
        projectId="test-project"
        initialRisks={sampleRisks}
        onRisksUpdate={(risks) => console.log('Risks updated:', risks)}
      />
    </div>
  )
}