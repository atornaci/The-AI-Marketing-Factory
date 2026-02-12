// =========================================
// Social Media Publishing Service
// Handles publishing videos to social media
// platforms via their official APIs
// =========================================

export type SocialPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'twitter'

export interface PublishResult {
    success: boolean
    platform: SocialPlatform
    postId?: string
    postUrl?: string
    error?: string
}

export interface PublishOptions {
    videoUrl: string
    title: string
    description: string
    hashtags: string[]
    thumbnailUrl?: string
    scheduledAt?: Date
}

interface SocialMediaCredentials {
    accessToken: string
    refreshToken?: string
    expiresAt?: number
    accountId?: string
}

// =========================================
// Instagram Publishing (via Meta Graph API)
// =========================================
async function publishToInstagram(
    credentials: SocialMediaCredentials,
    options: PublishOptions
): Promise<PublishResult> {
    try {
        const caption = `${options.title}\n\n${options.description}\n\n${options.hashtags.map(h => `#${h}`).join(' ')}`

        // Step 1: Create media container
        const containerResponse = await fetch(
            `https://graph.facebook.com/v19.0/${credentials.accountId}/media`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_url: options.videoUrl,
                    caption,
                    media_type: 'REELS',
                    access_token: credentials.accessToken,
                }),
            }
        )

        if (!containerResponse.ok) {
            const error = await containerResponse.text()
            throw new Error(`Container creation failed: ${error}`)
        }

        const container = await containerResponse.json()

        // Step 2: Wait for processing (poll status)
        let status = 'IN_PROGRESS'
        let attempts = 0
        while (status === 'IN_PROGRESS' && attempts < 30) {
            await new Promise(r => setTimeout(r, 5000))
            const statusResponse = await fetch(
                `https://graph.facebook.com/v19.0/${container.id}?fields=status_code&access_token=${credentials.accessToken}`
            )
            const statusData = await statusResponse.json()
            status = statusData.status_code
            attempts++
        }

        if (status !== 'FINISHED') {
            throw new Error(`Video processing failed with status: ${status}`)
        }

        // Step 3: Publish the container
        const publishResponse = await fetch(
            `https://graph.facebook.com/v19.0/${credentials.accountId}/media_publish`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: container.id,
                    access_token: credentials.accessToken,
                }),
            }
        )

        if (!publishResponse.ok) {
            const error = await publishResponse.text()
            throw new Error(`Publishing failed: ${error}`)
        }

        const result = await publishResponse.json()

        return {
            success: true,
            platform: 'instagram',
            postId: result.id,
            postUrl: `https://www.instagram.com/reel/${result.id}/`,
        }
    } catch (error) {
        return {
            success: false,
            platform: 'instagram',
            error: String(error),
        }
    }
}

// =========================================
// TikTok Publishing (via TikTok Content API)
// =========================================
async function publishToTikTok(
    credentials: SocialMediaCredentials,
    options: PublishOptions
): Promise<PublishResult> {
    try {
        // Step 1: Initialize upload
        const initResponse = await fetch(
            'https://open.tiktokapis.com/v2/post/publish/video/init/',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                    post_info: {
                        title: options.title,
                        description: `${options.description} ${options.hashtags.map(h => `#${h}`).join(' ')}`,
                        privacy_level: 'SELF_ONLY', // Start as private, user can change
                        disable_duet: false,
                        disable_comment: false,
                        disable_stitch: false,
                    },
                    source_info: {
                        source: 'PULL_FROM_URL',
                        video_url: options.videoUrl,
                    },
                }),
            }
        )

        if (!initResponse.ok) {
            const error = await initResponse.text()
            throw new Error(`TikTok upload init failed: ${error}`)
        }

        const initData = await initResponse.json()

        return {
            success: true,
            platform: 'tiktok',
            postId: initData.data?.publish_id,
        }
    } catch (error) {
        return {
            success: false,
            platform: 'tiktok',
            error: String(error),
        }
    }
}

