import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { 
  FileText, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Target,
  Users,
  Gauge,
  Shield,
  Clock,
  Layers,
  TreeStructure,
  Database,
  Settings,
  ChartLineUp,
  ChartBar
} from '@phosphor-icons/react'
import { BusinessInput, AnalysisData } from '../App'
import { AnalysisCharts } from './AnalysisCharts'
import { VisualMappingSystem } from './VisualMappingSystem'
import { RiskAssessment, RiskItem } from './RiskAssessment'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface AnalysisViewerProps {
  project: BusinessInput
  analysis: AnalysisData
  content: string
  stage: 'stage1' | 'stage2'
}

interface ParsedSection {
  id: string
  title: string
  content: string
  type: 'executive' | 'requirements' | 'capabilities' | 'matrix' | 'nfr' | 'roadmap' | 'diagrams' | 'json' | 'assumptions' | 'risks'
  icon: React.ComponentType<any>
}

interface Requirement {
  id: string
  requirement: string
  type: 'CR' | 'FR' | 'NFR'
  priority: 'Must' | 'Should' | 'Could' | 'Won\'t'
  rationale?: string
  acceptance?: string
}

interface Capability {
  id: string
  name: string
  type: 'Core' | 'Enabler' | 'Support' | 'Quality'
  description?: string
  maturity?: string
}

