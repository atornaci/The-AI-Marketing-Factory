// =========================================
// Storyboard & Hook Types
// For Marketing Intelligence Pipeline
// =========================================

export interface HookVariation {
    id: number
    text: string
    style: 'question' | 'shock' | 'curiosity' | 'pain-point' | 'social-proof'
    estimatedImpact: 'high' | 'medium' | 'low'
}

export interface StoryboardScene {
    sceneNumber: number
    startSecond: number
    endSecond: number
    narration: string
    visualDescription: string
    screenContent?: string
    cameraDirection: string
    emotion: string
}

export interface Storyboard {
    hookVariations: HookVariation[]
    selectedHook: number
    scenes: StoryboardScene[]
    totalDuration: number
    platform: string
    problemSolutionMap: ProblemSolutionPair[]
    createdAt: string
}

export interface ProblemSolutionPair {
    problem: string
    feature: string
    videoMoment: string
}