// =========================================
// LinkedIn Publishing (via LinkedIn API)
// =========================================
async function publishToLinkedIn(
    credentials: SocialMediaCredentials,
    options: PublishOptions
): Promise<PublishResult> {
    try {
        const authorUrn = `urn:li:person:${credentials.accountId}`

        // Step 1: Register upload
        const registerResponse = await fetch(
            'https://api.linkedin.com/v2/assets?action=registerUpload',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
                body: JSON.stringify({
                    registerUploadRequest: {
                        recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
                        owner: authorUrn,
                        serviceRelationships: [
                            {
                                relationshipType: 'OWNER',
                                identifier: 'urn:li:userGeneratedContent',
                            },
                        ],
                    },
                }),
            }
        )

        if (!registerResponse.ok) {
            const error = await registerResponse.text()
            throw new Error(`LinkedIn upload registration failed: ${error}`)
        }

        const registerData = await registerResponse.json()
        const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
        const asset = registerData.value?.asset

        if (!uploadUrl || !asset) {
            throw new Error('Failed to get upload URL from LinkedIn')
        }

        // Step 2: Upload the video
        const videoResponse = await fetch(options.videoUrl)
        const videoBuffer = await videoResponse.arrayBuffer()

        await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Content-Type': 'application/octet-stream',
            },
            body: videoBuffer,
        })

        // Step 3: Create the post
        const postResponse = await fetch(
            'https://api.linkedin.com/v2/ugcPosts',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
                body: JSON.stringify({
                    author: authorUrn,
                    lifecycleState: 'PUBLISHED',
                    specificContent: {
                        'com.linkedin.ugc.ShareContent': {
                            shareCommentary: {
                                text: `${options.title}\n\n${options.description}\n\n${options.hashtags.map(h => `#${h}`).join(' ')}`,
                            },
                            shareMediaCategory: 'VIDEO',
                            media: [
                                {
                                    status: 'READY',
                                    media: asset,
                                    title: { text: options.title },
                                    description: { text: options.description },
                                },
                            ],
                        },
                    },
                    visibility: {
                        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                    },
                }),
            }
        )

        if (!postResponse.ok) {
            const error = await postResponse.text()
            throw new Error(`LinkedIn post creation failed: ${error}`)
        }

        const postData = await postResponse.json()

        return {
            success: true,
            platform: 'linkedin',
            postId: postData.id,
            postUrl: `https://www.linkedin.com/feed/update/${postData.id}/`,
        }
    } catch (error) {
        return {
            success: false,
            platform: 'linkedin',
            error: String(error),
        }
    }
}

// =========================================
// Twitter/X Publishing (via Twitter API v2)
// =========================================
async function publishToTwitter(
    credentials: SocialMediaCredentials,
    options: PublishOptions
): Promise<PublishResult> {
    try {
        // Step 1: Init media upload
        const videoResponse = await fetch(options.videoUrl)
        const videoBuffer = await videoResponse.arrayBuffer()
        const totalBytes = videoBuffer.byteLength

        const initResponse = await fetch(
            'https://upload.twitter.com/1.1/media/upload.json',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    command: 'INIT',
                    total_bytes: String(totalBytes),
                    media_type: 'video/mp4',
                    media_category: 'tweet_video',
                }),
            }
        )

        if (!initResponse.ok) {
            const error = await initResponse.text()
            throw new Error(`Twitter media init failed: ${error}`)
        }

        const initData = await initResponse.json()
        const mediaId = initData.media_id_string

        // Step 2: Upload chunks (simplified — single chunk for small videos)
        const blob = new Blob([videoBuffer])
        const formData = new FormData()
        formData.append('command', 'APPEND')
        formData.append('media_id', mediaId)
        formData.append('segment_index', '0')
        formData.append('media_data', blob)

        await fetch('https://upload.twitter.com/1.1/media/upload.json', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
            },
            body: formData,
        })

        // Step 3: Finalize upload
        await fetch('https://upload.twitter.com/1.1/media/upload.json', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                command: 'FINALIZE',
                media_id: mediaId,
            }),
        })

        // Step 4: Create tweet
        const tweetText = `${options.title}\n\n${options.hashtags.map(h => `#${h}`).join(' ')}`
        const tweetResponse = await fetch(
            'https://api.twitter.com/2/tweets',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: tweetText,
                    media: { media_ids: [mediaId] },
                }),
            }
        )

        if (!tweetResponse.ok) {
            const error = await tweetResponse.text()
            throw new Error(`Tweet creation failed: ${error}`)
        }

        const tweetData = await tweetResponse.json()

        return {
            success: true,
            platform: 'twitter',
            postId: tweetData.data?.id,
            postUrl: `https://twitter.com/i/status/${tweetData.data?.id}`,
        }
    } catch (error) {
        return {
            success: false,
            platform: 'twitter',
            error: String(error),
        }
    }
}

// =========================================
// Main Publishing Function
// =========================================
export async function publishToSocialMedia(
    platform: SocialPlatform,
    credentials: SocialMediaCredentials,
    options: PublishOptions
): Promise<PublishResult> {
    switch (platform) {
        case 'instagram':
            return publishToInstagram(credentials, options)
        case 'tiktok':
            return publishToTikTok(credentials, options)
        case 'linkedin':
            return publishToLinkedIn(credentials, options)
        case 'twitter':
            return publishToTwitter(credentials, options)
        default:
            return {
                success: false,
                platform,
                error: `Unsupported platform: ${platform}`,
            }
    }
}

// =========================================
// Batch Publishing (publish to all platforms)
// =========================================
export async function publishToAllPlatforms(
    platforms: { platform: SocialPlatform; credentials: SocialMediaCredentials }[],
    options: PublishOptions
): Promise<PublishResult[]> {
    const results = await Promise.allSettled(
        platforms.map(({ platform, credentials }) =>
            publishToSocialMedia(platform, credentials, options)
        )
    )

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value
        }
        return {
            success: false,
            platform: platforms[index].platform,
            error: String(result.reason),
        }
    })
}
