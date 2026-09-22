'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function escapeSearchTerm(value) {
  return value.replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatLabel(value) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function SupervisorSearchContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const searchQuery = searchParams.get('q') || ''
    setQuery(searchQuery)
    if (searchQuery.trim()) search(searchQuery)
    else setLoading(false)
  }, [searchParams])

  async function search(value) {
    setLoading(true)
    setError('')
    const term = escapeSearchTerm(value)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be signed in to search.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.cooperative_id) {
      setError('Unable to determine your cooperative.')
      setLoading(false)
      return
    }

    const pattern = `%${term}%`
    const userType = term.toLowerCase()
    const userTypeFilter = ['supervisor', 'lineman', 'consumer'].includes(userType)
      ? `,user_type.eq.${userType}`
      : ''
    const faqCategory = ['billing', 'technical', 'outages'].includes(userType)
      ? `,category.eq.${userType}`
      : ''
    const [
      reportsResponse,
      masterTicketsResponse,
      usersResponse,
      advisoriesResponse,
      faqEntriesResponse,
    ] = await Promise.all([
      supabase
        .from('reports')
        .select('report_id, ticket_number, status, priority, nearest_landmark, barangay, municipality')
        .eq('cooperative_id', profile.cooperative_id)
        .or(`ticket_number.ilike.${pattern},nearest_landmark.ilike.${pattern},barangay.ilike.${pattern},municipality.ilike.${pattern}`)
        .limit(25),
      supabase
        .from('master_tickets')
        .select('master_id, master_ticket, status, priority, barangay, municipality')
        .eq('cooperative_id', profile.cooperative_id)
        .or(`master_ticket.ilike.${pattern},barangay.ilike.${pattern},municipality.ilike.${pattern}`)
        .limit(25),
      supabase
        .from('users')
        .select('id, first_name, last_name, user_type, is_active')
        .eq('cooperative_id', profile.cooperative_id)
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}${userTypeFilter}`)
        .limit(25),
      supabase
        .from('advisories')
        .select('advisory_id, title, description, date')
        .eq('cooperative_id', profile.cooperative_id)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .limit(25),
      supabase
        .from('faq_entries')
        .select('faq_id, category, question, answer')
        .eq('cooperative_id', profile.cooperative_id)
        .or(`question.ilike.${pattern},answer.ilike.${pattern}${faqCategory}`)
        .limit(25),
    ])

    const firstError =
      reportsResponse.error ||
      masterTicketsResponse.error ||
      usersResponse.error ||
      advisoriesResponse.error ||
      faqEntriesResponse.error
    if (firstError) setError(firstError.message)

    setResults([
      ...(reportsResponse.data || []).map((report) => ({
        id: report.report_id,
        title: report.ticket_number || report.report_id,
        subtitle: report.nearest_landmark || `${report.barangay}, ${report.municipality}`,
        meta: `${formatLabel(report.status)}${report.priority ? ` · ${formatLabel(report.priority)} priority` : ''}`,
        type: 'Report',
        href: `/supervisor/dispatch/report/${report.report_id}`,
      })),
      ...(masterTicketsResponse.data || []).map((ticket) => ({
        id: ticket.master_id,
        title: ticket.master_ticket || ticket.master_id,
        subtitle: `${ticket.barangay}, ${ticket.municipality}`,
        meta: `${formatLabel(ticket.status)}${ticket.priority ? ` · ${formatLabel(ticket.priority)} priority` : ''}`,
        type: 'Master ticket',
        href: `/supervisor/dispatch/master/${ticket.master_id}`,
      })),
      ...(usersResponse.data || []).map((person) => ({
        id: person.id,
        title: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
        subtitle: person.is_active ? 'Active account' : 'Inactive account',
        meta: formatLabel(person.user_type),
        type: 'User',
        href: '/supervisor/users',
      })),
      ...(advisoriesResponse.data || []).map((advisory) => ({
        id: advisory.advisory_id,
        title: advisory.title,
        subtitle: advisory.description || `Scheduled for ${advisory.date}`,
        meta: 'Advisory',
        type: 'Advisory',
        href: '/supervisor/advisories',
      })),
      ...(faqEntriesResponse.data || []).map((entry) => ({
        id: entry.faq_id,
        title: entry.question,
        subtitle: entry.answer,
        meta: formatLabel(entry.category),
        type: 'FAQ',
        href: '/supervisor/faq',
      })),
    ])
    setLoading(false)
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Search results</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        {query ? `Results for "${query}"` : 'Enter a search term in the top bar.'}
      </p>

      {error && <p className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Searching...</p>}
      {!loading && !error && query && results.length === 0 && (
        <p className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500">No reports, tickets, or users matched your search.</p>
      )}
      {!loading && results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {results.map((result) => (
            <Link key={`${result.type}-${result.id}`} href={result.href} className="block border-b border-gray-100 px-5 py-4 last:border-0 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{result.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{result.subtitle}</p>
                  <p className="mt-1 text-xs text-gray-400">{result.meta}</p>
                </div>
                <span className="shrink-0 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{result.type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SupervisorSearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading search...</p>}>
      <SupervisorSearchContent />
    </Suspense>
  )
}