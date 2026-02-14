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
    // Advanced cinematography (from tldraw video production)
    lens?: string               // e.g. "iPhone 15 PRO front-camera (~23mm)"
    lighting?: string           // e.g. "bright window/light from side (Rembrandt style)"
    performanceDirection?: string  // e.g. "warm eye contact, broad hand gestures, pointing at camera"
    ugcKeywords?: string[]      // e.g. ["smartphone selfie", "handheld realism", "raw unfiltered"]
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