export function AnalysisViewer({ project, analysis, content, stage }: AnalysisViewerProps) {
  const [activeSection, setActiveSection] = useState('charts')
  const [projectRisks, setProjectRisks] = useKV<RiskItem[]>(`risks-${project.id}`, [])

  // Extract risks from analysis content
  const extractedRisks = useMemo(() => {
    const risks: RiskItem[] = []
    
    // Parse risks from content
    const riskPatterns = [
      /risk[s]?\s*[:\-]\s*([^.\n]+)/gi,
      /constraint[s]?\s*[:\-]\s*([^.\n]+)/gi,
      /challenge[s]?\s*[:\-]\s*([^.\n]+)/gi,
      /limitation[s]?\s*[:\-]\s*([^.\n]+)/gi
    ]

    riskPatterns.forEach((pattern, index) => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        const riskText = match[1]?.trim()
        if (riskText && riskText.length > 10) {
          risks.push({
            id: `extracted-${index}-${risks.length}`,
            name: riskText.substring(0, 100) + (riskText.length > 100 ? '...' : ''),
            description: riskText,
            category: index === 0 ? 'technical' : index === 1 ? 'business' : index === 2 ? 'operational' : 'strategic',
            probability: 3,
            impact: 3,
            currentMitigation: '',
            proposedActions: [],
            owner: '',
            dueDate: '',
            status: 'open' as const
          })
        }
      }
    })

    // Parse specific business constraints
    if (project.constraints) {
      const constraintRisks = project.constraints.split(/[,;]/).map((constraint, index) => {
        const trimmed = constraint.trim()
        if (trimmed.length > 5) {
          return {
            id: `constraint-${index}`,
            name: `Constraint: ${trimmed.substring(0, 80)}`,
            description: trimmed,
            category: 'business' as const,
            probability: 4,
            impact: 3,
            currentMitigation: '',
            proposedActions: [],
            owner: '',
            dueDate: '',
            status: 'open' as const
          }
        }
        return null
      }).filter(Boolean) as RiskItem[]
      
      risks.push(...constraintRisks)
    }

    // Parse identified business risks
    if (project.risks) {
      const businessRisks = project.risks.split(/[,;]/).map((risk, index) => {
        const trimmed = risk.trim()
        if (trimmed.length > 5) {
          return {
            id: `business-risk-${index}`,
            name: trimmed.substring(0, 80) + (trimmed.length > 80 ? '...' : ''),
            description: trimmed,
            category: 'business' as const,
            probability: 3,
            impact: 4,
            currentMitigation: '',
            proposedActions: [],
            owner: '',
            dueDate: '',
            status: 'open' as const
          }
        }
        return null
      }).filter(Boolean) as RiskItem[]
      
      risks.push(...businessRisks)
    }

    return risks
  }, [content, project.constraints, project.risks])

  // Merge extracted risks with user-defined risks
  const allRisks = useMemo(() => {
    const userRiskIds = new Set(projectRisks.map(r => r.id))
    const newExtractedRisks = extractedRisks.filter(r => !userRiskIds.has(r.id))
    return [...projectRisks, ...newExtractedRisks]
  }, [projectRisks, extractedRisks])

  const parsedSections = useMemo((): ParsedSection[] => {
    const sections: ParsedSection[] = []
    
    // Split content into sections based on common KRCM headers
    const sectionPatterns = [
      { id: 'executive', title: 'Executive Snapshot', type: 'executive' as const, icon: Target },
      { id: 'charts', title: 'Analysis Charts', type: 'requirements' as const, icon: ChartBar },
      { id: 'mapping', title: 'Visual Mapping', type: 'requirements' as const, icon: TreeStructure },
      { id: 'risks', title: 'Risk Assessment', type: 'risks' as const, icon: AlertTriangle },
      { id: 'decomposition', title: 'Decomposition', type: 'requirements' as const, icon: TreeStructure },
      { id: 'requirements', title: 'Requirements Register', type: 'requirements' as const, icon: FileText },
      { id: 'capabilities', title: 'Capability Map', type: 'capabilities' as const, icon: Layers },
      { id: 'traceability', title: 'Traceability Matrix', type: 'matrix' as const, icon: Database },
      { id: 'nfr', title: 'Non-Functional Catalogue', type: 'nfr' as const, icon: Shield },
      { id: 'roadmap', title: 'Roadmap', type: 'roadmap' as const, icon: Clock },
      { id: 'diagrams', title: 'Diagrams', type: 'diagrams' as const, icon: ChartLineUp },
      { id: 'json', title: 'JSON Export', type: 'json' as const, icon: Settings },
      { id: 'assumptions', title: 'Assumptions & Open Questions', type: 'assumptions' as const, icon: AlertTriangle }
    ]

    sectionPatterns.forEach(pattern => {
      // Always add charts, mapping, and risks sections (they're computed, not parsed)
      if (pattern.id === 'charts' || pattern.id === 'mapping' || pattern.id === 'risks') {
        sections.push({
          id: pattern.id,
          title: pattern.title,
          content: '', // Charts and mapping are rendered programmatically
          type: pattern.type,
          icon: pattern.icon
        })
        return
      }

      const regex = new RegExp(`##?\\s*${pattern.title}([\\s\\S]*?)(?=##?\\s*(?:${sectionPatterns.map(p => p.title).join('|')})|$)`, 'i')
      const match = content.match(regex)
      
      if (match) {
        sections.push({
          id: pattern.id,
          title: pattern.title,
          content: match[1]?.trim() || '',
          type: pattern.type,
          icon: pattern.icon
        })
      }
    })

    return sections
  }, [content])

  // Enhanced requirements parsing to handle various table formats
  const requirements = useMemo((): Requirement[] => {
    const reqSection = parsedSections.find(s => s.id === 'requirements')
    if (!reqSection) return []

    const requirements: Requirement[] = []
    const lines = reqSection.content.split('\n')
    
    lines.forEach(line => {
      // Parse requirement table rows - handle multiple table formats
      let match = line.match(/\|\s*([A-Z]{2,3}-\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(Must|Should|Could|Won't)\s*\|/)
      
      // Alternative format without rationale column
      if (!match) {
        match = line.match(/\|\s*([A-Z]{2,3}-\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(Must|Should|Could|Won't)\s*\|/)
        if (match) {
          requirements.push({
            id: match[1].trim(),
            requirement: match[2].trim(),
            type: match[3].trim() as 'CR' | 'FR' | 'NFR',
            priority: match[4].trim() as 'Must' | 'Should' | 'Could' | 'Won\'t'
          })
        }
      } else {
        requirements.push({
          id: match[1].trim(),
          requirement: match[2].trim(),
          type: match[3].trim() as 'CR' | 'FR' | 'NFR',
          rationale: match[4].trim(),
          priority: match[5].trim() as 'Must' | 'Should' | 'Could' | 'Won\'t'
        })
      }

      // Also try to parse simple bullet points with priorities
      const bulletMatch = line.match(/^[•\-\*]\s*([^(]+)\(([A-Z]{2,3})\)\s*-\s*(Must|Should|Could|Won't)/)
      if (bulletMatch && !match) {
        requirements.push({
          id: `AUTO-${requirements.length + 1}`,
          requirement: bulletMatch[1].trim(),
          type: bulletMatch[2].trim() as 'CR' | 'FR' | 'NFR',
          priority: bulletMatch[3].trim() as 'Must' | 'Should' | 'Could' | 'Won\'t'
        })
      }
    })

    return requirements
  }, [parsedSections])

  // Enhanced capabilities parsing
  const capabilities = useMemo((): Capability[] => {
    const capSection = parsedSections.find(s => s.id === 'capabilities')
    if (!capSection) return []

    const capabilities: Capability[] = []
    const lines = capSection.content.split('\n')
    
    lines.forEach(line => {
      // Parse capability table rows - handle multiple formats
      let match = line.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|\s*(Core|Enabler|Support|Quality)\s*\|/)
      
      // Alternative format
      if (!match) {
        match = line.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(Core|Enabler|Support|Quality)\s*\|/)
        if (match) {
          capabilities.push({
            id: match[1].trim(),
            name: match[2].trim(),
            type: match[3].trim() as 'Core' | 'Enabler' | 'Support' | 'Quality'
          })
        }
      } else {
        capabilities.push({
          id: match[1].trim(),
          name: match[2].trim(),
          type: match[4].trim() as 'Core' | 'Enabler' | 'Support' | 'Quality',
          description: match[3]?.trim()
        })
      }

      // Also try to parse simple bullet points
      const bulletMatch = line.match(/^[•\-\*]\s*([^(]+)\(([^)]+)\)\s*-\s*(Core|Enabler|Support|Quality)/)
      if (bulletMatch && !match) {
        capabilities.push({
          id: `CAP-${capabilities.length + 1}`,
          name: bulletMatch[1].trim(),
          type: bulletMatch[3].trim() as 'Core' | 'Enabler' | 'Support' | 'Quality',
          description: bulletMatch[2].trim()
        })
      }
    })

    return capabilities
  }, [parsedSections])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const downloadSection = (section: ParsedSection) => {
    const blob = new Blob([section.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}-${section.id}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Download started')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Must': return 'bg-red-100 text-red-800 border-red-200'
      case 'Should': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Could': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Won\'t': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Core': return 'bg-green-100 text-green-800 border-green-200'
      case 'Enabler': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Support': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Quality': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'CR': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'FR': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'NFR': return 'bg-pink-100 text-pink-800 border-pink-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderExecutiveSnapshot = (section: ParsedSection) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Project Name</label>
              <p className="text-foreground font-medium">{project.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Purpose</label>
              <p className="text-foreground">{project.purpose}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Target Users</label>
              <p className="text-foreground">{project.users}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gauge className="h-5 w-5 text-primary" />
              Success Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-line">{project.metrics}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-primary" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-foreground leading-relaxed">
              {section.content}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderRequirements = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Requirements Register</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{requirements.length} Requirements</Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {requirements.filter(r => r.priority === 'Must').length} Must Have
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {requirements.map((req) => (
          <Card key={req.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {req.id}
                  </Badge>
                  <Badge className={`text-xs ${getTypeColor(req.type)}`}>
                    {req.type}
                  </Badge>
                  <Badge className={`text-xs ${getPriorityColor(req.priority)}`}>
                    {req.priority}
                  </Badge>
                </div>
                <p className="text-foreground font-medium">{req.requirement}</p>
                {req.rationale && (
                  <p className="text-sm text-muted-foreground">{req.rationale}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`${req.id}: ${req.requirement}`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderCapabilities = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Capability Map</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{capabilities.length} Capabilities</Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {capabilities.filter(c => c.type === 'Core').length} Core
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Core', 'Enabler', 'Support', 'Quality'].map(type => {
          const typeCaps = capabilities.filter(c => c.type === type)
          if (typeCaps.length === 0) return null

          return (
            <Card key={type} className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={`${getTypeColor(type)}`}>
                  {type} Capabilities
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {typeCaps.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {typeCaps.map((cap) => (
                  <div key={cap.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{cap.id}</span>
                    </div>
                    <p className="font-medium text-sm">{cap.name}</p>
                    {cap.description && (
                      <p className="text-xs text-muted-foreground mt-1">{cap.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderGenericSection = (section: ParsedSection) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <section.icon className="h-5 w-5 text-primary" />
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-foreground leading-relaxed">
              {section.content}
            </pre>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  const activeSection_data = parsedSections.find(s => s.id === activeSection)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Analysis Results</h2>
          <p className="text-muted-foreground">
            {stage === 'stage1' ? 'Stage 1 - Focused Scoping' : 'Stage 2 - Exhaustive Expansion'} for {project.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {stage.toUpperCase()} Complete
          </Badge>
          <Button
            onClick={() => copyToClipboard(content)}
            variant="outline"
            size="sm"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy All
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 flex-wrap">
        {parsedSections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection(section.id)}
            className="flex items-center gap-2"
          >
            <section.icon className="h-4 w-4" />
            {section.title}
          </Button>
        ))}
      </div>

      <Separator />

      {/* Content */}
      <div>
        {activeSection_data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <activeSection_data.icon className="h-5 w-5 text-primary" />
                {activeSection_data.title}
              </h3>
              <Button
                onClick={() => downloadSection(activeSection_data)}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {activeSection === 'executive' && renderExecutiveSnapshot(activeSection_data)}
            {activeSection === 'charts' && (
              <AnalysisCharts 
                requirements={requirements} 
                capabilities={capabilities} 
                stage={stage}
              />
            )}
            {activeSection === 'mapping' && (
              <VisualMappingSystem
                project={project}
                analysis={analysis}
                requirements={requirements}
                capabilities={capabilities}
                stage={stage}
              />
            )}
            {activeSection === 'risks' && (
              <RiskAssessment
                projectId={project.id}
                initialRisks={allRisks}
                onRisksUpdate={(risks) => {
                  // Only save user-created/modified risks, not extracted ones
                  const userRisks = risks.filter(r => !r.id.startsWith('extracted-') && !r.id.startsWith('constraint-') && !r.id.startsWith('business-risk-'))
                  setProjectRisks(userRisks)
                }}
              />
            )}
            {activeSection === 'requirements' && renderRequirements()}
            {activeSection === 'capabilities' && renderCapabilities()}
            {!['executive', 'charts', 'mapping', 'risks', 'requirements', 'capabilities'].includes(activeSection) && 
              renderGenericSection(activeSection_data)}
          </div>
        )}
      </div>
    </div>
  )
}