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
- Adapte la longueur de ta reponse au contexte : pour un simple bonjour ou une question courte, reponds brievement ; pour une question academique complexe, sois complet et substantiel
- Tu connais : UNIKIN, UNILU, UNIGOM, UCB, UNIKIS, UCC, ULPGL
- Tu connais le systeme LMD applique en RDC, le CAMES, les programmes universitaires congolais`

export default function AssistantPage() {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<{ name: string, base64: string, type: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!currentUser || historyLoaded) return
    async function loadHistory() {
      try {
        const snap = await getDoc(doc(db, 'ai_history', currentUser!.uid))
        if (snap.exists()) {
          const saved = snap.data().messages as Message[]
          if (saved?.length > 0) setMessages(saved)
        }
      } catch {}
      setHistoryLoaded(true)
    }
    loadHistory()
  }, [currentUser, historyLoaded])

  useEffect(() => {
    if (messages.length === 0 && currentUser && historyLoaded) {
      const name = currentUser?.name?.split(' ')[0]
      setMessages([{ role: 'assistant', content: name ? 'Bonjour ' + name + ' ! Je suis ton assistant academique EduLib RDC. Comment puis-je t\'aider ?' : 'Bonjour ! Je suis l\'assistant academique d\'EduLib RDC.' }])
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
              { type: 'text', text: text || 'Explique ce fichier en detail.' }
            ] : [
              { type: 'text', text: 'Fichier: ' + uploadedFile.name + '\n\n' + atob(uploadedFile.base64).slice(0, 3000) + '\n\n' + (text || 'Explique ce contenu en detail.') }
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
    if (currentUser) {
      setDoc(doc(db, 'ai_history', currentUser.uid), { messages: [], updatedAt: Date.now() })
    }
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 380, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🔒</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--ink)' }}>Connexion requise</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>Connecte-toi pour acceder a l&apos;assistant academique EduLib RDC.</p>
            <Link href="/login" style={{ background: 'var(--blue)', color: '#fff', borderRadius: 10, padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
            <Link href="/register" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)', borderRadius: 10, padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>Creer un compte gratuit</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ flex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🤖</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>Assistant EduLib</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Propulsé par Mistral AI · Recherche web activée</div>
            </div>
          </div>
          {messages.length > 1 && (
            <button onClick={clearHistory} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Effacer</button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, minHeight: '60vh', maxHeight: '65vh' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0, marginTop: 2 }}>🤖</div>
              )}
              <div style={{
                maxWidth: '78%',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'var(--surface-2)',
                color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '12px 16px',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap' as const,
              }}>
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
              {msg.role === 'user' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, marginTop: 2 }}>{currentUser.name.charAt(0)}</div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>🤖</div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', animation: 'bounce 1.2s ease-in-out ' + (i * 0.2) + 's infinite' }} />)}
                <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}`}</style>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {['Explique le droit constitutionnel congolais', 'Qu\'est-ce que le droit OHADA ?', 'Comment rédiger un mémoire ?', 'Qu\'est-ce que EduLib RDC ?'].map(s => (
              <button key={s} onClick={() => setInput(s)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, padding: '7px 14px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)' }}>{s}</button>
            ))}
          </div>
        )}

        {/* Zone de saisie */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {uploadedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--blue-light)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '6px 12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--blue)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>📎 {uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx" onChange={handleFile} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📎</button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Pose ta question academique... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
              disabled={loading}
              rows={1}
              style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'none', minHeight: 42, maxHeight: 120, overflowY: 'auto' }}
            />
            <button onClick={sendMessage} disabled={(!input.trim() && !uploadedFile) || loading} style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: (input.trim() || uploadedFile) && !loading ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'var(--border)', border: 'none', cursor: (input.trim() || uploadedFile) && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#fff' }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  )
}
