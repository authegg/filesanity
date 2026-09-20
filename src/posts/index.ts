import type { ComponentType } from 'react'
import * as checklist from './before-you-send-a-file-to-a-stranger'
import * as browser from './why-the-file-never-leaves-the-browser'
import * as jpeg from './what-a-jpeg-carries'
import * as office from './what-office-documents-carry'
import * as pdf from './what-a-pdf-carries'

export type PostMeta = { slug: string; title: string; description: string; date: string; updated?: string; readingMinutes: number }
export type Post = { meta: PostMeta; default: ComponentType }

/** Newest first. A post is a module exporting `meta` and a body component; nothing is fetched or parsed at runtime. */
export const POSTS: Post[] = [checklist, browser, jpeg, office, pdf].sort((a, b) => b.meta.date.localeCompare(a.meta.date))

export const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
