'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { 
  Settings2, Globe, Database, Download, FileText, Send, 
  Sparkles, Paperclip, Loader2, Trash2, GraduationCap, 
  BookOpen, Tag, PlusCircle, CheckCircle2
} from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import { Navbar } from '../../components/navbar'
import { ToastProvider, useToast } from '../../lib/toast-context'
import { Button } from '../../components/ui/button'

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  
  // Auth & Session
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [sessionId] = useState(() => {
    const fromUrl = searchParams.get('session')
    return fromUrl || `session_${Math.random().toString(36).substr(2, 9)}`
  })

  // Sync session ID to URL
  useEffect(() => {
    const currentSession = searchParams.get('session')
    if (!currentSession && sessionId) {
      const params = new URLSearchParams(searchParams)
      params.set('session', sessionId)
      router.replace(`/chat?${params.toString()}`, { scroll: false })
    }
  }, [sessionId, searchParams, router])

  // Chat State
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: 'Welcome to your AI Lesson Planning workspace! How can I help you today? You can ask me to create a lesson plan, search for latest resources, or explain complex topics.' 
    }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Settings & Documents State
  const [settings, setSettings] = useState({
    difficulty: 'Medium',
    useWebsearch: true,
    useGlobal: false,
    // Upload Defaults
    uploadGrade: '',
    uploadSubject: '',
    uploadTopic: '',
    shareUploads: false,
  })
  const [showSettings, setShowSettings] = useState(true)
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    api.getMe()
      .then((user) => {
        setIsLoggedIn(true)
        setUserName(user.email.split('@')[0])
        setLoading(false)
        fetchDocuments()
        loadHistory(sessionId)
      })
      .catch(() => {
        router.push('/')
      })
  }, [router, sessionId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending, uploading])

  async function fetchDocuments() {
    try {
      const docs = await api.getMyDocuments()
      setDocuments(docs)
    } catch (err) {
      console.error('Failed to fetch documents', err)
    }
  }

  async function handleDeleteDocument(docId) {
    try {
      await api.deleteDocument(docId)
      showToast('Document removed.', 'info')
      fetchDocuments()
    } catch (err) {
      showToast('Failed to delete: ' + err.message, 'error')
    }
  }

  async function handleLogout() {
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout failed', err)
    }
    setIsLoggedIn(false)
    router.push('/')
  }

  const parseLessonPlan = (rawText) => {
    const jsonRegex = /```json\n([\s\S]*?)\n```/
    const match = rawText.match(jsonRegex)

    if (match && match[1]) {
      try {
        const lessonData = JSON.parse(match[1])
        const cleanText = rawText.replace(jsonRegex, '').trim()
        return { cleanText, lessonData }
      } catch (e) {
        console.error("Failed to parse AI JSON", e)
      }
    }
    return { cleanText: rawText, lessonData: null }
  }

  async function loadHistory(sid) {
    try {
      const history = await api.getChatHistory(sid)
      if (history && history.messages && history.messages.length > 0) {
        const mappedMessages = history.messages.map(m => {
          const { cleanText, lessonData } = parseLessonPlan(m.content || m.text || '')
          return {
            role: m.role,
            text: cleanText,
            lessonData: lessonData
          }
        })
        setMessages(mappedMessages)
      }
    } catch (err) {
      console.error('Failed to load chat history', err)
    }
  }

  async function handleSend() {
    if (!input.trim() || sending) return

    const userMsg = { role: 'user', text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const response = await api.sendMessage(input, sessionId, settings)
      const rawText = response.response || response.reply || response.message
      const { cleanText, lessonData } = parseLessonPlan(rawText)
      
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        text: cleanText,
        lessonData: lessonData
      }])

      if (lessonData) {
        showToast('Lesson plan generated! You can now download the PDF.', 'info')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleDownloadPDF(lessonData) {
    try {
      showToast('Generating PDF...', 'info')
      await api.downloadLessonPDF(lessonData)
      showToast('Download started.', 'info')
    } catch (err) {
      showToast('Failed to generate PDF: ' + err.message, 'error')
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['.pdf', '.docx', '.txt', '.csv']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowedTypes.includes(ext)) {
      showToast('Unsupported file format. Please use PDF, DOCX, TXT, or CSV.', 'error')
      return
    }

    setUploading(true)
    const systemMsg = { 
      role: 'system', 
      text: `Uploading "${file.name}"...`,
      isUploading: true 
    }
    setMessages(prev => [...prev, systemMsg])

    try {
      const metadata = {
        grade: settings.uploadGrade,
        subject: settings.uploadSubject,
        topic: settings.uploadTopic,
        is_shared: settings.shareUploads
      }
      
      await api.uploadFile(file, sessionId, metadata)
      
      setMessages(prev => {
        const newMsgs = [...prev]
        const lastIdx = newMsgs.length - 1
        newMsgs[lastIdx] = { 
          role: 'system', 
          text: `✅ "${file.name}" uploaded successfully. Settings: ${settings.shareUploads ? 'Shared' : 'Private'}${settings.uploadTopic ? ` • ${settings.uploadTopic}` : ''}`,
          isUploading: false
        }
        return newMsgs
      })
      
      showToast('File uploaded successfully!', 'info')
      fetchDocuments()
    } catch (err) {
      setMessages(prev => prev.filter(m => !m.isUploading))
      showToast('Upload failed: ' + err.message, 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ailp-cream)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--ailp-olive)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--ailp-green)] font-bold text-lg">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[var(--ailp-cream)] flex flex-col overflow-hidden">
      <Navbar 
        isLoggedIn={isLoggedIn} 
        userName={userName} 
        onLogout={handleLogout}
        onOpenWorkspace={() => {}}
      />
      
      <main className="flex-1 pt-24 pb-6 px-4 md:px-6 max-w-[1400px] mx-auto w-full flex gap-6 overflow-hidden">
        
        {/* Chat Container */}
        <div className="flex-1 bg-white border border-[var(--ailp-border)] rounded-[32px] shadow-sm flex flex-col overflow-hidden relative">
          
          {/* Header */}
          <div className="px-8 py-5 border-b border-[var(--ailp-border)] flex items-center justify-between bg-white/50 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--ailp-cream)] rounded-xl flex items-center justify-center">
                <Sparkles className="text-[var(--ailp-green)] w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-[var(--ailp-green)] text-lg leading-tight">AI Planning Assistant</h1>
                <p className="text-[var(--ailp-dim)] text-xs font-medium">Powered by LessonLift AI</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "rounded-full gap-2 px-4 h-10 transition-colors",
                showSettings ? "bg-[var(--ailp-cream)] text-[var(--ailp-green)]" : "text-[var(--ailp-dim)]"
              )}
            >
              <Settings2 size={18} />
              <span className="text-xs font-bold hidden sm:inline">Settings</span>
            </Button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scroll-smooth"
          >
            {messages.map((msg, i) => {
              if (msg.role === 'system') {
                return (
                  <div key={i} className="flex justify-center">
                    <div className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2",
                      msg.isUploading ? "bg-[var(--ailp-cream)] text-[var(--ailp-dim)]" : "bg-[var(--ailp-olive)]/10 text-[var(--ailp-green)]"
                    )}>
                      {msg.isUploading && <Loader2 size={14} className="animate-spin" />}
                      {msg.text}
                    </div>
                  </div>
                )
              }

              return (
                <div key={i} className={cn(
                  "flex flex-col gap-2 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "p-5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-[var(--ailp-green)] text-white rounded-tr-none" 
                      : "bg-white border border-[var(--ailp-border)] text-[var(--ailp-green)] rounded-tl-none"
                  )}>
                    <div className={cn("prose prose-sm max-w-none", msg.role === 'user' ? "prose-invert" : "prose-green")}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Lesson Plan Card */}
                  {msg.lessonData && (
                    <div className="w-full mt-2 bg-[var(--ailp-cream)] border border-[var(--ailp-olive)]/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-[var(--ailp-olive)]/10">
                          <FileText className="text-[var(--ailp-olive)] w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--ailp-dim)] uppercase tracking-wider">Lesson Plan Ready</p>
                          <h4 className="font-extrabold text-[var(--ailp-green)] text-sm line-clamp-1">
                            {msg.lessonData.topic || 'New Lesson Plan'}
                          </h4>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleDownloadPDF(msg.lessonData)}
                        className="bg-[var(--ailp-green)] hover:bg-[var(--ailp-olive)] h-11 px-5 rounded-xl gap-2 shadow-sm shrink-0"
                      >
                        <Download size={18} />
                        <span className="text-xs font-bold">Download PDF</span>
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
            
            {sending && (
              <div className="flex items-start gap-3">
                <div className="bg-white border border-[var(--ailp-border)] text-[var(--ailp-green)] p-5 rounded-2xl rounded-tl-none text-sm animate-pulse flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[var(--ailp-olive)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-[var(--ailp-olive)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-[var(--ailp-olive)] rounded-full animate-bounce"></span>
                  </div>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 md:p-8 bg-white border-t border-[var(--ailp-border)]">
            <div className="relative flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt,.csv"
                hidden
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current.click()}
                disabled={sending || uploading}
                className="h-14 w-14 rounded-2xl bg-[var(--ailp-cream)] text-[var(--ailp-green)] hover:bg-[var(--ailp-olive)]/10"
              >
                <Paperclip size={22} />
              </Button>

              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Topic, standard, or specific lesson requirement..." 
                  className="w-full h-14 pl-6 pr-16 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-2xl outline-none focus:border-[var(--ailp-olive)] transition-all font-medium text-sm text-[var(--ailp-green)]"
                  disabled={sending}
                />
                <Button 
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="absolute right-2 top-2 h-10 w-10 p-0 bg-[var(--ailp-green)] hover:bg-[var(--ailp-olive)] rounded-xl transition-all"
                >
                  <Send size={18} className={cn(sending && "animate-pulse")} />
                </Button>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-center text-[var(--ailp-dim)] font-medium">
              Pro tip: Toggle <span className="text-[var(--ailp-green)]">Web Search</span> in settings for up-to-date educational resources.
            </p>
          </div>
        </div>

        {/* Sidebar Settings */}
        {showSettings && (
          <div className={cn(
            "w-80 bg-white border border-[var(--ailp-border)] rounded-[32px] p-8 shadow-sm flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300",
            "fixed inset-y-24 right-6 z-20 md:static md:inset-auto h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar"
          )}>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-[var(--ailp-green)] text-lg">Workspace</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="md:hidden">
                <Settings2 size={20} />
              </Button>
            </div>

            {/* Chat Behavior */}
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold text-[var(--ailp-dim)] uppercase tracking-widest">Chat Context</label>
              
              <div className="grid grid-cols-2 gap-2">
                {['Easy', 'Medium', 'Advanced', 'Olympiad'].map((level) => (
                  <Button
                    key={level}
                    variant="outline"
                    size="sm"
                    onClick={() => setSettings(s => ({ ...s, difficulty: level }))}
                    className={cn(
                      "rounded-xl h-9 font-bold text-[10px] transition-all",
                      settings.difficulty === level 
                        ? "bg-[var(--ailp-green)] text-white border-transparent" 
                        : "border-[var(--ailp-border)] text-[var(--ailp-dim)] hover:border-[var(--ailp-olive)]"
                    )}
                  >
                    {level}
                  </Button>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-[var(--ailp-olive)]" />
                    <span className="text-xs font-bold text-[var(--ailp-green)]">Web Search</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, useWebsearch: !s.useWebsearch }))}
                    className={cn("w-10 h-5 rounded-full relative transition-colors duration-200", settings.useWebsearch ? "bg-[var(--ailp-green)]" : "bg-gray-200")}
                  >
                    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200", settings.useWebsearch ? "right-1" : "left-1")} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={14} className="text-[var(--ailp-olive)]" />
                    <span className="text-xs font-bold text-[var(--ailp-green)]">Global DB</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, useGlobal: !s.useGlobal }))}
                    className={cn("w-10 h-5 rounded-full relative transition-colors duration-200", settings.useGlobal ? "bg-[var(--ailp-green)]" : "bg-gray-200")}
                  >
                    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200", settings.useGlobal ? "right-1" : "left-1")} />
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-[var(--ailp-border)]" />

            {/* Upload Settings */}
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold text-[var(--ailp-dim)] uppercase tracking-widest">Next Upload Settings</label>
              
              <div className="space-y-3">
                <div className="relative">
                  <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ailp-dim)]" />
                  <input 
                    type="text" 
                    placeholder="Grade..."
                    value={settings.uploadGrade}
                    onChange={(e) => setSettings(s => ({...s, uploadGrade: e.target.value}))}
                    className="w-full h-10 pl-9 pr-4 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-xl text-xs font-medium outline-none focus:border-[var(--ailp-olive)]"
                  />
                </div>
                <div className="relative">
                  <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ailp-dim)]" />
                  <input 
                    type="text" 
                    placeholder="Subject..."
                    value={settings.uploadSubject}
                    onChange={(e) => setSettings(s => ({...s, uploadSubject: e.target.value}))}
                    className="w-full h-10 pl-9 pr-4 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-xl text-xs font-medium outline-none focus:border-[var(--ailp-olive)]"
                  />
                </div>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ailp-dim)]" />
                  <input 
                    type="text" 
                    placeholder="Topic..."
                    value={settings.uploadTopic}
                    onChange={(e) => setSettings(s => ({...s, uploadTopic: e.target.value}))}
                    className="w-full h-10 pl-9 pr-4 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-xl text-xs font-medium outline-none focus:border-[var(--ailp-olive)]"
                  />
                </div>
                
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-[var(--ailp-green)] flex items-center gap-1.5">
                    <PlusCircle size={14} className="text-[var(--ailp-olive)]" />
                    Share to Global DB
                  </span>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, shareUploads: !s.shareUploads }))}
                    className={cn("w-10 h-5 rounded-full relative transition-colors duration-200", settings.shareUploads ? "bg-[var(--ailp-green)]" : "bg-gray-200")}
                  >
                    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200", settings.shareUploads ? "right-1" : "left-1")} />
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-[var(--ailp-border)]" />

            {/* My Documents */}
            <div className="flex-1 space-y-4">
              <label className="text-[10px] font-extrabold text-[var(--ailp-dim)] uppercase tracking-widest flex items-center justify-between">
                My Documents
                <span className="bg-[var(--ailp-cream)] px-2 py-0.5 rounded-full text-[var(--ailp-green)]">{documents.length}</span>
              </label>
              
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-[10px] text-[var(--ailp-dim)] italic text-center py-4 bg-[var(--ailp-cream)]/50 rounded-2xl border border-dashed border-[var(--ailp-border)]">
                    No documents uploaded yet.
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="group p-3 bg-white border border-[var(--ailp-border)] rounded-2xl hover:border-[var(--ailp-olive)] transition-all flex items-center gap-3">
                      <div className="w-8 h-8 bg-[var(--ailp-cream)] rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-[var(--ailp-green)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[var(--ailp-green)] truncate">{doc.filename}</p>
                        <p className="text-[8px] text-[var(--ailp-dim)] font-medium">
                          {doc.is_shared ? 'Public' : 'Private'} {doc.topic && `• ${doc.topic}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.is_shared && <CheckCircle2 size={12} className="text-[var(--ailp-olive)] shrink-0" />}
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--ailp-dim)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-auto bg-[var(--ailp-cream)] p-4 rounded-2xl border border-[var(--ailp-olive)]/10">
              <p className="text-[10px] leading-relaxed text-[var(--ailp-dim)] font-medium italic">
                Upload settings apply only to new files. Existing files can be managed from your profile.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function ChatPage() {
  return (
    <ToastProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--ailp-cream)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--ailp-olive)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--ailp-green)] font-bold text-lg">Loading workspace...</p>
          </div>
        </div>
      }>
        <ChatContent />
      </Suspense>
    </ToastProvider>
  )
}
