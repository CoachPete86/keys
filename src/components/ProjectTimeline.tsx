import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Progress } from './ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Calendar, Clock, Users, AlertTriangle, Plus, Edit, Save, X, ChevronRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { RiskItem } from './RiskAssessment'

export interface TimelinePhase {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'at-risk'
  dependencies: string[]
  deliverables: string[]
  resources: ResourceAllocation[]
  risks: string[] // Risk IDs
  milestones: Milestone[]
  progress: number // 0-100
}

export interface Milestone {
  id: string
  name: string
  date: string
  description: string
  completed: boolean
  critical: boolean
}

export interface ResourceAllocation {
  id: string
  resourceName: string
  role: string
  allocation: number // percentage 0-100
  startDate: string
  endDate: string
  cost: number // per day/hour
  type: 'human' | 'equipment' | 'facility' | 'software'
}

interface ProjectTimelineProps {
  projectId: string
  phases: TimelinePhase[]
  risks: RiskItem[]
  onPhasesUpdate: (phases: TimelinePhase[]) => void
  readonly?: boolean
}

const PHASE_STATUS_CONFIG = {
  'not-started': { label: 'Not Started', color: 'bg-gray-500', bgColor: 'bg-gray-50' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  'completed': { label: 'Completed', color: 'bg-green-500', bgColor: 'bg-green-50' },
  'delayed': { label: 'Delayed', color: 'bg-red-500', bgColor: 'bg-red-50' },
  'at-risk': { label: 'At Risk', color: 'bg-orange-500', bgColor: 'bg-orange-50' }
}

export function ProjectTimeline({ projectId, phases, risks, onPhasesUpdate, readonly = false }: ProjectTimelineProps) {
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [activeTab, setActiveTab] = useState('timeline')

  // Calculate project statistics
  const projectStats = useMemo(() => {
    const totalPhases = phases.length
    const completedPhases = phases.filter(p => p.status === 'completed').length
    const delayedPhases = phases.filter(p => p.status === 'delayed').length
    const atRiskPhases = phases.filter(p => p.status === 'at-risk').length
    
    const overallProgress = totalPhases > 0 
      ? phases.reduce((sum, phase) => sum + phase.progress, 0) / totalPhases 
      : 0

    const totalBudget = phases.reduce((sum, phase) => 
      sum + phase.resources.reduce((phaseSum, resource) => 
        phaseSum + (resource.cost * resource.allocation / 100), 0), 0)

    const criticalMilestones = phases.reduce((sum, phase) => 
      sum + phase.milestones.filter(m => m.critical && !m.completed).length, 0)

    // Get phase-specific risks
    const phaseRisks = phases.reduce((acc, phase) => {
      const phaseRiskItems = risks.filter(risk => phase.risks.includes(risk.id))
      acc[phase.id] = phaseRiskItems
      return acc
    }, {} as Record<string, RiskItem[]>)

    return {
      totalPhases,
      completedPhases,
      delayedPhases,
      atRiskPhases,
      overallProgress,
      totalBudget,
      criticalMilestones,
      phaseRisks
    }
  }, [phases, risks])

  const addNewPhase = () => {
    const newPhase: TimelinePhase = {
      id: `phase-${Date.now()}`,
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'not-started',
      dependencies: [],
      deliverables: [],
      resources: [],
      risks: [],
      milestones: [],
      progress: 0
    }
    setSelectedPhase(newPhase)
    setIsAddingNew(true)
    setIsEditing(true)
  }

  const savePhase = (phase: TimelinePhase) => {
    if (isAddingNew) {
      onPhasesUpdate([...phases, phase])
      setIsAddingNew(false)
    } else {
      onPhasesUpdate(phases.map(p => p.id === phase.id ? phase : p))
    }
    setIsEditing(false)
    setSelectedPhase(null)
    toast.success('Phase saved successfully')
  }

  const deletePhase = (phaseId: string) => {
    onPhasesUpdate(phases.filter(p => p.id !== phaseId))
    if (selectedPhase?.id === phaseId) {
      setSelectedPhase(null)
    }
    toast.success('Phase deleted')
  }

  const getPhaseRiskLevel = (phaseId: string): { level: string; color: string } => {
    const phaseRiskItems = projectStats.phaseRisks[phaseId] || []
    if (phaseRiskItems.length === 0) return { level: 'Low', color: 'text-green-600' }
    
    const maxRiskScore = Math.max(...phaseRiskItems.map(r => r.probability * r.impact))
    if (maxRiskScore >= 20) return { level: 'Critical', color: 'text-red-600' }
    if (maxRiskScore >= 15) return { level: 'High', color: 'text-orange-600' }
    if (maxRiskScore >= 10) return { level: 'Medium', color: 'text-yellow-600' }
    return { level: 'Low', color: 'text-green-600' }
  }

  const calculatePhaseDuration = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Project Timeline</h2>
          <p className="text-muted-foreground">Integrated timeline with risk assessment and resource planning</p>
        </div>
        {!readonly && (
          <Button onClick={addNewPhase} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Phase
          </Button>
        )}
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(projectStats.overallProgress)}%</div>
            <Progress value={projectStats.overallProgress} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {projectStats.completedPhases}/{projectStats.totalPhases}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delayed Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{projectStats.delayedPhases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{projectStats.criticalMilestones}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{Math.round(projectStats.totalBudget).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="resources">Resource Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Project Phases
                  </CardTitle>
                  <CardDescription>
                    Chronological view of project phases with risk indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {phases.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((phase, index) => {
                        const statusConfig = PHASE_STATUS_CONFIG[phase.status]
                        const riskLevel = getPhaseRiskLevel(phase.id)
                        const duration = calculatePhaseDuration(phase.startDate, phase.endDate)
                        const phaseRisks = projectStats.phaseRisks[phase.id] || []
                        
                        return (
                          <div key={phase.id} className="relative">
                            {/* Timeline Line */}
                            {index < phases.length - 1 && (
                              <div className="absolute left-6 top-16 w-0.5 h-8 bg-border"></div>
                            )}
                            
                            <div
                              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${statusConfig.bgColor}`}
                              onClick={() => {
                                setSelectedPhase(phase)
                                setActiveTab('timeline')
                              }}
                            >
                              <div className="flex items-start gap-4">
                                {/* Status Indicator */}
                                <div className={`w-3 h-3 rounded-full ${statusConfig.color} mt-2`}></div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-foreground">{phase.name}</h4>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">{statusConfig.label}</Badge>
                                      {phaseRisks.length > 0 && (
                                        <Badge variant="outline" className={riskLevel.color}>
                                          {phaseRisks.length} Risk{phaseRisks.length > 1 ? 's' : ''}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="font-medium">Start:</span> {phase.startDate ? new Date(phase.startDate).toLocaleDateString() : 'TBD'}
                                    </div>
                                    <div>
                                      <span className="font-medium">End:</span> {phase.endDate ? new Date(phase.endDate).toLocaleDateString() : 'TBD'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Duration:</span> {duration} days
                                    </div>
                                    <div>
                                      <span className="font-medium">Progress:</span> {phase.progress}%
                                    </div>
                                  </div>
                                  
                                  <Progress value={phase.progress} className="mt-3" />
                                  
                                  {/* Milestones */}
                                  {phase.milestones.length > 0 && (
                                    <div className="mt-3">
                                      <div className="text-xs font-medium mb-1">Milestones:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {phase.milestones.map(milestone => (
                                          <Badge 
                                            key={milestone.id} 
                                            variant={milestone.completed ? "default" : "outline"}
                                            className={milestone.critical ? "border-red-300 text-red-700" : ""}
                                          >
                                            {milestone.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {phases.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No phases defined yet.</p>
                          {!readonly && (
                            <Button onClick={addNewPhase} variant="outline" className="mt-4">
                              Add your first phase
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Phase Details Sidebar */}
            <div>
              {selectedPhase ? (
                <PhaseDetailPanel
                  phase={selectedPhase}
                  risks={risks}
                  phaseRisks={projectStats.phaseRisks[selectedPhase.id] || []}
                  isEditing={isEditing}
                  isNew={isAddingNew}
                  onSave={savePhase}
                  onDelete={deletePhase}
                  onEdit={() => setIsEditing(true)}
                  onCancel={() => {
                    setSelectedPhase(null)
                    setIsEditing(false)
                    setIsAddingNew(false)
                  }}
                  readonly={readonly}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a phase to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gantt" className="mt-6">
          <GanttChart phases={phases} risks={projectStats.phaseRisks} />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <ResourcePlanningView phases={phases} onPhasesUpdate={onPhasesUpdate} readonly={readonly} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Phase Detail Panel Component
interface PhaseDetailPanelProps {
  phase: TimelinePhase
  risks: RiskItem[]
  phaseRisks: RiskItem[]
  isEditing: boolean
  isNew: boolean
  onSave: (phase: TimelinePhase) => void
  onDelete: (phaseId: string) => void
  onEdit: () => void
  onCancel: () => void
  readonly: boolean
}

function PhaseDetailPanel({ phase, risks, phaseRisks, isEditing, isNew, onSave, onDelete, onEdit, onCancel, readonly }: PhaseDetailPanelProps) {
  const [formData, setFormData] = useState<TimelinePhase>(phase)

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Phase name is required')
      return
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Start and end dates are required')
      return
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('End date must be after start date')
      return
    }
    onSave(formData)
  }

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, '']
    }))
  }

  const updateDeliverable = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((del, i) => i === index ? value : del)
    }))
  }

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }))
  }

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      name: '',
      date: '',
      description: '',
      completed: false,
      critical: false
    }
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }))
  }

  const updateMilestone = (index: number, updates: Partial<Milestone>) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, ...updates } : milestone
      )
    }))
  }

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }))
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isNew ? 'New Phase' : formData.name}</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit phase details' : 'Phase details and progress'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!readonly && (
              <>
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} size="sm" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button onClick={onCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={onEdit} size="sm" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    {!isNew && (
                      <Button onClick={() => onDelete(phase.id)} variant="destructive" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Phase Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isEditing}
              placeholder="Enter phase name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={!isEditing}
              placeholder="Describe the phase"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PHASE_STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div>
          <Label>Associated Risks</Label>
          <div className="mt-2 space-y-2">
            {phaseRisks.map(risk => {
              const score = risk.probability * risk.impact
              const level = score >= 20 ? 'Critical' : score >= 15 ? 'High' : score >= 10 ? 'Medium' : 'Low'
              const color = score >= 20 ? 'text-red-600' : score >= 15 ? 'text-orange-600' : score >= 10 ? 'text-yellow-600' : 'text-green-600'
              
              return (
                <div key={risk.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{risk.name}</div>
                    <div className="text-sm text-muted-foreground">{risk.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${color}`}>{score}</div>
                    <div className={`text-xs ${color}`}>{level}</div>
                  </div>
                </div>
              )
            })}
            {phaseRisks.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No risks associated with this phase</p>
            )}
          </div>
        </div>

        {/* Deliverables */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Deliverables</Label>
            {isEditing && (
              <Button onClick={addDeliverable} size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {formData.deliverables.map((deliverable, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={deliverable}
                  onChange={(e) => updateDeliverable(index, e.target.value)}
                  disabled={!isEditing}
                  placeholder={`Deliverable ${index + 1}`}
                />
                {isEditing && (
                  <Button
                    onClick={() => removeDeliverable(index)}
                    size="sm"
                    variant="outline"
                    className="px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {formData.deliverables.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No deliverables defined</p>
            )}
          </div>
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Milestones</Label>
            {isEditing && (
              <Button onClick={addMilestone} size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={milestone.name}
                    onChange={(e) => updateMilestone(index, { name: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Milestone name"
                    className="flex-1"
                  />
                  {isEditing && (
                    <Button
                      onClick={() => removeMilestone(index)}
                      size="sm"
                      variant="outline"
                      className="px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={milestone.date}
                    onChange={(e) => updateMilestone(index, { date: e.target.value })}
                    disabled={!isEditing}
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={(e) => updateMilestone(index, { completed: e.target.checked })}
                        disabled={!isEditing}
                      />
                      Completed
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={milestone.critical}
                        onChange={(e) => updateMilestone(index, { critical: e.target.checked })}
                        disabled={!isEditing}
                      />
                      Critical
                    </label>
                  </div>
                </div>
              </div>
            ))}
            {formData.milestones.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No milestones defined</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Gantt Chart Component
interface GanttChartProps {
  phases: TimelinePhase[]
  risks: Record<string, RiskItem[]>
}

function GanttChart({ phases, risks }: GanttChartProps) {
  const chartData = useMemo(() => {
    if (phases.length === 0) return { startDate: new Date(), endDate: new Date(), timeSpan: 0 }
    
    const dates = phases.flatMap(p => [p.startDate, p.endDate]).filter(Boolean).map(d => new Date(d))
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())))
    const timeSpan = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return { startDate, endDate, timeSpan }
  }, [phases])

  const getPositionAndWidth = (phaseStart: string, phaseEnd: string) => {
    if (!phaseStart || !phaseEnd) return { left: 0, width: 0 }
    
    const start = new Date(phaseStart)
    const end = new Date(phaseEnd)
    const left = ((start.getTime() - chartData.startDate.getTime()) / (1000 * 60 * 60 * 24)) / chartData.timeSpan * 100
    const width = ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) / chartData.timeSpan * 100
    
    return { left, width }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Gantt Chart View
        </CardTitle>
        <CardDescription>
          Visual timeline showing phase dependencies and risk indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <div className="min-w-[800px] space-y-4">
            {/* Time Header */}
            <div className="grid grid-cols-12 gap-1 text-xs text-muted-foreground border-b pb-2">
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(chartData.startDate)
                date.setDate(date.getDate() + (i * chartData.timeSpan / 12))
                return (
                  <div key={i} className="text-center">
                    {date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  </div>
                )
              })}
            </div>

            {/* Phase Bars */}
            <div className="space-y-3">
              {phases.map(phase => {
                const { left, width } = getPositionAndWidth(phase.startDate, phase.endDate)
                const statusConfig = PHASE_STATUS_CONFIG[phase.status]
                const phaseRisks = risks[phase.id] || []
                const hasHighRisk = phaseRisks.some(r => (r.probability * r.impact) >= 15)
                
                return (
                  <div key={phase.id} className="relative">
                    <div className="flex items-center gap-4 mb-1">
                      <div className="w-48 text-sm font-medium truncate">{phase.name}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{statusConfig.label}</Badge>
                        {hasHighRisk && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="relative h-6 bg-muted rounded">
                      <div
                        className={`absolute h-full rounded ${statusConfig.color} opacity-80`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`
                        }}
                      >
                        <div 
                          className="h-full bg-white/20 rounded-r"
                          style={{ width: `${phase.progress}%` }}
                        ></div>
                      </div>
                      
                      {/* Milestones */}
                      {phase.milestones.map(milestone => {
                        if (!milestone.date) return null
                        const milestoneDate = new Date(milestone.date)
                        const milestoneLeft = ((milestoneDate.getTime() - chartData.startDate.getTime()) / (1000 * 60 * 60 * 24)) / chartData.timeSpan * 100
                        
                        return (
                          <div
                            key={milestone.id}
                            className={`absolute top-0 w-0.5 h-6 ${milestone.critical ? 'bg-red-600' : 'bg-blue-600'}`}
                            style={{ left: `${milestoneLeft}%` }}
                            title={milestone.name}
                          ></div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {phases.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No phases to display in Gantt chart</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Resource Planning View Component
interface ResourcePlanningViewProps {
  phases: TimelinePhase[]
  onPhasesUpdate: (phases: TimelinePhase[]) => void
  readonly: boolean
}

function ResourcePlanningView({ phases, onPhasesUpdate, readonly }: ResourcePlanningViewProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null)

  const resourceSummary = useMemo(() => {
    const allResources = phases.flatMap(p => p.resources)
    const byType = allResources.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalCost = allResources.reduce((sum, resource) => sum + resource.cost * (resource.allocation / 100), 0)
    const utilizationByResource = allResources.reduce((acc, resource) => {
      acc[resource.resourceName] = (acc[resource.resourceName] || 0) + resource.allocation
      return acc
    }, {} as Record<string, number>)

    return { byType, totalCost, utilizationByResource, totalResources: allResources.length }
  }, [phases])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Resource Summary */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resource Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-bold">£{Math.round(resourceSummary.totalCost).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Resource Cost</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold">{resourceSummary.totalResources}</div>
              <div className="text-sm text-muted-foreground">Total Allocations</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">By Type:</div>
              {Object.entries(resourceSummary.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="capitalize">{type}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Utilization:</div>
              <ScrollArea className="h-32">
                {Object.entries(resourceSummary.utilizationByResource).map(([resource, utilization]) => (
                  <div key={resource} className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs">
                      <span className="truncate">{resource}</span>
                      <span>{utilization}%</span>
                    </div>
                    <Progress value={Math.min(utilization, 100)} className="h-1" />
                  </div>
                ))}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Resource Details */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Phase Resource Allocation</CardTitle>
            <CardDescription>
              Detailed resource planning for each project phase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedPhaseId || phases[0]?.id || ''} onValueChange={setSelectedPhaseId}>
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {phases.slice(0, 4).map(phase => (
                  <TabsTrigger key={phase.id} value={phase.id} className="text-xs">
                    {phase.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {phases.map(phase => (
                <TabsContent key={phase.id} value={phase.id} className="mt-4">
                  <PhaseResourceTable 
                    phase={phase} 
                    onPhaseUpdate={(updatedPhase) => {
                      onPhasesUpdate(phases.map(p => p.id === updatedPhase.id ? updatedPhase : p))
                    }}
                    readonly={readonly}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Phase Resource Table Component
interface PhaseResourceTableProps {
  phase: TimelinePhase
  onPhaseUpdate: (phase: TimelinePhase) => void
  readonly: boolean
}

function PhaseResourceTable({ phase, onPhaseUpdate, readonly }: PhaseResourceTableProps) {
  const [isAddingResource, setIsAddingResource] = useState(false)

  const addNewResource = () => {
    const newResource: ResourceAllocation = {
      id: `resource-${Date.now()}`,
      resourceName: '',
      role: '',
      allocation: 100,
      startDate: phase.startDate,
      endDate: phase.endDate,
      cost: 0,
      type: 'human'
    }
    onPhaseUpdate({
      ...phase,
      resources: [...phase.resources, newResource]
    })
    setIsAddingResource(false)
    toast.success('Resource added')
  }

  const updateResource = (resourceId: string, updates: Partial<ResourceAllocation>) => {
    onPhaseUpdate({
      ...phase,
      resources: phase.resources.map(r => r.id === resourceId ? { ...r, ...updates } : r)
    })
  }

  const removeResource = (resourceId: string) => {
    onPhaseUpdate({
      ...phase,
      resources: phase.resources.filter(r => r.id !== resourceId)
    })
    toast.success('Resource removed')
  }

  const totalPhaseCost = phase.resources.reduce((sum, resource) => 
    sum + (resource.cost * resource.allocation / 100), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{phase.name} - Resources</h4>
          <p className="text-sm text-muted-foreground">
            Total Cost: £{Math.round(totalPhaseCost).toLocaleString()}
          </p>
        </div>
        {!readonly && (
          <Button onClick={addNewResource} size="sm" variant="outline">
            <Plus className="h-3 w-3 mr-1" />
            Add Resource
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Resource</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Allocation %</th>
              <th className="text-left p-2">Cost/Day</th>
              <th className="text-left p-2">Start</th>
              <th className="text-left p-2">End</th>
              {!readonly && <th className="text-left p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {phase.resources.map(resource => (
              <tr key={resource.id} className="border-b">
                <td className="p-2">
                  <Input
                    value={resource.resourceName}
                    onChange={(e) => updateResource(resource.id, { resourceName: e.target.value })}
                    disabled={readonly}
                    className="h-8"
                    placeholder="Resource name"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={resource.role}
                    onChange={(e) => updateResource(resource.id, { role: e.target.value })}
                    disabled={readonly}
                    className="h-8"
                    placeholder="Role"
                  />
                </td>
                <td className="p-2">
                  <Select
                    value={resource.type}
                    onValueChange={(value: any) => updateResource(resource.id, { type: value })}
                    disabled={readonly}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="human">Human</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="facility">Facility</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={resource.allocation}
                    onChange={(e) => updateResource(resource.id, { allocation: parseInt(e.target.value) || 0 })}
                    disabled={readonly}
                    className="h-8"
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={resource.cost}
                    onChange={(e) => updateResource(resource.id, { cost: parseFloat(e.target.value) || 0 })}
                    disabled={readonly}
                    className="h-8"
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="date"
                    value={resource.startDate}
                    onChange={(e) => updateResource(resource.id, { startDate: e.target.value })}
                    disabled={readonly}
                    className="h-8"
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="date"
                    value={resource.endDate}
                    onChange={(e) => updateResource(resource.id, { endDate: e.target.value })}
                    disabled={readonly}
                    className="h-8"
                  />
                </td>
                {!readonly && (
                  <td className="p-2">
                    <Button
                      onClick={() => removeResource(resource.id)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {phase.resources.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No resources allocated to this phase</p>
          </div>
        )}
      </div>
    </div>
  )
}