'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `Tu es un assistant académique congolais intégré à EduLib RDC, la première bibliothèque numérique universitaire de la République Démocratique du Congo.

Ton rôle :
- Aider les étudiants congolais dans leurs études (droit, médecine, informatique, économie, etc.)
- Expliquer des concepts académiques avec des exemples adaptés au contexte congolais
- Orienter les étudiants vers les bons documents sur la plateforme
- Répondre en français principalement, en lingala ou kikongo si l'étudiant le demande

Ton ton : bienveillant, pédagogique, direct. Tu t'adresses à des étudiants africains motivés.
Tu connais le contexte de Kinshasa, les universités congolaises (UNIKIN, UNILU, UNIGOM, etc.).
Reste concis — les étudiants consultent depuis mobile avec une connexion limitée.`

export default function AiSidebar() {
  const { currentUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, minimized])

  useEffect(() => {
    if (open && !minimized && messages.length === 0) {
      const greeting = currentUser
        ? `Bonjour ${currentUser.name.split(' ')[0]} 👋 Je suis ton assistant académique EduLib. Comment puis-je t'aider dans tes études ?`
        : `Bonjour 👋 Je suis l'assistant académique d'EduLib RDC. Pose-moi tes questions sur tes cours, tes recherches ou la plateforme.`
      setMessages([{ role: 'assistant', content: greeting }])
    }
  }, [open, currentUser])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      })
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content || 'Désolé, je n\'ai pas pu répondre.' }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Connexion impossible. Vérifie ta connexion internet et réessaie.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([])
    setTimeout(() => {
      if (currentUser) {
        setMessages([{ role: 'assistant', content: `Chat réinitialisé. Comment puis-je t'aider, ${currentUser.name.split(' ')[0]} ?` }])
      } else {
        setMessages([{ role: 'assistant', content: 'Chat réinitialisé. Quelle est ta question ?' }])
      }
    }, 100)
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Ouvrir l'assistant IA" style={{
          position: 'fixed', bottom: 24, right: 20, zIndex: 900,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
          transition: 'all 0.2s',
        }}>🤖</button>
      )}

      {open && (
        <div style={{
          position: 'fixed', bottom: 20, right: 16, zIndex: 900,
          width: 'min(360px, calc(100vw - 32px))',
          height: minimized ? 56 : 'min(520px, calc(100vh - 100px))',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          transition: 'height 0.25s ease',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0, cursor: 'pointer',
          }} onClick={() => setMinimized(!minimized)}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', flexShrink: 0,
            }}>🤖</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>Assistant EduLib</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>Propulsé par Mistral AI</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {!minimized && (
                <button onClick={e => { e.stopPropagation(); clearChat() }} style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  color: 'rgba(255,255,255,0.5)', borderRadius: 6,
                  padding: '4px 8px', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit',
                }}>🔄</button>
              )}
              <button onClick={e => { e.stopPropagation(); setMinimized(!minimized) }} style={{
                background: 'rgba(255,255,255,0.08)', border: 'none',
                color: 'rgba(255,255,255,0.5)', borderRadius: 6,
                padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer',
              }}>{minimized ? '▲' : '▼'}</button>
              <button onClick={e => { e.stopPropagation(); setOpen(false); setMinimized(false) }} style={{
                background: 'rgba(255,255,255,0.08)', border: 'none',
                color: 'rgba(255,255,255,0.5)', borderRadius: 6,
                padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer',
              }}>✕</button>
            </div>
          </div>

          {!minimized && (
            <>
              <div style={{
                flex: 1, overflowY: 'auto', padding: '12px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '82%',
                      background: msg.role === 'user' ? 'var(--blue)' : 'var(--surface-2)',
                      color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      padding: '9px 12px', fontSize: '0.83rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    }}>{msg.content}</div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: '14px 14px 14px 4px',
                      padding: '10px 14px', display: 'flex', gap: 5, alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'var(--text-muted)',
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                      <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-4px); opacity: 1; } }`}</style>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length <= 1 && (
                <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Comment réussir mes examens ?', 'Explique le droit constitutionnel', 'Chercher un document'].map(s => (
                    <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }} style={{
                      background: 'var(--blue-light)', color: 'var(--blue)',
                      border: '1px solid rgba(37,99,235,0.2)',
                      borderRadius: 99, padding: '4px 10px',
                      fontSize: '0.72rem', fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>{s}</button>
                  ))}
                </div>
              )}

              <div style={{
                padding: '10px 12px', borderTop: '1px solid var(--border)',
                display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
              }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey} placeholder="Pose ta question..." rows={1} disabled={loading}
                  style={{
                    flex: 1, resize: 'none', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '9px 12px',
                    background: 'var(--surface-2)', color: 'var(--ink)',
                    fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
                    lineHeight: 1.5, maxHeight: 100, overflowY: 'auto',
                  }} />
                <button onClick={sendMessage} disabled={!input.trim() || loading} style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: input.trim() && !loading ? 'var(--blue)' : 'var(--border)',
                  border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', transition: 'background 0.15s',
                }}>{loading ? '⏳' : '➤'}</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
