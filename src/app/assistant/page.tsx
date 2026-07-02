'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import Navbar from '@/components/layout/Navbar'

interface Message { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT = `Tu es un assistant academique expert integre a EduLib RDC.

INFORMATIONS EXACTES SUR EDULIB RDC - NE JAMAIS INVENTER D AUTRES INFORMATIONS :
- Nom complet : EduLib RDC
- Fondateur et developpeur : Serge Makola, juriste diplome de l Universite de Kinshasa, specialiste en droit international public
- Co-gestionnaire : Gloire Kisanga Josias, responsable du contenu et des publications
- Siege : Kinshasa, Republique Democratique du Congo
- Contact : contact@edulibrdc.com | +243 840 021 963
- Mission : premiere bibliotheque numerique universitaire de la RDC, democratiser l acces aux ressources pedagogiques
- Si on te demande qui a cree EduLib RDC, reponds toujours : Serge Makola
- Si on te demande qui gere EduLib RDC, cite Serge Makola et Gloire Kisanga Josias

Tu es specialise dans le droit congolais, les sciences, la medecine, la polytechnique, les lettres et toutes les disciplines universitaires enseignees en RDC.

Regles de fond - PRIORITE ABSOLUE :
- Donne des reponses precises, rigoureuses et academiquement correctes
- Cite des principes juridiques, theoremes, concepts exacts selon la discipline
- Pour le droit : cite les articles de loi congolais pertinents, la jurisprudence, la doctrine
- Pour les sciences : donne des formules, demonstrations, explications rigoureuses
- Ne jamais approximer ou generaliser si une reponse precise existe
- Si tu n'es pas certain d'un fait precis, dis-le clairement plutot que d'inventer
- Adapte le niveau de ta reponse au contexte academique universitaire congolais
- Reference les sources quand c'est pertinent : Constitution du 18 fevrier 2006, codes congolais, auteurs congolais
- Utilise la recherche web pour verifier les faits actuels avant de repondre

Regles de forme :
- Reponds toujours en francais academique clair et structure
- N'utilise JAMAIS de caracteres speciaux comme **, ##, *, _, ~, backtick
- Structure tes reponses en paragraphes separes par une ligne vide
- Utilise des tirets simples (-) pour les listes
- Adapte la longueur de ta reponse au contexte
- Tu connais : UNIKIN, UNILU, UNIGOM, UCB, UNIKIS, UCC, ULPGL
- Tu connais le systeme LMD applique en RDC, le CAMES, les programmes universitaires congolais`

const SUGGESTIONS = [
  'Explique le droit constitutionnel congolais',
  'Qu\'est-ce que le droit OHADA ?',
  'Comment rédiger un mémoire ?',
  'Qu\'est-ce que EduLib RDC ?',
]

export default function AssistantPage() {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [uploadedFile, setUploadedFile] = useState<{ name: string, base64: string, type: string } | null>(null)

  useEffect(() => {
    if (!currentUser || historyLoaded) return
    async function loadHistory() {
      try {
        const snap = await getDoc(doc(db, 'ai_history', currentUser!.uid))
        if (snap.exists()) {
          const saved = snap.data().messages as Message[]
          if (saved?.length > 0) { setMessages(saved); setHistoryLoaded(true); return }
        }
      } catch {}
      setHistoryLoaded(true)
    }
    loadHistory()
  }, [currentUser, historyLoaded])

  useEffect(() => {
    if (messages.length === 0 && currentUser && historyLoaded) {
      const name = currentUser?.name?.split(' ')[0]
      setMessages([{ role: 'assistant', content: name ? 'Bonjour ' + name + ' ! Comment puis-je t\'aider aujourd\'hui ?' : 'Bonjour ! Comment puis-je vous aider ?' }])
    }
  }, [currentUser, historyLoaded, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function saveHistory(msgs: Message[]) {
    if (!currentUser) return
    try {
      await setDoc(doc(db, 'ai_history', currentUser.uid), { messages: msgs.slice(-30), updatedAt: Date.now() }, { merge: true })
    } catch {}
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setUploadedFile({ name: file.name, base64, type: file.type })
    }
    reader.readAsDataURL(file)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const apiMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...newMessages.slice(-8)]
      if (uploadedFile) {
        const lastUserIdx = apiMessages.map(m => m.role).lastIndexOf('user')
        if (lastUserIdx !== -1) {
          const isImage = uploadedFile.type.startsWith('image/')
          apiMessages[lastUserIdx] = {
            role: 'user',
            content: isImage ? [
              { type: 'image_url', image_url: { url: 'data:' + uploadedFile.type + ';base64,' + uploadedFile.base64 } },
              { type: 'text', text: text || 'Explique ce fichier.' }
            ] : [
              { type: 'text', text: 'Fichier: ' + uploadedFile.name + '\n\n' + atob(uploadedFile.base64).slice(0, 3000) + '\n\n' + (text || 'Explique ce contenu.') }
            ]
          } as any
        }
        setUploadedFile(null)
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })
      const data = await res.json()
      const raw = data.content || 'Je suis desole, je ne peux pas repondre pour le moment.'
      const content = raw.replace(/[*_~`#>]/g, '').replace(/\n{3,}/g, '\n\n').replace(/^-\s+/gm, '- ').trim()
      const updated = [...newMessages, { role: 'assistant' as const, content }]
      setMessages(updated)
      saveHistory(updated)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connexion impossible. Verifie ta connexion internet.' }])
    } finally { setLoading(false) }
  }

  function clearHistory() {
    setMessages([])
    setHistoryLoaded(false)
    if (currentUser) setDoc(doc(db, 'ai_history', currentUser.uid), { messages: [], updatedAt: Date.now() })
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 380, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', border: '1px solid var(--border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🤖</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--ink)' }}>Assistant EduLib RDC</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>Connecte-toi pour acceder a ton assistant academique personnel.</p>
            <Link href="/login" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', borderRadius: 10, padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', width: '100%', textAlign: 'center', boxSizing: 'border-box' as const }}>Se connecter</Link>
            <Link href="/register" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)', borderRadius: 10, padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', width: '100%', textAlign: 'center', boxSizing: 'border-box' as const }}>Creer un compte gratuit</Link>
          </div>
        </div>
      </div>
    )
  }

  const showSuggestions = messages.length <= 1

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)', overflow: 'hidden' }}>
      <Navbar />

      {/* Layout principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 800, width: '100%', margin: '0 auto', padding: '0 1rem' }}>

        {/* Zone messages — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '1.5rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Accueil quand pas de messages */}
          {showSuggestions && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '3rem', paddingBottom: '2rem', gap: '1.5rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 32px rgba(37,99,235,0.3)' }}>🤖</div>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                  Bonjour, {currentUser.name.split(' ')[0]} 👋
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Assistant académique EduLib RDC · Propulsé par Mistral AI</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.75rem', width: '100%', maxWidth: 600 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => { setInput(s); setTimeout(() => sendMessage(), 100) }}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.875rem 1rem', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)', textAlign: 'left', lineHeight: 1.4, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-light)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.filter(m => !(showSuggestions && m.role === 'assistant')).map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: msg.role === 'assistant' ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'linear-gradient(135deg, #0891b2, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: msg.role === 'assistant' ? '1rem' : '0.85rem', color: '#fff', fontWeight: 700 }}>
                {msg.role === 'assistant' ? '🤖' : currentUser.name.charAt(0).toUpperCase()}
              </div>
              {/* Bulle */}
              <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, paddingLeft: msg.role === 'user' ? 0 : 4, paddingRight: msg.role === 'user' ? 4 : 0, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.role === 'assistant' ? 'Assistant EduLib' : currentUser.name.split(' ')[0]}
                </div>
                <div style={{
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'var(--surface)',
                  color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  lineHeight: 1.75,
                  whiteSpace: 'pre-wrap' as const,
                  boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.06)' : '0 2px 8px rgba(37,99,235,0.2)',
                }}>
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Animation chargement */}
          {loading && (
            <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>🤖</div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px 18px 18px 18px', padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', animation: 'pulse 1.4s ease-in-out ' + (i * 0.2) + 's infinite' }} />
                ))}
                <style>{`@keyframes pulse{0%,100%{transform:scale(0.7);opacity:0.4}50%{transform:scale(1);opacity:1}}`}</style>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Zone saisie — fixe en bas */}
        <div style={{ paddingBottom: '1rem', flexShrink: 0 }}>
          {uploadedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--blue-light)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, padding: '8px 14px', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--blue)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>📎 {uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>✕</button>
            </div>
          )}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '0.75rem', display: 'flex', gap: 10, alignItems: 'flex-end', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx" onChange={handleFile} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'var(--text-muted)' }}>📎</button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Pose ta question académique... (Entrée pour envoyer)"
              disabled={loading}
              rows={1}
              style={{ flex: 1, border: 'none', borderRadius: 0, padding: '8px 4px', background: 'transparent', color: 'var(--ink)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'none', minHeight: 38, maxHeight: 140, overflowY: 'auto', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              {messages.length > 1 && (
                <button onClick={clearHistory} title="Effacer la conversation" style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🗑</button>
              )}
              <button onClick={sendMessage} disabled={(!input.trim() && !uploadedFile) || loading} style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: (input.trim() || uploadedFile) && !loading ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'var(--border)', border: 'none', cursor: (input.trim() || uploadedFile) && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff', transition: 'all 0.15s' }}>➤</button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Assistant EduLib RDC · Mistral AI · Recherche web activée
          </p>
        </div>
      </div>
    </div>
  )
}
