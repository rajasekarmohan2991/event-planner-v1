"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Send, Image as ImageIcon, X } from 'lucide-react'

interface FeedPost {
  id: string
  content: string
  authorName: string
  authorEmail: string
  createdAt: string
  likesCount: number
  commentsCount: number
  isLiked: boolean
  attachments?: string[]
}

interface Comment {
  id: string
  content: string
  authorName: string
  createdAt: string
}

export default function FeedPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [posting, setPosting] = useState(false)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadFeed()
  }, [])

  const loadFeed = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/feed', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Failed to load feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) return

    try {
      setPosting(true)
      const formData = new FormData()
      formData.append('content', newPostContent)
      selectedFiles.forEach(file => formData.append('attachments', file))

      const res = await fetch('/api/feed', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        setNewPostContent('')
        setSelectedFiles([])
        loadFeed()
      }
    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setPosting(false)
    }
  }

  const toggleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/like`, {
        method: 'POST'
      })

      if (res.ok) {
        loadFeed()
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const loadComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(prev => ({ ...prev, [postId]: data.comments || [] }))
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
    }
  }

  const addComment = async (postId: string) => {
    if (!newComment[postId]?.trim()) return

    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment[postId] })
      })

      if (res.ok) {
        setNewComment(prev => ({ ...prev, [postId]: '' }))
        loadComments(postId)
        loadFeed()
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const toggleComments = (postId: string) => {
    const isShowing = showComments[postId]
    setShowComments(prev => ({ ...prev, [postId]: !isShowing }))
    if (!isShowing && !comments[postId]) {
      loadComments(postId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Community Feed</h1>

          {/* Create Post */}
          <div className="border-t pt-4">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              rows={3}
            />

            {selectedFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <label className="cursor-pointer text-gray-600 hover:text-rose-600 transition-colors">
                <ImageIcon className="w-5 h-5" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    console.log('📸 Files selected:', e.target.files?.length)
                    if (e.target.files) {
                      const files = Array.from(e.target.files)
                      console.log('✅ Setting files:', files.map(f => f.name))
                      setSelectedFiles(files)
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  console.log('🚀 Post button clicked')
                  console.log('Content:', newPostContent)
                  console.log('Files:', selectedFiles.length)
                  createPost()
                }}
                disabled={posting || (!newPostContent.trim() && selectedFiles.length === 0)}
                className="relative z-50 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all pointer-events-auto"
                style={{ pointerEvents: (posting || (!newPostContent.trim() && selectedFiles.length === 0)) ? 'none' : 'auto' }}
              >
                <Send className="w-4 h-4" />
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            No posts yet. Be the first to share something!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.authorName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold">{post.authorName || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                {post.attachments && post.attachments.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {post.attachments.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Attachment"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-2 ${post.isLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500`}
                  >
                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likesCount}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 text-gray-600 hover:text-rose-600"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.commentsCount}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {comments[post.id]?.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
                          {comment.authorName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{comment.authorName}</p>
                          <p className="text-gray-700">{comment.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addComment(post.id)
                          }
                        }}
                      />
                      <button
                        onClick={() => addComment(post.id)}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
