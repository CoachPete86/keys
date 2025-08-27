import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  TreeMap
} from 'recharts'
import { 
  Network,
  ChartDonut,
  ChartLine,
  Flow,
  Download,
  Eye,
  MapPin,
  Hierarchy,
  GridFour,
  Target,
  Gauge,
  Crosshair,
  Graph,
  Funnel as FunnelIcon
} from '@phosphor-icons/react'
import { BusinessInput, AnalysisData } from '../App'

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

interface TraceabilityLink {
  requirementId: string
  capabilityId: string
  relationship: 'implements' | 'supports' | 'enables' | 'requires'
  strength: number // 1-3 (weak to strong)
}

interface VisualMappingSystemProps {
  project: BusinessInput
  analysis: AnalysisData
  requirements: Requirement[]
  capabilities: Capability[]
  stage: 'stage1' | 'stage2'
}

export function VisualMappingSystem({ 
  project, 
  analysis, 
  requirements, 
  capabilities, 
  stage 
}: VisualMappingSystemProps) {
  const [activeView, setActiveView] = useState('network')

  // Generate synthetic traceability links based on type matching and keywords
  const traceabilityLinks = useMemo((): TraceabilityLink[] => {
    const links: TraceabilityLink[] = []
    
    requirements.forEach(req => {
      capabilities.forEach(cap => {
        let relationship: TraceabilityLink['relationship'] = 'supports'
        let strength = 1
        
        // Match based on keywords and types
        const reqText = req.requirement.toLowerCase()
        const capText = cap.name.toLowerCase()
        
        // Strong matches
        if (reqText.includes('authentication') && capText.includes('user')) {
          relationship = 'implements'
          strength = 3
        } else if (reqText.includes('data') && capText.includes('data')) {
          relationship = 'implements'
          strength = 3
        } else if (req.type === 'NFR' && cap.type === 'Quality') {
          relationship = 'enables'
          strength = 2
        } else if (req.type === 'CR' && cap.type === 'Core') {
          relationship = 'requires'
          strength = 2
        } else if (req.priority === 'Must' && cap.type === 'Core') {
          relationship = 'implements'
          strength = 2
        }
        
        // Add some randomness for demonstration
        if (Math.random() > 0.7) {
          links.push({
            requirementId: req.id,
            capabilityId: cap.id,
            relationship,
            strength
          })
        }
      })
    })
    
    return links
  }, [requirements, capabilities])

  // Network data for D3-style visualization
  const networkData = useMemo(() => {
    const nodes = [
      ...requirements.map(req => ({
        id: req.id,
        name: req.requirement.substring(0, 30) + '...',
        type: 'requirement',
        subtype: req.type,
        priority: req.priority,
        size: req.priority === 'Must' ? 12 : req.priority === 'Should' ? 10 : 8,
        color: getRequirementColor(req.type, req.priority)
      })),
      ...capabilities.map(cap => ({
        id: cap.id,
        name: cap.name,
        type: 'capability',
        subtype: cap.type,
        size: cap.type === 'Core' ? 12 : cap.type === 'Enabler' ? 10 : 8,
        color: getCapabilityColor(cap.type)
      }))
    ]
    
    const links = traceabilityLinks.map(link => ({
      source: link.requirementId,
      target: link.capabilityId,
      relationship: link.relationship,
      strength: link.strength,
      strokeWidth: link.strength * 2
    }))
    
    return { nodes, links }
  }, [requirements, capabilities, traceabilityLinks])

  // Matrix data for requirement-capability mapping
  const matrixData = useMemo(() => {
    const matrix: Array<{
      requirement: string,
      capability: string,
      value: number,
      relationship: string
    }> = []
    
    traceabilityLinks.forEach(link => {
      const req = requirements.find(r => r.id === link.requirementId)
      const cap = capabilities.find(c => c.id === link.capabilityId)
      
      if (req && cap) {
        matrix.push({
          requirement: req.id,
          capability: cap.id,
          value: link.strength,
          relationship: link.relationship
        })
      }
    })
    
    return matrix
  }, [requirements, capabilities, traceabilityLinks])

  // Sankey data for flow visualization
  const sankeyData = useMemo(() => {
    const nodes = [
      ...requirements.map((req, i) => ({ 
        name: req.id, 
        category: `req-${req.type}`,
        fullName: req.requirement.substring(0, 40) + '...'
      })),
      ...capabilities.map((cap, i) => ({ 
        name: cap.id, 
        category: `cap-${cap.type}`,
        fullName: cap.name
      }))
    ]
    
    const links = traceabilityLinks.map(link => ({
      source: link.requirementId,
      target: link.capabilityId,
      value: link.strength * 10
    }))
    
    return { nodes, links }
  }, [requirements, capabilities, traceabilityLinks])

  // Coverage funnel data (simplified for basic charts)
  const funnelData = useMemo(() => {
    const totalReqs = requirements.length
    const mustReqs = requirements.filter(r => r.priority === 'Must').length
    const mappedReqs = new Set(traceabilityLinks.map(l => l.requirementId)).size
    const coveredCaps = new Set(traceabilityLinks.map(l => l.capabilityId)).size
    
    return [
      { name: 'Total Requirements', value: totalReqs, fill: '#3b82f6' },
      { name: 'Must-Have Requirements', value: mustReqs, fill: '#dc2626' },
      { name: 'Mapped Requirements', value: mappedReqs, fill: '#16a34a' },
      { name: 'Covered Capabilities', value: coveredCaps, fill: '#059669' }
    ]
  }, [requirements, traceabilityLinks])

  const exportHTMLReport = () => {
    const htmlContent = generateHTMLReport(project, analysis, requirements, capabilities, traceabilityLinks, stage)
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-')}-visual-mapping-report.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function getRequirementColor(type: string, priority: string) {
    if (priority === 'Must') return '#dc2626'
    if (priority === 'Should') return '#ea580c'
    if (priority === 'Could') return '#2563eb'
    return '#6b7280'
  }

  function getCapabilityColor(type: string) {
    switch (type) {
      case 'Core': return '#16a34a'
      case 'Enabler': return '#2563eb'
      case 'Support': return '#9333ea'
      case 'Quality': return '#ea580c'
      default: return '#6b7280'
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 rounded-lg border shadow-lg max-w-xs">
          <p className="font-medium text-foreground text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="text-xs">
              <span style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </span>
              {entry.payload.relationship && (
                <p className="text-muted-foreground">
                  Relationship: {entry.payload.relationship}
                </p>
              )}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const renderNetworkVisualization = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          Requirement-Capability Network Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <h4 className="text-sm font-medium mb-2">Requirements Legend</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span>Must Have (CR/FR/NFR)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                  <span>Should Have</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span>Could Have</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Capabilities Legend</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span>Core</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span>Enabler</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  <span>Support</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                  <span>Quality</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-80 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <div className="text-center">
              <Network className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Interactive network visualization would appear here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Showing {networkData.nodes.length} nodes and {networkData.links.length} connections
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderTraceabilityMatrix = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GridFour className="h-5 w-5 text-primary" />
          Traceability Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full">
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 p-2 bg-muted/50 rounded text-xs font-medium">
              <div>Requirement</div>
              <div>Capability</div>
              <div>Relationship</div>
              <div>Strength</div>
            </div>
            {matrixData.map((item, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 p-2 border rounded text-xs">
                <div className="font-mono">{item.requirement}</div>
                <div className="font-mono">{item.capability}</div>
                <div>
                  <Badge variant="outline" className="text-xs">
                    {item.relationship}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < item.value ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  const renderCoverageFunnel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-primary" />
          Coverage Analysis Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#8884d8">
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const renderRelationshipFlow = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flow className="h-5 w-5 text-primary" />
          Relationship Flow Diagram
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-center text-xs">
            <div className="p-2 bg-blue-50 rounded">
              <div className="font-medium">Customer Req</div>
              <div className="text-2xl font-bold text-blue-600">
                {requirements.filter(r => r.type === 'CR').length}
              </div>
            </div>
            <div className="p-2 bg-cyan-50 rounded">
              <div className="font-medium">Functional Req</div>
              <div className="text-2xl font-bold text-cyan-600">
                {requirements.filter(r => r.type === 'FR').length}
              </div>
            </div>
            <div className="p-2 bg-pink-50 rounded">
              <div className="font-medium">Non-Functional</div>
              <div className="text-2xl font-bold text-pink-600">
                {requirements.filter(r => r.type === 'NFR').length}
              </div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="font-medium">Total Links</div>
              <div className="text-2xl font-bold text-green-600">
                {traceabilityLinks.length}
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <div className="text-center">
              <Flow className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Sankey flow diagram would appear here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Showing requirement-to-capability flow relationships
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Visual Mapping System
          </h2>
          <p className="text-muted-foreground">
            Interactive requirement-capability traceability and coverage analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {requirements.length} Requirements
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {capabilities.length} Capabilities
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {traceabilityLinks.length} Links
          </Badge>
          <Button onClick={exportHTMLReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export HTML Report
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network Map
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <GridFour className="h-4 w-4" />
            Traceability Matrix
          </TabsTrigger>
          <TabsTrigger value="coverage" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Coverage Analysis
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <Flow className="h-4 w-4" />
            Relationship Flow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="mt-6">
          {renderNetworkVisualization()}
        </TabsContent>

        <TabsContent value="matrix" className="mt-6">
          {renderTraceabilityMatrix()}
        </TabsContent>

        <TabsContent value="coverage" className="mt-6">
          <div className="grid gap-6">
            {renderCoverageFunnel()}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    Coverage Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Requirements Mapped</span>
                      <span className="font-medium">
                        {new Set(traceabilityLinks.map(l => l.requirementId)).size} / {requirements.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(new Set(traceabilityLinks.map(l => l.requirementId)).size / Math.max(requirements.length, 1)) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Capabilities Covered</span>
                      <span className="font-medium">
                        {new Set(traceabilityLinks.map(l => l.capabilityId)).size} / {capabilities.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(new Set(traceabilityLinks.map(l => l.capabilityId)).size / Math.max(capabilities.length, 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crosshair className="h-5 w-5 text-primary" />
                    Gap Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-800">Unmapped Requirements</div>
                      <div className="text-xs text-red-600">
                        {requirements.length - new Set(traceabilityLinks.map(l => l.requirementId)).size} requirements lack capability mapping
                      </div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-sm font-medium text-orange-800">Uncovered Capabilities</div>
                      <div className="text-xs text-orange-600">
                        {capabilities.length - new Set(traceabilityLinks.map(l => l.capabilityId)).size} capabilities without requirements
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Strong Links</div>
                      <div className="text-xs text-green-600">
                        {traceabilityLinks.filter(l => l.strength === 3).length} strong requirement-capability connections
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="flow" className="mt-6">
          {renderRelationshipFlow()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function generateHTMLReport(
  project: BusinessInput,
  analysis: AnalysisData,
  requirements: Requirement[],
  capabilities: Capability[],
  traceabilityLinks: TraceabilityLink[],
  stage: 'stage1' | 'stage2'
): string {
  const now = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KRCM Visual Mapping Report - ${project.name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 3rem 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .metadata-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #4f46e5;
        }
        
        .metadata-card h3 {
            font-size: 0.875rem;
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        
        .metadata-card p {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
        }
        
        .section {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
        }
        
        .section h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .chart-container {
            position: relative;
            height: 400px;
            margin: 1rem 0;
        }
        
        .requirements-grid, .capabilities-grid {
            display: grid;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .req-card, .cap-card {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid;
        }
        
        .req-card.must { border-left-color: #dc2626; }
        .req-card.should { border-left-color: #ea580c; }
        .req-card.could { border-left-color: #2563eb; }
        .req-card.wont { border-left-color: #6b7280; }
        
        .cap-card.core { border-left-color: #16a34a; }
        .cap-card.enabler { border-left-color: #2563eb; }
        .cap-card.support { border-left-color: #9333ea; }
        .cap-card.quality { border-left-color: #ea580c; }
        
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .badge.primary { background: #dbeafe; color: #1d4ed8; }
        .badge.success { background: #dcfce7; color: #16a34a; }
        .badge.warning { background: #fef3c7; color: #d97706; }
        .badge.danger { background: #fee2e2; color: #dc2626; }
        
        .traceability-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        
        .traceability-table th,
        .traceability-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .traceability-table th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        
        .strength-indicator {
            display: flex;
            gap: 2px;
        }
        
        .strength-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #d1d5db;
        }
        
        .strength-dot.active {
            background: #4f46e5;
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
            font-size: 0.875rem;
        }
        
        @media print {
            .container { padding: 1rem; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>KRCM Visual Mapping Report</h1>
            <p>${project.name} - ${stage.toUpperCase()} Analysis</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Generated on ${now}</p>
        </div>
        
        <div class="metadata">
            <div class="metadata-card">
                <h3>Total Requirements</h3>
                <p>${requirements.length}</p>
            </div>
            <div class="metadata-card">
                <h3>Must-Have Requirements</h3>
                <p>${requirements.filter(r => r.priority === 'Must').length}</p>
            </div>
            <div class="metadata-card">
                <h3>Total Capabilities</h3>
                <p>${capabilities.length}</p>
            </div>
            <div class="metadata-card">
                <h3>Core Capabilities</h3>
                <p>${capabilities.filter(c => c.type === 'Core').length}</p>
            </div>
            <div class="metadata-card">
                <h3>Traceability Links</h3>
                <p>${traceabilityLinks.length}</p>
            </div>
            <div class="metadata-card">
                <h3>Coverage Ratio</h3>
                <p>${Math.round((new Set(traceabilityLinks.map(l => l.requirementId)).size / Math.max(requirements.length, 1)) * 100)}%</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Project Overview</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h3 style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">PURPOSE</h3>
                    <p>${project.purpose}</p>
                </div>
                <div>
                    <h3 style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">TARGET USERS</h3>
                    <p>${project.users}</p>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Requirements Distribution</h2>
            <div class="chart-container">
                <canvas id="requirementsChart"></canvas>
            </div>
            <div class="requirements-grid">
                ${requirements.map(req => `
                    <div class="req-card ${req.priority.toLowerCase()}">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span class="badge primary">${req.id}</span>
                            <span class="badge ${req.type === 'CR' ? 'primary' : req.type === 'FR' ? 'success' : 'warning'}">${req.type}</span>
                            <span class="badge ${req.priority === 'Must' ? 'danger' : req.priority === 'Should' ? 'warning' : 'primary'}">${req.priority}</span>
                        </div>
                        <p style="font-weight: 500;">${req.requirement}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>Capabilities Overview</h2>
            <div class="chart-container">
                <canvas id="capabilitiesChart"></canvas>
            </div>
            <div class="capabilities-grid">
                ${capabilities.map(cap => `
                    <div class="cap-card ${cap.type.toLowerCase()}">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span class="badge primary">${cap.id}</span>
                            <span class="badge ${cap.type === 'Core' ? 'success' : cap.type === 'Enabler' ? 'primary' : cap.type === 'Support' ? 'warning' : 'danger'}">${cap.type}</span>
                        </div>
                        <p style="font-weight: 500;">${cap.name}</p>
                        ${cap.description ? `<p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">${cap.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>Traceability Matrix</h2>
            <table class="traceability-table">
                <thead>
                    <tr>
                        <th>Requirement</th>
                        <th>Capability</th>
                        <th>Relationship</th>
                        <th>Strength</th>
                    </tr>
                </thead>
                <tbody>
                    ${traceabilityLinks.map(link => {
                        const req = requirements.find(r => r.id === link.requirementId)
                        const cap = capabilities.find(c => c.id === link.capabilityId)
                        return `
                            <tr>
                                <td>${req?.id || link.requirementId}</td>
                                <td>${cap?.id || link.capabilityId}</td>
                                <td><span class="badge primary">${link.relationship}</span></td>
                                <td>
                                    <div class="strength-indicator">
                                        ${Array.from({ length: 3 }, (_, i) => `
                                            <div class="strength-dot ${i < link.strength ? 'active' : ''}"></div>
                                        `).join('')}
                                    </div>
                                </td>
                            </tr>
                        `
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Generated by KRCM Analysis Tool</p>
            <p>Enterprise Business Analysis & Capability Architecture</p>
        </div>
    </div>
    
    <script>
        // Requirements Chart
        const reqCtx = document.getElementById('requirementsChart').getContext('2d');
        new Chart(reqCtx, {
            type: 'doughnut',
            data: {
                labels: ['Must Have', 'Should Have', 'Could Have', "Won't Have"],
                datasets: [{
                    data: [
                        ${requirements.filter(r => r.priority === 'Must').length},
                        ${requirements.filter(r => r.priority === 'Should').length},
                        ${requirements.filter(r => r.priority === 'Could').length},
                        ${requirements.filter(r => r.priority === 'Won\'t').length}
                    ],
                    backgroundColor: ['#dc2626', '#ea580c', '#2563eb', '#6b7280']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
        
        // Capabilities Chart
        const capCtx = document.getElementById('capabilitiesChart').getContext('2d');
        new Chart(capCtx, {
            type: 'bar',
            data: {
                labels: ['Core', 'Enabler', 'Support', 'Quality'],
                datasets: [{
                    label: 'Capabilities',
                    data: [
                        ${capabilities.filter(c => c.type === 'Core').length},
                        ${capabilities.filter(c => c.type === 'Enabler').length},
                        ${capabilities.filter(c => c.type === 'Support').length},
                        ${capabilities.filter(c => c.type === 'Quality').length}
                    ],
                    backgroundColor: ['#16a34a', '#2563eb', '#9333ea', '#ea580c']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    </script>
</body>
</html>`
}