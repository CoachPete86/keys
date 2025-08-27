import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Play, Save, ArrowRight, CaretDown, CaretRight, Lightbulb } from '@phosphor-icons/react'
import { BusinessInput, AnalysisData } from '../App'
import { toast } from 'sonner'

interface BusinessInputFormProps {
  project: BusinessInput | null
  analysis: AnalysisData | null
  onSaveProject: (project: BusinessInput) => void
  onUpdateAnalysis: (projectId: string, analysis: AnalysisData) => void
  onSwitchToResults: () => void
  onSwitchToDashboard?: () => void
}

export function BusinessInputForm({ 
  project, 
  analysis, 
  onSaveProject, 
  onUpdateAnalysis, 
  onSwitchToResults,
  onSwitchToDashboard
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
  const [showAdvanced, setShowAdvanced] = useState(false)

  const loadExampleData = () => {
    setFormData({
      name: 'Customer Feedback Management System',
      purpose: 'Create a comprehensive system to collect, analyse, and transform customer feedback into actionable insights for product development teams. The solution should capture feedback from multiple channels (web forms, social media, support tickets, surveys), use AI to categorise and prioritise feedback, and provide real-time dashboards for product managers to track trends and make data-driven decisions.',
      users: 'Product managers, customer support teams, development teams, and executive leadership who need insights into customer sentiment and product improvement opportunities.',
      metrics: '• Increase customer satisfaction scores by 25% within 6 months\n• Reduce feedback processing time from 5 days to 2 hours\n• Achieve 90% feedback categorisation accuracy\n• Enable 80% of product decisions to be backed by customer data\n• Reduce customer churn by 15% through proactive issue resolution',
      constraints: 'Budget: £150,000 over 12 months\nTimeline: MVP delivery within 4 months\nCompliance: Must meet GDPR requirements\nIntegration: Must work with existing Salesforce and Jira systems',
      systems: 'Salesforce CRM, Jira for issue tracking, existing company website, social media APIs (Twitter, Facebook), customer support portal, existing SQL Server database for customer data',
      risks: 'Data privacy concerns with customer feedback storage, potential AI bias in categorisation, integration complexity with legacy systems, user adoption challenges, scalability issues with high-volume feedback periods'
    })
    toast.success('Example data loaded - try running Stage 1 Analysis!')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const saveProject = () => {
    if (!formData.name.trim() && !formData.purpose.trim()) {
      toast.error('Please provide either a project name or describe the purpose')
      return
    }

    // Auto-generate name from purpose if not provided
    const projectName = formData.name.trim() || 
      (formData.purpose.trim() ? 
        formData.purpose.substring(0, 50) + (formData.purpose.length > 50 ? '...' : '') :
        `Project ${Date.now()}`
      )

    const projectData: BusinessInput = {
      id: project?.id || `project-${Date.now()}`,
      name: projectName,
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
    if (!formData.purpose.trim()) {
      toast.error('Please describe your purpose before running analysis')
      return
    }

    // Auto-save if needed
    if (!project) {
      saveProject()
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
- Name: ${formData.name || 'Analysis Project'}
- Purpose: ${formData.purpose}
- Target Users: ${formData.users || 'To be determined'}
- Success Metrics: ${formData.metrics || 'To be defined'}
- Constraints: ${formData.constraints || 'None specified'}
- Known Systems: ${formData.systems || 'None specified'}
- Risks: ${formData.risks || 'None identified'}

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

      const projectId = project?.id || `project-${Date.now()}`
      onUpdateAnalysis(projectId, {
        stage1: result,
        status: 'stage1-complete'
      })

      toast.success('Stage 1 analysis completed')
      onSwitchToResults()
    } catch (error) {
      toast.error('Analysis failed. Please try again.')
      const projectId = project?.id || `project-${Date.now()}`
      onUpdateAnalysis(projectId, {
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

  const canRunStage1 = (formData.purpose.trim() || project) && !isProcessing
  const canRunStage2 = analysis?.status === 'stage1-complete' && !isProcessing

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Business Analysis Input</h2>
          <p className="text-muted-foreground">Describe your business idea or need for analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {analysis && (
            <>
              {analysis.status === 'stage1-complete' && (
                <Badge variant="secondary">Stage 1 Complete</Badge>
              )}
              {analysis.status === 'stage2-complete' && (
                <Badge className="bg-accent text-accent-foreground">Stage 2 Complete</Badge>
              )}
            </>
          )}
          <Button 
            onClick={loadExampleData} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            Try Example
          </Button>
        </div>
      </div>

      {/* Help Section */}
      {!formData.purpose && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Try entering a simple business idea to see the streamlined interface in action
              </h3>
              <p className="text-xs text-blue-700 mb-3">
                This tool helps you unbox any business idea into structured requirements and capabilities using enterprise-grade KRCM methodology.
              </p>
              <Button 
                onClick={loadExampleData} 
                size="sm" 
                variant="outline" 
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Load Example: Customer Feedback System
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Purpose Input - Prominently Featured */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="purpose" className="text-lg font-medium">
            What do you need unboxed? Describe your purpose or business idea.
          </Label>
          <Textarea
            id="purpose"
            value={formData.purpose}
            onChange={(e) => handleInputChange('purpose', e.target.value)}
            placeholder="e.g., Create a system to manage customer feedback and turn it into actionable insights for product teams..."
            className="mt-2 min-h-[120px] text-base"
            rows={5}
          />
          <p className="text-sm text-muted-foreground mt-1">
            This is the core input for analysis. Be as detailed as you like about what you're trying to achieve.
          </p>
        </div>

        {/* Project Name - Optional, smaller */}
        <div>
          <Label htmlFor="name" className="text-sm">
            Project Name <span className="text-muted-foreground">(optional - will auto-generate if left blank)</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter a name for this project"
            className="mt-1"
          />
        </div>
      </div>

      {/* Advanced Details - Collapsible */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground p-0 h-auto"
          >
            {showAdvanced ? <CaretDown className="h-4 w-4" /> : <CaretRight className="h-4 w-4" />}
            Advanced Details
            <span className="text-xs bg-muted px-2 py-1 rounded">Optional</span>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
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
        </CollapsibleContent>
      </Collapsible>

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

        {project && onSwitchToDashboard && (
          <Button 
            onClick={onSwitchToDashboard}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Go to Dashboard
          </Button>
        )}

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