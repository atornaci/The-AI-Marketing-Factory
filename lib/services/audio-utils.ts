// =========================================
// Audio Utilities for Video Pipeline
// TTS Generation + ffmpeg Video-Audio Merge
// =========================================

import { elevenLabs, getVoiceForLanguage } from './elevenlabs'
import { uploadMediaToStorage } from './screenshot'
import type { Language } from '@/lib/i18n/translations'
import type { Gender } from './elevenlabs'
import { execFile } from 'child_process'
import { writeFile, unlink, mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

/**
 * Generate TTS audio using ElevenLabs
 *
 * @param script - Video script text (in target language)
 * @param language - Target language code
 * @param gender - Influencer gender for voice matching
 * @param voiceId - Optional specific voice ID override
 * @returns Audio buffer (MP3) and voice metadata
 */
export async function generateTTSAudio(
    script: string,
    language: Language,
    gender: Gender = 'female',
    voiceId?: string
): Promise<{
    audioBuffer: ArrayBuffer
    voiceId: string
    voiceName: string
}> {
    console.log(`[AudioUtils] Generating TTS: ${script.length} chars, lang=${language}, gender=${gender}`)

    try {
        const result = await elevenLabs.generateVideoAudio(script, language, gender, voiceId)
        console.log(`[AudioUtils] ✅ TTS generated: ${(result.audioBuffer.byteLength / 1024).toFixed(1)} KB, voice=${result.voiceName}`)
        return result
    } catch (error) {
        console.error(`[AudioUtils] ❌ TTS generation failed:`, error)
        throw error
    }
}

/**
 * Merge ElevenLabs audio with Kling video using ffmpeg
 *
 * Downloads the video, writes audio to temp file,
 * runs ffmpeg to combine, uploads result to Supabase.
 *
 * @param videoUrl - URL of the silent/Kling video
 * @param audioBuffer - ElevenLabs TTS audio (MP3)
 * @param projectId - Project ID for storage path
 * @param platform - Platform name for file naming
 * @returns URL of the merged video in Supabase storage
 */
export async function mergeAudioWithVideo(
    videoUrl: string,
    audioBuffer: ArrayBuffer,
    projectId: string,
    platform: string = 'instagram'
): Promise<string> {
    console.log(`[AudioUtils] Merging audio (${(audioBuffer.byteLength / 1024).toFixed(1)} KB) with video: ${videoUrl}`)

    // Create temp directory for processing
    const tempDir = await mkdtemp(join(tmpdir(), 'av-merge-'))
    const audioPath = join(tempDir, 'audio.mp3')
    const videoPath = join(tempDir, 'video.mp4')
    const outputPath = join(tempDir, 'output.mp4')

    try {
        // Step 1: Download video
        console.log(`[AudioUtils] Downloading video...`)
        const videoResponse = await fetch(videoUrl)
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`)
        }
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
        await writeFile(videoPath, videoBuffer)
        console.log(`[AudioUtils] Video downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`)

        // Step 2: Write audio to temp file
        await writeFile(audioPath, Buffer.from(audioBuffer))
        console.log(`[AudioUtils] Audio written to temp file`)

        // Step 3: Run ffmpeg to merge
        // -map 0:v — take video from first input (video file)
        // -map 1:a — take audio from second input (ElevenLabs MP3)
        // -c:v copy — don't re-encode video (fast!)
        // -c:a aac — encode audio as AAC for MP4 compatibility
        // -shortest — stop when the shortest stream ends
        console.log(`[AudioUtils] Running ffmpeg merge...`)
        await execFileAsync('ffmpeg', [
            '-y',                    // Overwrite output
            '-i', videoPath,         // Input 1: video
            '-i', audioPath,         // Input 2: audio
            '-map', '0:v:0',         // Use video from input 0
            '-map', '1:a:0',         // Use audio from input 1
            '-c:v', 'copy',          // Copy video codec (no re-encode)
            '-c:a', 'aac',           // Encode audio as AAC
            '-b:a', '192k',          // Audio bitrate
            '-shortest',             // Match shortest stream duration
            '-movflags', '+faststart', // Optimize for web playback
            outputPath,
        ], { timeout: 60000 }) // 60s timeout

        console.log(`[AudioUtils] ✅ ffmpeg merge complete`)

        // Step 4: Read merged file and upload to Supabase
        const { readFile } = await import('fs/promises')
        const mergedBuffer = await readFile(outputPath)
        console.log(`[AudioUtils] Merged video: ${(mergedBuffer.length / 1024 / 1024).toFixed(2)} MB`)

        const uploadedUrl = await uploadMediaToStorage(
            mergedBuffer,
            projectId,
            `video-${platform}-elevenlabs-${Date.now()}.mp4`,
            'video/mp4'
        )

        if (uploadedUrl) {
            console.log(`[AudioUtils] ✅ Merged video uploaded to Supabase: ${uploadedUrl}`)
            return uploadedUrl
        }

        throw new Error('Upload to Supabase returned null')
    } catch (error) {
        console.error(`[AudioUtils] ❌ Merge failed:`, error)
        throw error
    } finally {
        // Cleanup temp files
        try {
            await unlink(audioPath).catch(() => { })
            await unlink(videoPath).catch(() => { })
            await unlink(outputPath).catch(() => { })
            // Remove temp directory
            const { rmdir } = await import('fs/promises')
            await rmdir(tempDir).catch(() => { })
        } catch {
            // Ignore cleanup errors
        }
    }
}

/**
 * Full audio pipeline for video generation
 *
 * 1. Generate TTS audio with ElevenLabs
 * 2. Wait for video from Kling
 * 3. Merge audio + video with ffmpeg
 * 4. Upload to Supabase
 */
export async function processVideoWithAudio(params: {
    script: string
    videoUrl: string
    language: Language
    gender: Gender
    projectId: string
    platform: string
    voiceId?: string
    onProgress?: (step: string) => void
}): Promise<{
    finalVideoUrl: string
    voiceId: string
    voiceName: string
}> {
    const report = (step: string) => params.onProgress?.(step)

    // Step 1: Generate TTS
    report('🎙️ ElevenLabs: Generating voiceover...')
    const tts = await generateTTSAudio(
        params.script,
        params.language,
        params.gender,
        params.voiceId
    )

    // Step 2: Merge audio with video
    report('🎬 Merging voice with video (ffmpeg)...')
    const finalVideoUrl = await mergeAudioWithVideo(
        params.videoUrl,
        tts.audioBuffer,
        params.projectId,
        params.platform
    )

    return {
        finalVideoUrl,
        voiceId: tts.voiceId,
        voiceName: tts.voiceName,
    }
}
