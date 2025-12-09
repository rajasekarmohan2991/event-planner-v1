"use client"

import { useState, useEffect } from 'react'
import { Rss, X, Heart, MessageCircle, Share2, Image as ImageIcon, Paperclip, Send, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

type FeedPost = {
  id: string
  userId: string
  userName: string
  userImage?: string
  content: string
  attachments?: string[]
  likes: number
  comments: number
  isLiked: boolean
  createdAt: Date
}

type Comment = {
  id: string
  userId: string
  userName: string
  userImage?: string
  content: string
  createdAt: Date
}

export default function FeedButton() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showComments, setShowComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState('')

  // Load feed posts
  useEffect(() => {
    if (isOpen && session?.user) {
      loadFeed()
    }
  }, [isOpen, session])

  const loadFeed = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/feed')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (err) {
      console.error('Failed to load feed:', err)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) return

    try {
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
    } catch (err) {
      console.error('Failed to create post:', err)
    }
  }

  const toggleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/like`, {
        method: 'POST'
      })

      if (res.ok) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
            : post
        ))
      }
    } catch (err) {
      console.error('Failed to toggle like:', err)
    }
  }

  const loadComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(prev => ({ ...prev, [postId]: data.comments || [] }))
      }
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }

  const addComment = async (postId: string) => {
    if (!newComment.trim()) return

    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (res.ok) {
        setNewComment('')
        loadComments(postId)
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, comments: post.comments + 1 } : post
        ))
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!session) return null

  return (
    <div className="relative">
      {/* Feed Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title="Feed"
      >
        <Rss className="w-5 h-5" />
      </button>

      {/* Feed Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Feed Panel */}
          <div className="fixed right-4 top-16 bottom-4 w-[480px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Rss className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Feed</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create Post */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  {selectedFiles.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {selectedFiles.length} file(s) selected
                    </span>
                  )}
                </div>
                <button
                  onClick={createPost}
                  disabled={!newPostContent.trim() && selectedFiles.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                  Post
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                  <p className="text-gray-600 mt-4">Loading feed...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Rss className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">No posts yet</p>
                  <p className="text-sm text-gray-400 mt-2">Be the first to share something!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {/* Post Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                        {post.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{post.userName}</p>
                        <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>

                    {/* Attachments */}
                    {post.attachments && post.attachments.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {post.attachments.map((url, idx) => (
                          <div key={idx} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-2 text-sm transition-colors ${
                          post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (showComments === post.id) {
                            setShowComments(null)
                          } else {
                            setShowComments(post.id)
                            loadComments(post.id)
                          }
                        }}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>

                    {/* Comments Section */}
                    {showComments === post.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {/* Comment Input */}
                        <div className="flex items-center gap-2 mb-4">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addComment(post.id)
                              }
                            }}
                          />
                          <button
                            onClick={() => addComment(post.id)}
                            className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                {comment.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                                <p className="text-sm font-semibold text-gray-900">{comment.userName}</p>
                                <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatTime(comment.createdAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
