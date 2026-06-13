export interface Doc {
  id: string
  title: string
  filiere: string
  type: string
  professeur: string
  prix: number
  driveLink: string
  description?: string
  annee?: string
  createdAt: number
  downloads?: number
}

export interface User {
  uid: string
  name: string
  email: string
  role: 'Étudiant' | 'Enseignant' | 'Chercheur'
  filiere: string
  boughtIds: string[]
  createdAt: number
}

export interface Order {
  id: string
  userId: string
  userName: string
  userEmail: string
  items: { id: string; title: string; prix: number }[]
  total: number
  status: 'En attente de paiement' | 'Payé' | 'Annulé'
  createdAt: any
}

export interface PublicStats {
  userCount: number
}

export type DocType =
  | 'Ouvrage'
  | 'Article scientifique'
  | 'Loi'
  | 'Jurisprudence'
  | 'Syllabus'
  | 'Notes de cours'
  | 'Exercice'
  | 'Examen'

export const FILIERES = [
  { slug: 'droit', label: 'Droit', emoji: '⚖️' },
  { slug: 'medecine', label: 'Médecine', emoji: '🏥' },
  { slug: 'informatique', label: 'Informatique', emoji: '💻' },
  { slug: 'economie', label: 'Économie', emoji: '📊' },
  { slug: 'lettres', label: 'Lettres & Sciences Humaines', emoji: '📖' },
  { slug: 'sciences', label: 'Sciences', emoji: '🔬' },
  { slug: 'pharmacie', label: 'Pharmacie', emoji: '💊' },
  { slug: 'polytechnique', label: 'Polytechnique', emoji: '⚙️' },
  { slug: 'agronomie', label: 'Agronomie', emoji: '🌱' },
  { slug: 'psychologie', label: 'Psychologie', emoji: '🧠' },
  { slug: 'communication', label: 'Communication', emoji: '📡' },
  { slug: 'architecture', label: 'Architecture', emoji: '🏛️' },
  { slug: 'criminologie', label: 'Criminologie', emoji: '🔍' },
] as const

export const DOC_TYPES: DocType[] = [
  'Ouvrage',
  'Article scientifique',
  'Loi',
  'Jurisprudence',
  'Syllabus',
  'Notes de cours',
  'Exercice',
  'Examen',
]
