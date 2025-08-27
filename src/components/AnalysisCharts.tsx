import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
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
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts'
import { 
  ChartBar, 
  ChartPie, 
  Target, 
  Layers,
  TrendUp,
  Activity
} from '@phosphor-icons/react'

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

interface AnalysisChartsProps {
  requirements: Requirement[]
  capabilities: Capability[]
  stage: 'stage1' | 'stage2'
}

export function AnalysisCharts({ requirements, capabilities, stage }: AnalysisChartsProps) {
  
  // Sample data for demonstration when no parsed data is available
  const sampleRequirements: Requirement[] = [
    { id: 'CR-001', requirement: 'The solution shall provide user authentication', type: 'CR', priority: 'Must' },
    { id: 'FR-001', requirement: 'The system will allow users to login', type: 'FR', priority: 'Must' },
    { id: 'FR-002', requirement: 'The system will provide data export', type: 'FR', priority: 'Should' },
    { id: 'NFR-001', requirement: 'The system will have 99.9% uptime', type: 'NFR', priority: 'Must' },
    { id: 'FR-003', requirement: 'The system will allow data import', type: 'FR', priority: 'Could' }
  ]

  const sampleCapabilities: Capability[] = [
    { id: 'CAP-001', name: 'User Management', type: 'Core' },
    { id: 'CAP-002', name: 'Data Processing', type: 'Core' },
    { id: 'CAP-003', name: 'Authentication Service', type: 'Enabler' },
    { id: 'CAP-004', name: 'Backup System', type: 'Support' },
    { id: 'CAP-005', name: 'Performance Monitoring', type: 'Quality' }
  ]

  // Use sample data if no requirements/capabilities are parsed
  const effectiveRequirements = requirements.length > 0 ? requirements : sampleRequirements
  const effectiveCapabilities = capabilities.length > 0 ? capabilities : sampleCapabilities
  
  // Requirements data processing
  const requirementsByPriority = useMemo(() => {
    const priorityMap = effectiveRequirements.reduce((acc, req) => {
      acc[req.priority] = (acc[req.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return [
      { name: 'Must Have', value: priorityMap['Must'] || 0, color: '#dc2626', fill: '#dc2626' },
      { name: 'Should Have', value: priorityMap['Should'] || 0, color: '#ea580c', fill: '#ea580c' },
      { name: 'Could Have', value: priorityMap['Could'] || 0, color: '#2563eb', fill: '#2563eb' },
      { name: 'Won\'t Have', value: priorityMap['Won\'t'] || 0, color: '#6b7280', fill: '#6b7280' }
    ].filter(item => item.value > 0)
  }, [effectiveRequirements])

  const requirementsByType = useMemo(() => {
    const typeMap = effectiveRequirements.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return [
      { name: 'Customer Requirements', type: 'CR', value: typeMap['CR'] || 0, color: '#6366f1', fill: '#6366f1' },
      { name: 'Functional Requirements', type: 'FR', value: typeMap['FR'] || 0, color: '#06b6d4', fill: '#06b6d4' },
      { name: 'Non-Functional Requirements', type: 'NFR', value: typeMap['NFR'] || 0, color: '#ec4899', fill: '#ec4899' }
    ].filter(item => item.value > 0)
  }, [effectiveRequirements])

  // Capabilities data processing
  const capabilitiesByType = useMemo(() => {
    const typeMap = effectiveCapabilities.reduce((acc, cap) => {
      acc[cap.type] = (acc[cap.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return [
      { name: 'Core', value: typeMap['Core'] || 0, color: '#16a34a', fill: '#16a34a' },
      { name: 'Enabler', value: typeMap['Enabler'] || 0, color: '#2563eb', fill: '#2563eb' },
      { name: 'Support', value: typeMap['Support'] || 0, color: '#9333ea', fill: '#9333ea' },
      { name: 'Quality', value: typeMap['Quality'] || 0, color: '#ea580c', fill: '#ea580c' }
    ].filter(item => item.value > 0)
  }, [effectiveCapabilities])

  // Combined analysis data
  const analysisOverview = useMemo(() => {
    const totalReqs = effectiveRequirements.length
    const criticalReqs = effectiveRequirements.filter(r => r.priority === 'Must').length
    const totalCaps = effectiveCapabilities.length
    const coreCaps = effectiveCapabilities.filter(c => c.type === 'Core').length

    return [
      {
        name: 'Total Requirements',
        current: totalReqs,
        target: stage === 'stage1' ? 8 : 50,
        color: '#3b82f6'
      },
      {
        name: 'Critical Requirements',
        current: criticalReqs,
        target: Math.ceil(totalReqs * 0.4),
        color: '#dc2626'
      },
      {
        name: 'Total Capabilities',
        current: totalCaps,
        target: stage === 'stage1' ? 20 : 80,
        color: '#16a34a'
      },
      {
        name: 'Core Capabilities',
        current: coreCaps,
        target: Math.ceil(totalCaps * 0.3),
        color: '#059669'
      }
    ]
  }, [effectiveRequirements, effectiveCapabilities, stage])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 rounded-lg border shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-primary">
            Count: <span className="font-medium">{payload[0].value}</span>
          </p>
          {payload[0].payload.percentage && (
            <p className="text-xs text-muted-foreground">
              {payload[0].payload.percentage}% of total
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const renderLabel = (entry: any) => {
    return `${entry.name}: ${entry.value}`
  }

  if (effectiveRequirements.length === 0 && effectiveCapabilities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">No Analysis Data Available</h3>
            <p className="text-sm text-muted-foreground">
              Charts will appear once requirements and capabilities are parsed from the analysis
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ChartBar className="h-6 w-6 text-primary" />
            Analysis Distribution Charts
          </h3>
          <p className="text-sm text-muted-foreground">
            Visual breakdown of requirements and capabilities from {stage.toUpperCase()} analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {effectiveRequirements.length} Requirements
            {requirements.length === 0 && <span className="ml-1 text-xs">(Sample)</span>}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {effectiveCapabilities.length} Capabilities
            {capabilities.length === 0 && <span className="ml-1 text-xs">(Sample)</span>}
          </Badge>
        </div>
      </div>

      {/* Sample Data Notice */}
      {requirements.length === 0 && capabilities.length === 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Displaying Sample Data
              </p>
              <p className="text-xs text-blue-700">
                These charts show sample requirements and capabilities. They will update automatically when your analysis contains parsed data.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {analysisOverview.map((item, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
                <p className="text-2xl font-bold text-foreground">{item.current}</p>
                <p className="text-xs text-muted-foreground">
                  Target: {item.target} ({((item.current / item.target) * 100).toFixed(0)}%)
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <div 
                  className="h-8 w-8 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Requirements by Priority */}
        {requirementsByPriority.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Requirements by Priority (MoSCoW)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={requirementsByPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {requirementsByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Requirements by Type */}
        {requirementsByType.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ChartPie className="h-5 w-5 text-primary" />
                Requirements by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={requirementsByType} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8884d8">
                    {requirementsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Capabilities by Type */}
        {capabilitiesByType.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-primary" />
                Capabilities by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="80%" 
                  data={capabilitiesByType}
                >
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8">
                    {capabilitiesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RadialBar>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Coverage Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendUp className="h-5 w-5 text-primary" />
              Coverage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Critical Requirements</span>
                    <span className="text-sm text-muted-foreground">
                      {effectiveRequirements.filter(r => r.priority === 'Must').length} / {effectiveRequirements.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(effectiveRequirements.filter(r => r.priority === 'Must').length / Math.max(effectiveRequirements.length, 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Core Capabilities</span>
                    <span className="text-sm text-muted-foreground">
                      {effectiveCapabilities.filter(c => c.type === 'Core').length} / {effectiveCapabilities.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(effectiveCapabilities.filter(c => c.type === 'Core').length / Math.max(effectiveCapabilities.length, 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {((effectiveRequirements.length / (stage === 'stage1' ? 8 : 50)) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Requirements Coverage</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {((effectiveCapabilities.length / (stage === 'stage1' ? 20 : 80)) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Capabilities Coverage</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {effectiveRequirements.filter(r => r.priority === 'Must').length}
            </div>
            <div className="text-sm text-muted-foreground">Must-Have Requirements</div>
            <div className="text-xs text-muted-foreground mt-1">
              Critical for project success
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {effectiveCapabilities.filter(c => c.type === 'Core').length}
            </div>
            <div className="text-sm text-muted-foreground">Core Capabilities</div>
            <div className="text-xs text-muted-foreground mt-1">
              Primary business functions
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {Math.round((effectiveRequirements.filter(r => r.priority === 'Must').length / Math.max(effectiveCapabilities.filter(c => c.type === 'Core').length, 1)) * 100) / 100}
            </div>
            <div className="text-sm text-muted-foreground">Req:Cap Ratio</div>
            <div className="text-xs text-muted-foreground mt-1">
              Requirements per core capability
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}