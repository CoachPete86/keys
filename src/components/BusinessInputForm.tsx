import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Play, Save, ArrowRight } from '@phosphor-icons/react'
import { BusinessInput, AnalysisData } from '../App'
import { toast } from 'sonner'

interface BusinessInputFormProps {
  project: BusinessInput | null
  analysis: AnalysisData | null
  onSaveProject: (project: BusinessInput) => void
  onUpdateAnalysis: (projectId: string, analysis: AnalysisData) => void
  onSwitchToResults: () => void
}

export function BusinessInputForm({ 
  project, 
  analysis, 
  onSaveProject, 
  onUpdateAnalysis, 
  onSwitchToResults 
}: BusinessInputFormProps) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    purpose: project?.purpose || '',
    users: project?.users || '',
    metrics: project?.metrics || '',
    constraints: project?.constraints || '',
    systems: project?.systems || '',
    risks: project?.risks || ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState<'stage1' | 'stage2' | null>(null)
  const [progress, setProgress] = useState(0)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const saveProject = () => {
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }

    const projectData: BusinessInput = {
      id: project?.id || `project-${Date.now()}`,
      name: formData.name,
      purpose: formData.purpose,
      users: formData.users,
      metrics: formData.metrics,
      constraints: formData.constraints,
      systems: formData.systems,
      risks: formData.risks,
      createdAt: project?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    onSaveProject(projectData)
    toast.success('Project saved successfully')
  }

  const runStage1Analysis = async () => {
    if (!project) {
      toast.error('Please save the project first')
      return
    }

    setIsProcessing(true)
    setProcessingStage('stage1')
    setProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const prompt = spark.llmPrompt`
You are an enterprise-grade Business Analyst & Capability Architect following the KRCM methodology. Generate a Stage 1 focused scoping analysis for this business idea:

Business Input:
- Name: ${formData.name}
- Purpose: ${formData.purpose}
- Target Users: ${formData.users}
- Success Metrics: ${formData.metrics}
- Constraints: ${formData.constraints}
- Known Systems: ${formData.systems}
- Risks: ${formData.risks}

Follow the exact KRCM Stage 1 format with:
A) Executive Snapshot
B) Decomposition (L1 → L2 → L3)
C) Requirements Register (5-8 key requirements with ID schema CR-001, FR groups UA1.0/CVF1.0 etc.)
D) Capability Map (12-20 capabilities)
E) Traceability Matrix
F) Non-Functional Catalogue
G) Roadmap (Now/Next/Later)
H) Assumptions & Open Questions

Use UK English, MoSCoW prioritisation, and the exact wording standards specified in the KRCM methodology.
`

      const result = await spark.llm(prompt, 'gpt-4o')
      
      clearInterval(progressInterval)
      setProgress(100)

      onUpdateAnalysis(project.id, {
        stage1: result,
        status: 'stage1-complete'
      })

      toast.success('Stage 1 analysis completed')
      onSwitchToResults()
    } catch (error) {
      toast.error('Analysis failed. Please try again.')
      onUpdateAnalysis(project.id, {
        status: 'error'
      })
    } finally {
      setIsProcessing(false)
      setProcessingStage(null)
      setProgress(0)
    }
  }

  const runStage2Analysis = async () => {
    if (!project || !analysis?.stage1) {
      toast.error('Stage 1 analysis required first')
      return
    }

    setIsProcessing(true)
    setProcessingStage('stage2')
    setProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 8, 90))
      }, 800)

      const prompt = spark.llmPrompt`
You are performing KRCM Stage 2 unlimited expansion. Take this Stage 1 analysis and expand it into an exhaustive, export-grade register:

STAGE 1 SEED DATA:
${analysis.stage1}

Apply Stage 2 expansion with:
- RETURN_SCOPE: exhaustive
- DEPTH_LEVEL: 3+ 
- PAGE_SIZE: 50
- DEDUP_THRESHOLD: high
- Full coverage rule: every Must maps to ≥1 capability, ≥1 KPI, ≥1 test note

Generate complete expanded output with all sections A→J, maintaining UK English and exact KRCM wording standards.
`

      const result = await spark.llm(prompt, 'gpt-4o')
      
      clearInterval(progressInterval)
      setProgress(100)

      onUpdateAnalysis(project.id, {
        ...analysis,
        stage2: result,
        status: 'stage2-complete'
      })

      toast.success('Stage 2 expansion completed')
    } catch (error) {
      toast.error('Stage 2 expansion failed. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingStage(null)
      setProgress(0)
    }
  }

  const canRunStage1 = project && !isProcessing
  const canRunStage2 = analysis?.status === 'stage1-complete' && !isProcessing

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Business Analysis Input</h2>
          <p className="text-muted-foreground">Define your business requirements for KRCM analysis</p>
        </div>
        {analysis && (
          <div className="flex items-center gap-2">
            {analysis.status === 'stage1-complete' && (
              <Badge variant="secondary">Stage 1 Complete</Badge>
            )}
            {analysis.status === 'stage2-complete' && (
              <Badge className="bg-accent text-accent-foreground">Stage 2 Complete</Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Idea/Variable Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter business idea name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="purpose">One-sentence Purpose</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="Describe the core purpose in one sentence"
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="users">Target Users/Beneficiaries</Label>
            <Textarea
              id="users"
              value={formData.users}
              onChange={(e) => handleInputChange('users', e.target.value)}
              placeholder="Who will use or benefit from this solution?"
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="metrics">Success Metrics (3-5)</Label>
            <Textarea
              id="metrics"
              value={formData.metrics}
              onChange={(e) => handleInputChange('metrics', e.target.value)}
              placeholder="How will success be measured?"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="constraints">Constraints</Label>
            <Textarea
              id="constraints"
              value={formData.constraints}
              onChange={(e) => handleInputChange('constraints', e.target.value)}
              placeholder="Budget, timeline, regulatory constraints"
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="systems">Known Systems/Data Sources</Label>
            <Textarea
              id="systems"
              value={formData.systems}
              onChange={(e) => handleInputChange('systems', e.target.value)}
              placeholder="Existing systems or data sources to integrate"
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="risks">Notable Risks/Sensitivities</Label>
            <Textarea
              id="risks"
              value={formData.risks}
              onChange={(e) => handleInputChange('risks', e.target.value)}
              placeholder="Key risks or sensitive areas to consider"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {processingStage === 'stage1' ? 'Running Stage 1 Analysis...' : 'Running Stage 2 Expansion...'}
            </span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button onClick={saveProject} variant="outline" className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Project
        </Button>

        <Button 
          onClick={runStage1Analysis} 
          disabled={!canRunStage1}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          Run Stage 1 Analysis
        </Button>

        <Button 
          onClick={runStage2Analysis} 
          disabled={!canRunStage2}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          Expand to Stage 2
        </Button>
      </div>
    </div>
  )
}