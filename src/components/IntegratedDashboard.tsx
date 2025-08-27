import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { 
  Calendar, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Target,
  CheckCircle,
  XCircle,
  PlayCircle
} from '@phosphor-icons/react'
import { TimelinePhase } from './ProjectTimeline'
import { RiskItem } from './RiskAssessment'

interface IntegratedDashboardProps {
  projectName: string
  phases: TimelinePhase[]
  risks: RiskItem[]
}

export function IntegratedDashboard({ projectName, phases, risks }: IntegratedDashboardProps) {
  // Comprehensive project analytics
  const analytics = useMemo(() => {
    // Timeline Analytics
    const totalPhases = phases.length
    const completedPhases = phases.filter(p => p.status === 'completed').length
    const delayedPhases = phases.filter(p => p.status === 'delayed').length
    const atRiskPhases = phases.filter(p => p.status === 'at-risk').length
    const overallProgress = totalPhases > 0 ? phases.reduce((sum, phase) => sum + phase.progress, 0) / totalPhases : 0
    
    // Risk Analytics
    const totalRisks = risks.length
    const criticalRisks = risks.filter(r => (r.probability * r.impact) >= 20).length
    const highRisks = risks.filter(r => (r.probability * r.impact) >= 15 && (r.probability * r.impact) < 20).length
    const openRisks = risks.filter(r => r.status === 'open').length
    const avgRiskScore = totalRisks > 0 ? risks.reduce((sum, risk) => sum + (risk.probability * risk.impact), 0) / totalRisks : 0
    
    // Resource Analytics
    const allResources = phases.flatMap(p => p.resources)
    const totalResourceCost = allResources.reduce((sum, resource) => sum + (resource.cost * resource.allocation / 100), 0)
    const resourceUtilization = allResources.reduce((acc, resource) => {
      acc[resource.resourceName] = (acc[resource.resourceName] || 0) + resource.allocation
      return acc
    }, {} as Record<string, number>)
    const overallocatedResources = Object.values(resourceUtilization).filter(util => util > 100).length
    
    // Timeline Analytics
    const allMilestones = phases.flatMap(p => p.milestones)
    const criticalMilestones = allMilestones.filter(m => m.critical && !m.completed).length
    const completedMilestones = allMilestones.filter(m => m.completed).length
    
    // Schedule Health
    const now = new Date()
    const overdueMilestones = allMilestones.filter(m => 
      !m.completed && m.date && new Date(m.date) < now
    ).length
    
    // Risk-Timeline Integration
    const phasesWithHighRisk = phases.filter(phase => 
      phase.risks.some(riskId => {
        const risk = risks.find(r => r.id === riskId)
        return risk && (risk.probability * risk.impact) >= 15
      })
    ).length
    
    // Project Health Score (0-100)
    const healthScore = Math.round(
      (overallProgress * 0.3) + 
      ((1 - (openRisks / Math.max(totalRisks, 1))) * 0.3) +
      ((completedPhases / Math.max(totalPhases, 1)) * 0.2) +
      ((1 - (overdueMilestones / Math.max(allMilestones.length, 1))) * 0.2)
    ) * 100
    
    return {
      // Timeline
      totalPhases,
      completedPhases,
      delayedPhases,
      atRiskPhases,
      overallProgress,
      
      // Risk
      totalRisks,
      criticalRisks,
      highRisks,
      openRisks,
      avgRiskScore,
      
      // Resource
      totalResourceCost,
      resourceUtilization,
      overallocatedResources,
      totalResources: allResources.length,
      
      // Milestones
      criticalMilestones,
      completedMilestones,
      overdueMilestones,
      totalMilestones: allMilestones.length,
      
      // Integration
      phasesWithHighRisk,
      healthScore
    }
  }, [phases, risks])

  // Risk-Timeline Integration Analysis
  const riskTimelineIntegration = useMemo(() => {
    return phases.map(phase => {
      const phaseRisks = risks.filter(risk => phase.risks.includes(risk.id))
      const maxRiskScore = phaseRisks.length > 0 ? Math.max(...phaseRisks.map(r => r.probability * r.impact)) : 0
      const totalPhaseRisk = phaseRisks.reduce((sum, risk) => sum + (risk.probability * risk.impact), 0)
      
      // Calculate risk-adjusted timeline confidence
      const baseConfidence = phase.progress
      const riskAdjustment = Math.max(0, 1 - (totalPhaseRisk / 100)) // Reduce confidence based on risk
      const adjustedConfidence = baseConfidence * riskAdjustment
      
      return {
        ...phase,
        phaseRisks,
        maxRiskScore,
        totalPhaseRisk,
        adjustedConfidence,
        riskLevel: maxRiskScore >= 20 ? 'Critical' : maxRiskScore >= 15 ? 'High' : maxRiskScore >= 10 ? 'Medium' : 'Low'
      }
    })
  }, [phases, risks])

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getHealthBackground = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    if (score >= 40) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Project Dashboard</h2>
        <p className="text-muted-foreground">Integrated view of timeline, risks, and resource planning for {projectName}</p>
      </div>

      {/* Health Score Banner */}
      <Card className={`border-2 ${getHealthBackground(analytics.healthScore)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Health Score
              </CardTitle>
              <CardDescription>
                Overall project health based on timeline, risks, and deliverables
              </CardDescription>
            </div>
            <div className={`text-4xl font-bold ${getHealthColor(analytics.healthScore)}`}>
              {analytics.healthScore}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={analytics.healthScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.overallProgress)}%</div>
            <div className="text-xs text-muted-foreground">
              {analytics.completedPhases}/{analytics.totalPhases} phases complete
            </div>
            <Progress value={analytics.overallProgress} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Exposure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.criticalRisks}</div>
            <div className="text-xs text-muted-foreground">
              Critical risks ({analytics.openRisks} open)
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg Score: {analytics.avgRiskScore.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Resource Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{Math.round(analytics.totalResourceCost).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {analytics.totalResources} allocations
            </div>
            {analytics.overallocatedResources > 0 && (
              <div className="text-xs text-red-600 mt-1">
                {analytics.overallocatedResources} overallocated
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedMilestones}/{analytics.totalMilestones}</div>
            <div className="text-xs text-muted-foreground">Complete</div>
            {analytics.overdueMilestones > 0 && (
              <div className="text-xs text-red-600 mt-1">
                {analytics.overdueMilestones} overdue
              </div>
            )}
            {analytics.criticalMilestones > 0 && (
              <div className="text-xs text-orange-600 mt-1">
                {analytics.criticalMilestones} critical pending
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integration" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integration">Risk-Timeline Integration</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="resource-conflicts">Resource Conflicts</TabsTrigger>
          <TabsTrigger value="schedule-analysis">Schedule Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="integration" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Risk-Timeline Integration Analysis
              </CardTitle>
              <CardDescription>
                How risks impact timeline confidence and deliverability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {riskTimelineIntegration.map(phase => (
                    <div key={phase.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{phase.name}</h4>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={phase.riskLevel === 'Critical' ? 'destructive' : 'outline'}>
                            {phase.riskLevel} Risk
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Base Progress</div>
                          <Progress value={phase.progress} className="h-2 mt-1" />
                          <div className="text-xs mt-1">{phase.progress}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Risk-Adjusted Confidence</div>
                          <Progress value={phase.adjustedConfidence} className="h-2 mt-1" />
                          <div className="text-xs mt-1">{Math.round(phase.adjustedConfidence)}%</div>
                        </div>
                      </div>

                      {phase.phaseRisks.length > 0 && (
                        <div>
                          <div className="text-xs font-medium mb-2">Associated Risks:</div>
                          <div className="space-y-1">
                            {phase.phaseRisks.map(risk => {
                              const score = risk.probability * risk.impact
                              return (
                                <div key={risk.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                                  <span>{risk.name}</span>
                                  <span className={score >= 20 ? 'text-red-600 font-bold' : score >= 15 ? 'text-orange-600' : 'text-yellow-600'}>
                                    Score: {score}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Project Alerts
              </CardTitle>
              <CardDescription>
                Critical issues requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.delayedPhases > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium text-red-800">Delayed Phases</div>
                      <div className="text-sm text-red-600">{analytics.delayedPhases} phases are behind schedule</div>
                    </div>
                  </div>
                )}

                {analytics.criticalRisks > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium text-red-800">Critical Risks</div>
                      <div className="text-sm text-red-600">{analytics.criticalRisks} risks with scores ≥20 need immediate action</div>
                    </div>
                  </div>
                )}

                {analytics.overdueMilestones > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-orange-800">Overdue Milestones</div>
                      <div className="text-sm text-orange-600">{analytics.overdueMilestones} milestones are past their due date</div>
                    </div>
                  </div>
                )}

                {analytics.overallocatedResources > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Users className="h-5 w-5 text-yellow-600" />
                    <div>
                      <div className="font-medium text-yellow-800">Resource Overallocation</div>
                      <div className="text-sm text-yellow-600">{analytics.overallocatedResources} resources are allocated over 100%</div>
                    </div>
                  </div>
                )}

                {analytics.phasesWithHighRisk > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-orange-800">High-Risk Phases</div>
                      <div className="text-sm text-orange-600">{analytics.phasesWithHighRisk} phases have high-risk issues that may impact delivery</div>
                    </div>
                  </div>
                )}

                {analytics.delayedPhases === 0 && analytics.criticalRisks === 0 && analytics.overdueMilestones === 0 && analytics.overallocatedResources === 0 && analytics.phasesWithHighRisk === 0 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-800">All Clear</div>
                      <div className="text-sm text-green-600">No critical alerts at this time</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resource-conflicts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resource Allocation Analysis
              </CardTitle>
              <CardDescription>
                Identify and resolve resource conflicts across phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.resourceUtilization).map(([resource, utilization]) => (
                  <div key={resource} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{resource}</span>
                      <span className={utilization > 100 ? 'text-red-600 font-bold' : utilization > 80 ? 'text-orange-600' : 'text-green-600'}>
                        {utilization}%
                      </span>
                    </div>
                    <Progress value={Math.min(utilization, 100)} className="h-2" />
                    {utilization > 100 && (
                      <div className="text-xs text-red-600">
                        Overallocated by {utilization - 100}%
                      </div>
                    )}
                  </div>
                ))}
                
                {Object.keys(analytics.resourceUtilization).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No resource allocations to analyze</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule-analysis" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Health Analysis
              </CardTitle>
              <CardDescription>
                Timeline analysis with risk-adjusted projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Phase Status Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <Badge variant="default">{analytics.completedPhases}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">In Progress</span>
                      <Badge variant="outline">{analytics.totalPhases - analytics.completedPhases - analytics.delayedPhases}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Delayed</span>
                      <Badge variant="destructive">{analytics.delayedPhases}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">At Risk</span>
                      <Badge variant="outline" className="border-orange-300 text-orange-700">{analytics.atRiskPhases}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Milestone Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Milestones</span>
                      <span>{analytics.totalMilestones}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <span className="text-green-600">{analytics.completedMilestones}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Critical Pending</span>
                      <span className="text-orange-600">{analytics.criticalMilestones}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overdue</span>
                      <span className="text-red-600">{analytics.overdueMilestones}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}