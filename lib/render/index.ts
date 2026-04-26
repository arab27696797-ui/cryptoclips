export { getTemplate, listTemplates, TEMPLATES } from './templates'
export { buildFFmpegCommand, computeDuration } from './composition'
export { enqueueRenderJob, getRenderJobStatus, listRenderJobs } from './queue'
export { renderVideo } from './renderer'

export type { TemplateConfig } from './templates'
export type { CompositionParams, CompositionScene } from './composition'
export type { QueueJobStatus } from './queue'
export type { RenderVideoParams, RenderVideoResult } from './renderer'
