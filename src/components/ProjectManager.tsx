import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table'
import { 
  Plus, 
  Trash2, 
  FolderOpen, 
  Search,
  Calendar,
  FileText
} from '@phosphor-icons/react'
import { BusinessInput } from '../App'
import { toast } from 'sonner'

interface ProjectManagerProps {
  projects: Record<string, BusinessInput>
  onSelectProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
  currentProjectId: string | null
}

export function ProjectManager({ 
  projects, 
  onSelectProject, 
  onDeleteProject, 
  currentProjectId 
}: ProjectManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const projectList = Object.values(projects).filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const createNewProject = () => {
    onSelectProject('')
  }

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      onDeleteProject(projectId)
      toast.success('Project deleted successfully')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Project Management</h2>
          <p className="text-muted-foreground">Manage your KRCM analysis projects</p>
        </div>
        <Button onClick={createNewProject} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {projectList.length} projects
        </Badge>
      </div>

      {projectList.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms to find projects.' 
              : 'Create your first KRCM analysis project to get started.'
            }
          </p>
          {!searchTerm && (
            <Button onClick={createNewProject} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Project
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectList.map((project) => (
                <TableRow 
                  key={project.id}
                  className={currentProjectId === project.id ? 'bg-muted/50' : 'cursor-pointer hover:bg-muted/30'}
                  onClick={() => onSelectProject(project.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {currentProjectId === project.id && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                      {project.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {project.purpose || 'No purpose defined'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(project.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(project.updatedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={project.purpose ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {project.purpose ? 'Configured' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id, project.name)
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="font-medium text-foreground mb-2">Project Workflow</h4>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Create and configure project</li>
            <li>2. Run Stage 1 focused analysis</li>
            <li>3. Expand to Stage 2 if needed</li>
            <li>4. Export results for documentation</li>
          </ol>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium text-foreground mb-2">Analysis Stages</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Stage 1:</strong> 5-8 key requirements</li>
            <li>• <strong>Stage 2:</strong> Exhaustive expansion</li>
            <li>• <strong>Export:</strong> JSON, Markdown formats</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium text-foreground mb-2">Best Practices</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Define clear success metrics</li>
            <li>• Include relevant constraints</li>
            <li>• Identify key stakeholders</li>
            <li>• Document known risks early</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}