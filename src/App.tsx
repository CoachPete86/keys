import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { BusinessInputForm } from './components/BusinessInputForm'
import { AnalysisResults } from './components/AnalysisResults'
import { ProjectManager } from './components/ProjectManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card } from './components/ui/card'
import { Toaster } from './components/ui/sonner'
import { Database, FileText, Settings } from '@phosphor-icons/react'

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

function App() {
  const [projects, setProjects] = useKV<Record<string, BusinessInput>>('krcm-projects', {})
  const [analyses, setAnalyses] = useKV<Record<string, AnalysisData>>('krcm-analyses', {})
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('input')

  const currentProject = currentProjectId ? projects[currentProjectId] : null
  const currentAnalysis = currentProjectId ? analyses[currentProjectId] : null

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="input" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Analysis Input
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2" disabled={!currentAnalysis}>
              <FileText className="h-4 w-4" />
              Results
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
              />
            </Card>
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