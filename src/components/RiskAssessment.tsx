import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { AlertTriangle, TrendingUp, Shield, Target, Plus, X, Edit, Save, Play } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { sampleRisks } from '../utils/sampleRisks'

export interface RiskItem {
  id: string
  name: string
  description: string
  category: 'technical' | 'business' | 'operational' | 'financial' | 'compliance' | 'strategic'
  probability: number // 1-5 scale
  impact: number // 1-5 scale
  currentMitigation: string
  proposedActions: string[]
  owner: string
  dueDate: string
  status: 'open' | 'in-progress' | 'closed' | 'accepted'
}

interface RiskAssessmentProps {
  projectId: string
  initialRisks?: RiskItem[]
  onRisksUpdate?: (risks: RiskItem[]) => void
  readonly?: boolean
}

const RISK_CATEGORIES = [
  { value: 'technical', label: 'Technical', color: 'bg-blue-500' },
  { value: 'business', label: 'Business', color: 'bg-green-500' },
  { value: 'operational', label: 'Operational', color: 'bg-yellow-500' },
  { value: 'financial', label: 'Financial', color: 'bg-red-500' },
  { value: 'compliance', label: 'Compliance', color: 'bg-purple-500' },
  { value: 'strategic', label: 'Strategic', color: 'bg-indigo-500' }
]

const PROBABILITY_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
const IMPACT_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Critical']

