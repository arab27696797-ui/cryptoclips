import { renderVideo, type RenderVideoParams, type RenderVideoResult } from './renderer'

export interface QueueJobStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: RenderVideoResult
  error?: string
  createdAt: Date
  updatedAt: Date
}

const jobs = new Map<string, QueueJobStatus>()

export async function enqueueRenderJob(
  id: string,
  params: RenderVideoParams,
): Promise<QueueJobStatus> {
  const job: QueueJobStatus = {
    id,
    status: 'pending',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  jobs.set(id, job)

  void processRenderJob(id, params)

  return job
}

export function getRenderJobStatus(id: string): QueueJobStatus | null {
  return jobs.get(id) ?? null
}

export function listRenderJobs(): QueueJobStatus[] {
  return Array.from(jobs.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )
}

async function processRenderJob(id: string, params: RenderVideoParams) {
  const existing = jobs.get(id)

  if (!existing) return

  existing.status = 'processing'
  existing.progress = 25
  existing.updatedAt = new Date()
  jobs.set(id, existing)

  const result = await renderVideo(params)

  const updated = jobs.get(id)
  if (!updated) return

  if (result.success) {
    updated.status = 'completed'
    updated.progress = 100
    updated.result = result
    updated.updatedAt = new Date()
    jobs.set(id, updated)
    return
  }

  updated.status = 'failed'
  updated.progress = 100
  updated.result = result
  updated.error = result.error
  updated.updatedAt = new Date()
  jobs.set(id, updated)
}
