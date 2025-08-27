import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { BusinessInputForm } from './components/BusinessInputForm'
import { AnalysisResults } from './components/AnalysisResults'
import { ProjectManager } from './components/ProjectManager'
import { ProjectTimeline, TimelinePhase } from './components/ProjectTimeline'
import { RiskAssessment, RiskItem } from './components/RiskAssessment'
import { IntegratedDashboard } from './components/IntegratedDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card } from './components/ui/card'
import { Toaster } from './components/ui/sonner'
import { Database, FileText, Settings, Calendar, AlertTriangle, BarChart3 } from '@phosphor-icons/react'

export interface BusinessInput {
  id: string
  name: string
  purpose: string
  users: string
  metrics: string
  constraints: string
  systems: string
  risks: string
  createdAt: string
  updatedAt: string
}

export interface AnalysisData {
  stage1?: string
  stage2?: string
  status: 'pending' | 'stage1-complete' | 'stage2-complete' | 'error'
}

export interface ProjectData {
  timeline: TimelinePhase[]
  risks: RiskItem[]
}

function App() {
  const [projects, setProjects] = useKV<Record<string, BusinessInput>>('krcm-projects', {})
  const [analyses, setAnalyses] = useKV<Record<string, AnalysisData>>('krcm-analyses', {})
  const [projectData, setProjectData] = useKV<Record<string, ProjectData>>('krcm-project-data', {})
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('input')

  const currentProject = currentProjectId ? projects[currentProjectId] : null
  const currentAnalysis = currentProjectId ? analyses[currentProjectId] : null
  const currentProjectTimeline = currentProjectId ? projectData[currentProjectId] : null

  const saveProject = (project: BusinessInput) => {
    setProjects(prev => ({
      ...prev,
      [project.id]: project
    }))
    setCurrentProjectId(project.id)
  }

  const updateAnalysis = (projectId: string, analysis: AnalysisData) => {
    setAnalyses(prev => ({
      ...prev,
      [projectId]: analysis
    }))
  }

  const updateProjectData = (projectId: string, data: Partial<ProjectData>) => {
    setProjectData(prev => ({
      ...prev,
      [projectId]: {
        timeline: [],
        risks: [],
        ...prev[projectId],
        ...data
      }
    }))
  }

  const selectProject = (projectId: string) => {
    setCurrentProjectId(projectId)
    setActiveTab('input')
  }

  const deleteProject = (projectId: string) => {
    setProjects(prev => {
      const newProjects = { ...prev }
      delete newProjects[projectId]
      return newProjects
    })
    setAnalyses(prev => {
      const newAnalyses = { ...prev }
      delete newAnalyses[projectId]
      return newAnalyses
    })
    setProjectData(prev => {
      const newProjectData = { ...prev }
      delete newProjectData[projectId]
      return newProjectData
    })
    if (currentProjectId === projectId) {
      setCurrentProjectId(null)
      setActiveTab('projects')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">KRCM Analysis Tool</h1>
                <p className="text-sm text-muted-foreground">Enterprise Business Analysis & Capability Architecture</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="input" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Analysis Input
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2" disabled={!currentProject}>
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2" disabled={!currentProject}>
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-2" disabled={!currentProject}>
              <AlertTriangle className="h-4 w-4" />
              Risk Assessment
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2" disabled={!currentAnalysis}>
              <FileText className="h-4 w-4" />
              Analysis Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-6">
            <Card className="p-6">
              <ProjectManager
                projects={projects}
                onSelectProject={selectProject}
                onDeleteProject={deleteProject}
                currentProjectId={currentProjectId}
              />
            </Card>
          </TabsContent>

          <TabsContent value="input" className="mt-6">
            <Card className="p-6">
              <BusinessInputForm
                project={currentProject}
                analysis={currentAnalysis}
                onSaveProject={saveProject}
                onUpdateAnalysis={updateAnalysis}
                onSwitchToResults={() => setActiveTab('results')}
                onSwitchToDashboard={() => setActiveTab('dashboard')}
              />
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            {currentProject && (
              <IntegratedDashboard
                projectName={currentProject.name}
                phases={currentProjectTimeline?.timeline || []}
                risks={currentProjectTimeline?.risks || []}
              />
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            {currentProject && (
              <Card className="p-6">
                <ProjectTimeline
                  projectId={currentProject.id}
                  phases={currentProjectTimeline?.timeline || []}
                  risks={currentProjectTimeline?.risks || []}
                  onPhasesUpdate={(phases) => updateProjectData(currentProject.id, { timeline: phases })}
                />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="risks" className="mt-6">
            {currentProject && (
              <Card className="p-6">
                <RiskAssessment
                  projectId={currentProject.id}
                  initialRisks={currentProjectTimeline?.risks || []}
                  onRisksUpdate={(risks) => updateProjectData(currentProject.id, { risks })}
                />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {currentProject && currentAnalysis && (
              <AnalysisResults
                project={currentProject}
                analysis={currentAnalysis}
                onUpdateAnalysis={updateAnalysis}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <Toaster />
    </div>
  )
}

export default App