export function RiskAssessment({ projectId, initialRisks = [], onRisksUpdate, readonly = false }: RiskAssessmentProps) {
  const [risks, setRisks] = useState<RiskItem[]>(initialRisks)
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [activeTab, setActiveTab] = useState('heatmap')

  // Calculate risk score (probability × impact)
  const calculateRiskScore = (probability: number, impact: number) => probability * impact

  // Get risk level based on score
  const getRiskLevel = (score: number): { level: string; color: string; bgColor: string } => {
    if (score >= 20) return { level: 'Critical', color: 'text-red-700', bgColor: 'bg-red-100 border-red-300' }
    if (score >= 15) return { level: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-300' }
    if (score >= 10) return { level: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-300' }
    if (score >= 6) return { level: 'Low', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300' }
    return { level: 'Very Low', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' }
  }

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = risks.length
    const byLevel = risks.reduce((acc, risk) => {
      const score = calculateRiskScore(risk.probability, risk.impact)
      const level = getRiskLevel(score).level
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byCategory = risks.reduce((acc, risk) => {
      acc[risk.category] = (acc[risk.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byStatus = risks.reduce((acc, risk) => {
      acc[risk.status] = (acc[risk.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const averageScore = total > 0 ? risks.reduce((sum, risk) => sum + calculateRiskScore(risk.probability, risk.impact), 0) / total : 0

    return { total, byLevel, byCategory, byStatus, averageScore }
  }, [risks])

  // Heat map data
  const heatMapData = useMemo(() => {
    const grid = Array(5).fill(null).map(() => Array(5).fill(0))
    risks.forEach(risk => {
      grid[5 - risk.impact][risk.probability - 1]++
    })
    return grid
  }, [risks])

  const updateRisks = (newRisks: RiskItem[]) => {
    setRisks(newRisks)
    onRisksUpdate?.(newRisks)
  }

  const addSampleRisks = () => {
    const newRisks = sampleRisks.map(risk => ({
      ...risk,
      id: `${projectId}-${risk.id}-${Date.now()}`
    }))
    updateRisks([...risks, ...newRisks])
    toast.success(`Added ${newRisks.length} sample risks`)
  }
  const addNewRisk = () => {
    const newRisk: RiskItem = {
      id: `risk-${Date.now()}`,
      name: '',
      description: '',
      category: 'technical',
      probability: 3,
      impact: 3,
      currentMitigation: '',
      proposedActions: [],
      owner: '',
      dueDate: '',
      status: 'open'
    }
    setSelectedRisk(newRisk)
    setIsAddingNew(true)
    setIsEditing(true)
  }

  const saveRisk = (risk: RiskItem) => {
    if (isAddingNew) {
      updateRisks([...risks, risk])
      setIsAddingNew(false)
    } else {
      updateRisks(risks.map(r => r.id === risk.id ? risk : r))
    }
    setIsEditing(false)
    setSelectedRisk(null)
    toast.success('Risk saved successfully')
  }

  const deleteRisk = (riskId: string) => {
    updateRisks(risks.filter(r => r.id !== riskId))
    if (selectedRisk?.id === riskId) {
      setSelectedRisk(null)
    }
    toast.success('Risk deleted')
  }

  const getCellColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-muted'
    const intensity = count / maxCount
    if (intensity <= 0.25) return 'bg-green-200'
    if (intensity <= 0.5) return 'bg-yellow-200'
    if (intensity <= 0.75) return 'bg-orange-200'
    return 'bg-red-200'
  }

  const maxHeatMapCount = Math.max(...heatMapData.flat())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Risk Assessment</h2>
          <p className="text-muted-foreground">Comprehensive risk analysis and scoring</p>
        </div>
        {!readonly && (
          <div className="flex items-center gap-2">
            {risks.length === 0 && (
              <Button onClick={addSampleRisks} variant="outline" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Add Sample Risks
              </Button>
            )}
            <Button onClick={addNewRisk} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Risk
            </Button>
          </div>
        )}
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.byLevel['Critical'] || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statistics.byStatus['open'] || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
          <TabsTrigger value="list">Risk List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="details">Risk Details</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Heat Map
              </CardTitle>
              <CardDescription>
                Visual representation of risk probability vs impact. Darker colors indicate higher risk concentration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Heat Map Grid */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Impact →</div>
                  <div className="grid grid-cols-6 gap-1 p-4 bg-muted/20 rounded-lg">
                    {/* Headers */}
                    <div></div>
                    {IMPACT_LABELS.map((label, i) => (
                      <div key={i} className="text-xs text-center font-medium p-2 rotate-45 origin-center">
                        {label}
                      </div>
                    ))}
                    
                    {/* Probability rows */}
                    {PROBABILITY_LABELS.map((probLabel, probIndex) => (
                      <div key={probIndex} className="contents">
                        <div className="text-xs font-medium p-2 flex items-center justify-end">
                          {probLabel}
                        </div>
                        {heatMapData[4 - probIndex].map((count, impactIndex) => (
                          <div
                            key={`${probIndex}-${impactIndex}`}
                            className={`
                              w-16 h-16 rounded border-2 flex items-center justify-center text-sm font-bold cursor-pointer
                              transition-all hover:scale-105 hover:shadow-lg
                              ${getCellColor(count, maxHeatMapCount)}
                              ${count > 0 ? 'border-gray-400' : 'border-gray-200'}
                            `}
                            title={`Probability: ${PROBABILITY_LABELS[probIndex]}, Impact: ${IMPACT_LABELS[impactIndex]}, Count: ${count}`}
                            onClick={() => {
                              const cellRisks = risks.filter(r => 
                                r.probability === probIndex + 1 && r.impact === impactIndex + 1
                              )
                              if (cellRisks.length > 0) {
                                setSelectedRisk(cellRisks[0])
                                setActiveTab('details')
                              }
                            }}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">↑ Probability</div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-200 rounded border"></div>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-yellow-200 rounded border"></div>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-orange-200 rounded border"></div>
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-red-200 rounded border"></div>
                    <span>Critical</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Register</CardTitle>
              <CardDescription>
                Complete list of identified risks with scores and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {risks.sort((a, b) => calculateRiskScore(b.probability, b.impact) - calculateRiskScore(a.probability, a.impact)).map((risk) => {
                    const score = calculateRiskScore(risk.probability, risk.impact)
                    const riskLevel = getRiskLevel(score)
                    const category = RISK_CATEGORIES.find(c => c.value === risk.category)
                    
                    return (
                      <div
                        key={risk.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${riskLevel.bgColor}`}
                        onClick={() => {
                          setSelectedRisk(risk)
                          setActiveTab('details')
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-foreground">{risk.name}</h4>
                              <Badge variant="outline" className={category?.color}>
                                {category?.label}
                              </Badge>
                              <Badge variant="outline">{risk.status.replace('-', ' ')}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <span>P: {PROBABILITY_LABELS[risk.probability - 1]}</span>
                              <span>I: {IMPACT_LABELS[risk.impact - 1]}</span>
                              <span>Owner: {risk.owner || 'Unassigned'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${riskLevel.color}`}>{score}</div>
                            <div className={`text-xs ${riskLevel.color}`}>{riskLevel.level}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {risks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No risks identified yet.</p>
                      {!readonly && (
                        <Button onClick={addNewRisk} variant="outline" className="mt-4">
                          Add your first risk
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Level Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Risk Level Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Critical', 'High', 'Medium', 'Low', 'Very Low'].map(level => {
                    const count = statistics.byLevel[level] || 0
                    const percentage = statistics.total > 0 ? (count / statistics.total) * 100 : 0
                    const riskLevel = getRiskLevel(level === 'Critical' ? 25 : level === 'High' ? 20 : level === 'Medium' ? 15 : level === 'Low' ? 10 : 5)
                    
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${riskLevel.bgColor.split(' ')[0]}`}></div>
                          <span className="text-sm font-medium">{level}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${riskLevel.bgColor.split(' ')[0]}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {RISK_CATEGORIES.map(category => {
                    const count = statistics.byCategory[category.value] || 0
                    const percentage = statistics.total > 0 ? (count / statistics.total) * 100 : 0
                    
                    return (
                      <div key={category.value} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${category.color}`}></div>
                          <span className="text-sm font-medium">{category.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className={category.color}
                              style={{ width: `${percentage}%`, height: '8px', borderRadius: '4px' }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { status: 'open', label: 'Open', color: 'bg-red-500' },
                    { status: 'in-progress', label: 'In Progress', color: 'bg-yellow-500' },
                    { status: 'closed', label: 'Closed', color: 'bg-green-500' },
                    { status: 'accepted', label: 'Accepted', color: 'bg-blue-500' }
                  ].map(({ status, label, color }) => {
                    const count = statistics.byStatus[status] || 0
                    const percentage = statistics.total > 0 ? (count / statistics.total) * 100 : 0
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${color}`}></div>
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className={color}
                              style={{ width: `${percentage}%`, height: '8px', borderRadius: '4px' }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          {selectedRisk ? (
            <RiskDetailForm
              risk={selectedRisk}
              isEditing={isEditing}
              isNew={isAddingNew}
              onSave={saveRisk}
              onDelete={deleteRisk}
              onEdit={() => setIsEditing(true)}
              onCancel={() => {
                setSelectedRisk(null)
                setIsEditing(false)
                setIsAddingNew(false)
              }}
              readonly={readonly}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a risk from the list or heat map to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface RiskDetailFormProps {
  risk: RiskItem
  isEditing: boolean
  isNew: boolean
  onSave: (risk: RiskItem) => void
  onDelete: (riskId: string) => void
  onEdit: () => void
  onCancel: () => void
  readonly: boolean
}

function RiskDetailForm({ risk, isEditing, isNew, onSave, onDelete, onEdit, onCancel, readonly }: RiskDetailFormProps) {
  const [formData, setFormData] = useState<RiskItem>(risk)

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Risk name is required')
      return
    }
    onSave(formData)
  }

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      proposedActions: [...prev.proposedActions, '']
    }))
  }

  const updateAction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      proposedActions: prev.proposedActions.map((action, i) => i === index ? value : action)
    }))
  }

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      proposedActions: prev.proposedActions.filter((_, i) => i !== index)
    }))
  }

  const score = formData.probability * formData.impact
  const riskLevel = getRiskLevel(score)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isNew ? 'New Risk' : formData.name}</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit risk details' : 'Risk assessment details'}
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
                      <Button onClick={() => onDelete(risk.id)} variant="destructive" size="sm">
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
        {/* Risk Score Display */}
        <div className={`p-4 rounded-lg border ${riskLevel.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Risk Score</h4>
              <p className="text-sm text-muted-foreground">
                Probability ({formData.probability}) × Impact ({formData.impact})
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${riskLevel.color}`}>{score}</div>
              <div className={`text-sm ${riskLevel.color}`}>{riskLevel.level}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Risk Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter risk name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={!isEditing}
                placeholder="Describe the risk in detail"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scoring and Management */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="probability">Probability (1-5)</Label>
              <Select
                value={formData.probability.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, probability: parseInt(value) }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROBABILITY_LABELS.map((label, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {index + 1} - {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="impact">Impact (1-5)</Label>
              <Select
                value={formData.impact.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, impact: parseInt(value) }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPACT_LABELS.map((label, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {index + 1} - {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="owner">Risk Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                disabled={!isEditing}
                placeholder="Assign to team member"
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Current Mitigation */}
        <div>
          <Label htmlFor="mitigation">Current Mitigation</Label>
          <Textarea
            id="mitigation"
            value={formData.currentMitigation}
            onChange={(e) => setFormData(prev => ({ ...prev, currentMitigation: e.target.value }))}
            disabled={!isEditing}
            placeholder="Describe current risk mitigation measures"
            rows={3}
          />
        </div>

        {/* Proposed Actions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Proposed Actions</Label>
            {isEditing && (
              <Button onClick={addAction} size="sm" variant="outline" className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Add Action
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {formData.proposedActions.map((action, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={action}
                  onChange={(e) => updateAction(index, e.target.value)}
                  disabled={!isEditing}
                  placeholder={`Action ${index + 1}`}
                />
                {isEditing && (
                  <Button
                    onClick={() => removeAction(index)}
                    size="sm"
                    variant="outline"
                    className="px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {formData.proposedActions.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No proposed actions yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}