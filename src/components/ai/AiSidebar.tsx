'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

interface Message { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT = `Tu es un assistant academique expert integre a EduLib RDC, la premiere bibliotheque numerique universitaire de la Republique Democratique du Congo.

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

Regles de forme :
- Reponds toujours en francais academique clair et structure
- N'utilise JAMAIS de caracteres speciaux comme **, ##, *, _, ~, backtick
- Structure tes reponses en paragraphes separes par une ligne vide
- Utilise des tirets simples (-) pour les listes
- Termine toujours tes phrases completement
- Minimum 4 phrases par reponse, sois complet et substantiel
- Tu connais : UNIKIN, UNILU, UNIGOM, UCB, UNIKIS, UCC, ULPGL
- Tu connais le systeme LMD applique en RDC, le CAMES, les programmes universitaires congolais

Informations sur EduLib RDC - FAITS EXACTS :
- EduLib RDC est la premiere bibliotheque numerique universitaire de la Republique Democratique du Congo
- Fondee et developpee par Serge Makola, juriste diplome de l Universite de Kinshasa, specialiste en droit international public
- Co-gestionnaire : Gloire Kisanga Josias, responsable du contenu et des publications
- Siege : Kinshasa, Republique Democratique du Congo
- Contact : contact@edulibrdc.com | +243 840 021 963
- Mission : democratiser l acces aux ressources pedagogiques et scientifiques pour les etudiants, enseignants et chercheurs congolais
- La plateforme propose des ouvrages, syllabus, articles scientifiques, jurisprudences, notes de cours, examens et exercices
- Les filieres couvertes : Droit, Medecine, Polytechnique, Sciences, Lettres, Economie, Psychologie, Criminologie et autres`

export default function AiSidebar() {
  const { currentUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<{name: string, base64: string, type: string} | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Charger historique depuis Firestore
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

  // Sauvegarder historique dans Firestore
  async function saveHistory(msgs: Message[]) {
    if (!currentUser) return
    try {
      await setDoc(doc(db, 'ai_history', currentUser.uid), { messages: msgs.slice(-30), updatedAt: Date.now() }, { merge: true })
    } catch {}
  }

  useEffect(() => {
    if (open && !minimized) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, minimized])

  useEffect(() => {
    if (open && !minimized && messages.length === 0 && currentUser && historyLoaded) {
      const name = currentUser?.name?.split(' ')[0]
      const welcome: Message = { role: 'assistant', content: name ? 'Bonjour ' + name + ' ! Je suis ton assistant academique EduLib RDC. Comment puis-je t\'aider dans tes etudes aujourd\'hui ?' : 'Bonjour ! Je suis l\'assistant academique d\'EduLib RDC. Pose-moi tes questions sur tes cours ou tes recherches.' }
      setMessages([welcome])
    }
  }, [open, currentUser, messages.length, minimized, historyLoaded])

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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connexion impossible. Verifie ta connexion internet et reessaie.' }])
    } finally { setLoading(false) }
  }

  function clearHistory() {
    setMessages([])
    setHistoryLoaded(false)
    if (currentUser) {
      setDoc(doc(db, 'ai_history', currentUser.uid), { messages: [], updatedAt: Date.now() })
    }
  }

  if (!mounted) return null

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 900, width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', cursor: 'pointer', fontSize: '1.4rem', boxShadow: '0 4px 20px rgba(37,99,235,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</button>
      )}
      {open && (
        <div style={{ position: 'fixed', bottom: 20, right: 16, zIndex: 900, width: 'min(370px, calc(100vw - 32px))', height: minimized ? 58 : 'min(540px, calc(100vh - 100px))', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', transition: 'height 0.25s ease' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'pointer' }} onClick={() => setMinimized(!minimized)}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>Assistant EduLib</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Propulse par Mistral AI</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {currentUser && messages.length > 1 && (
                <button onClick={e => { e.stopPropagation(); clearHistory() }} title="Effacer l'historique" style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>🗑</button>
              )}
              <button onClick={e => { e.stopPropagation(); setMinimized(!minimized) }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>{minimized ? '▲' : '▼'}</button>
              <button onClick={e => { e.stopPropagation(); setOpen(false); setMinimized(false) }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
            </div>
          </div>

          {!minimized && (
            <>
              {!currentUser ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', textAlign: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2.5rem' }}>🔒</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>Connexion requise</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Connecte-toi pour acceder a l&apos;assistant academique EduLib RDC.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <Link href="/login" onClick={() => setOpen(false)} style={{ background: 'var(--blue)', color: '#fff', borderRadius: 10, padding: '11px', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>Se connecter</Link>
                    <Link href="/register" onClick={() => setOpen(false)} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)', borderRadius: 10, padding: '11px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Creer un compte gratuit</Link>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '84%', background: msg.role === 'user' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'var(--surface-2)', color: msg.role === 'user' ? '#fff' : 'var(--ink)', border: msg.role === 'user' ? 'none' : '1px solid var(--border)', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', fontSize: '0.84rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' as const }}>
                          {msg.content.split('\n').map((line, j) => (
                            <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', padding: '10px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: 'bounce 1.2s ease-in-out ' + (i*0.2) + 's infinite' }} />)}
                          <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-4px);opacity:1}}`}</style>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  {messages.length <= 1 && (
                    <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {['Comment reussir mes examens ?', 'Explique le droit constitutionnel', 'Aide-moi a faire des recherches'].map(s => (
                        <button key={s} onClick={() => setInput(s)} style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 99, padding: '5px 11px', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
                      ))}
                    </div>
                  )}
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' as const, gap: 8, flexShrink: 0 }}>
                    {uploadedFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--blue-light)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '6px 10px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--blue)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>📎 {uploadedFile.name}</span>
                        <button onClick={() => setUploadedFile(null)} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}>✕</button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx" onChange={handleFile} style={{ display: 'none' }} />
                      <button onClick={() => fileInputRef.current?.click()} title="Joindre un fichier" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📎</button>
                      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={uploadedFile ? 'Que veux-tu savoir sur ce fichier ?' : 'Pose ta question...'} disabled={loading} style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }} />
                      <button onClick={sendMessage} disabled={(!input.trim() && !uploadedFile) || loading} style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: (input.trim() || uploadedFile) && !loading ? 'var(--blue)' : 'var(--border)', border: 'none', cursor: (input.trim() || uploadedFile) && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>➤</button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
