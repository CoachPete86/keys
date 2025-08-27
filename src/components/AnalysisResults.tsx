import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Download, FileText, Copy, ArrowRight, Eye } from '@phosphor-icons/react'
import { BusinessInput, AnalysisData } from '../App'
import { AnalysisViewer } from './AnalysisViewer'
import { toast } from 'sonner'

interface AnalysisResultsProps {
  project: BusinessInput
  analysis: AnalysisData
  onUpdateAnalysis: (projectId: string, analysis: AnalysisData) => void
}

export function AnalysisResults({ project, analysis, onUpdateAnalysis }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('stage1')
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted')
  const [isProcessingStage2, setIsProcessingStage2] = useState(false)

  const runStage2Expansion = async () => {
    if (!analysis.stage1) return

    setIsProcessingStage2(true)

    try {
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

      onUpdateAnalysis(project.id, {
        ...analysis,
        stage2: result,
        status: 'stage2-complete'
      })

      setActiveTab('stage2')
      toast.success('Stage 2 expansion completed')
    } catch (error) {
      toast.error('Stage 2 expansion failed. Please try again.')
    } finally {
      setIsProcessingStage2(false)
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  const downloadAsMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Download started')
  }

  const exportAsJSON = () => {
    const exportData = {
      project: {
        name: project.name,
        purpose: project.purpose,
        users: project.users,
        metrics: project.metrics,
        constraints: project.constraints,
        systems: project.systems,
        risks: project.risks,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      analysis: {
        stage1: analysis.stage1,
        stage2: analysis.stage2,
        status: analysis.status,
        exportedAt: new Date().toISOString()
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-')}-krcm-analysis.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('JSON export downloaded')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Analysis Results</h2>
          <p className="text-muted-foreground">KRCM methodology output for {project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{analysis.status.replace('-', ' ').toUpperCase()}</Badge>
          <Button
            onClick={exportAsJSON}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="stage1" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Stage 1 - Focused Scoping
            </TabsTrigger>
            <TabsTrigger 
              value="stage2" 
              className="flex items-center gap-2"
              disabled={!analysis.stage2}
            >
              <FileText className="h-4 w-4" />
              Stage 2 - Exhaustive Expansion
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {(analysis.stage1 || analysis.stage2) && (
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'formatted' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('formatted')}
                  className="h-7 px-3 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Formatted
                </Button>
                <Button
                  variant={viewMode === 'raw' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('raw')}
                  className="h-7 px-3 text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Raw
                </Button>
              </div>
            )}
            
            {!analysis.stage2 && analysis.stage1 && (
              <Button
                onClick={runStage2Expansion}
                disabled={isProcessingStage2}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                {isProcessingStage2 ? 'Expanding...' : 'Expand to Stage 2'}
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="stage1" className="mt-6">
          {analysis.stage1 && (
            <>
              {viewMode === 'formatted' ? (
                <AnalysisViewer
                  project={project}
                  analysis={analysis}
                  content={analysis.stage1}
                  stage="stage1"
                />
              ) : (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Stage 1 Analysis Output (Raw)</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setViewMode('formatted')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Formatted View
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(analysis.stage1!)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        onClick={() => downloadAsMarkdown(analysis.stage1!, `${project.name}-stage1`)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[600px] w-full rounded border p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {analysis.stage1}
                    </pre>
                  </ScrollArea>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="stage2" className="mt-6">
          {analysis.stage2 && (
            <>
              {viewMode === 'formatted' ? (
                <AnalysisViewer
                  project={project}
                  analysis={analysis}
                  content={analysis.stage2}
                  stage="stage2"
                />
              ) : (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Stage 2 Expansion Output (Raw)</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setViewMode('formatted')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Formatted View
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(analysis.stage2!)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        onClick={() => downloadAsMarkdown(analysis.stage2!, `${project.name}-stage2`)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[600px] w-full rounded border p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {analysis.stage2}
                    </pre>
                  </ScrollArea>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        <Card className="p-4">
          <h4 className="font-medium text-foreground mb-2">Visual Analytics</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Requirements distribution charts</li>
            <li>• Capability breakdown analysis</li>
            <li>• MoSCoW priority visualization</li>
            <li>• Coverage and ratio metrics</li>
            <li>• Interactive chart tooltips</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium text-foreground mb-2">Stage 1 Features</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Executive Snapshot</li>
            <li>• Requirements Register (5-8 key requirements)</li>
            <li>• Capability Map (12-20 capabilities)</li>
            <li>• Traceability Matrix</li>
            <li>• Non-Functional Catalogue</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium text-foreground mb-2">Stage 2 Features</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Exhaustive requirement expansion</li>
            <li>• Auto-paging for large datasets</li>
            <li>• Advanced deduplication</li>
            <li>• Full traceability coverage</li>
            <li>• Export-grade documentation</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}