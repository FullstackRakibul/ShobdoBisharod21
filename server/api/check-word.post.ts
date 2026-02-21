import { foreignWords } from '../data/foreign-words'
import { pureWords } from '../data/pure-words'

interface CheckWordResponse {
    word: string
    valid: boolean
    type: 'pure' | 'foreign' | 'unknown' | 'invalid'
    reason: string
}

/**
 * Normalize Bengali text for consistent matching.
 * - Applies Unicode NFC normalization (handles composed/decomposed chars)
 * - Strips zero-width joiners/non-joiners that can cause invisible mismatches
 */
function normalizeBangla(text: string): string {
    return text
        .normalize('NFC')
        .replace(/[\u200C\u200D]/g, '') // remove ZWJ / ZWNJ
        .trim()
}

/**
 * Foreign-origin language markers.
 * Only used to reject a word when NO pure marker is present.
 */
const FOREIGN_MARKERS = [
    'বিদেশী', 'বিদেশি',
    'আরবি', 'আরবী',
    'ফার্সি', 'ফারসি', 'ফার্সী',
    'ইংরেজি', 'ইংরেজী',
    'পর্তুগিজ', 'পর্তুগীজ',
    'বর্মী', 'বর্মি',
    'তুর্কি', 'তুর্কী',
    'হিন্দি', 'হিন্দী',
    'উর্দু',
    'ফরাসি', 'ফরাসী',
    'ওলন্দাজ',
    'জাপানি', 'জাপানী',
    'চীনা',
    'মালয়',
    'গ্রিক',
    'লাতিন',
]

/**
 * Pure-origin (Bangla/Sanskrit) markers — checked FIRST (priority).
 * If any of these appear, the word is accepted even if foreign markers
 * exist elsewhere on the page (those are typically translations/comparisons).
 */
const PURE_MARKERS = [
    'তৎসম',
    'তদ্ভব',
    'সংস্কৃত',
    'প্রাকৃত',
    'বাংলা',
    'দেশি', 'দেশী',
    'অর্ধতৎসম',
]

/**
 * Regex to extract the etymology / ব্যুৎপত্তি section from Wiktionary wikitext.
 * Captures everything between the etymology heading and the next section heading.
 */
const ETYMOLOGY_SECTION_REGEX = /ব্যুৎপত্তি[^\n]*\n([\s\S]*?)(?=\n==|\n\{\{|$)/

/**
 * Check markers in a given text. Returns the first matched marker or null.
 */
function findMarker(text: string, markers: string[]): string | null {
    const normalizedText = normalizeBangla(text)
    for (const marker of markers) {
        if (normalizedText.includes(normalizeBangla(marker))) {
            return marker
        }
    }
    return null
}

/**
 * Analyze Wiktionary page content with Pure-First priority.
 *
 * Strategy:
 *   1. Try to extract the etymology section specifically.
 *   2. Check PURE markers first — if found, accept immediately.
 *      (Foreign markers like 'ইংরেজি' often appear as translations, not origins.)
 *   3. Only then check FOREIGN markers — reject only if no pure marker exists.
 *   4. If no clear etymology, return null (caller decides).
 */
function analyzeEtymology(content: string): { type: 'pure' | 'foreign'; reason: string } | null {
    // Try to isolate the etymology section for more targeted matching
    const etymologyMatch = content.match(ETYMOLOGY_SECTION_REGEX)
    const etymologySection = etymologyMatch ? etymologyMatch[1] : null

    // --- PURE CHECK FIRST (priority) ---
    // If a pure-origin marker exists, the word is accepted regardless
    // of foreign markers elsewhere (those are typically translations).
    const pureInEtymology = etymologySection ? findMarker(etymologySection, PURE_MARKERS) : null
    const pureInContent = findMarker(content, PURE_MARKERS)
    const pureMarker = pureInEtymology || pureInContent

    if (pureMarker) {
        return {
            type: 'pure',
            reason: `খাঁটি বাংলা শব্দ — "${pureMarker}" (উইকিশব্দকোষ)`,
        }
    }

    // --- FOREIGN CHECK SECOND (fallback) ---
    // Only reject if NO pure marker was found above.
    const foreignInEtymology = etymologySection ? findMarker(etymologySection, FOREIGN_MARKERS) : null
    const foreignInContent = findMarker(content, FOREIGN_MARKERS)
    const foreignMarker = foreignInEtymology || foreignInContent

    if (foreignMarker) {
        return {
            type: 'foreign',
            reason: `বিদেশী উৎসের শব্দ — "${foreignMarker}" (উইকিশব্দকোষ)`,
        }
    }

    return null
}

export default defineEventHandler(async (event): Promise<CheckWordResponse> => {
    const { word } = await readBody<{ word: string }>(event)

    if (!word || typeof word !== 'string') {
        return {
            word: word || '',
            valid: false,
            type: 'invalid',
            reason: 'শব্দ প্রদান করা হয়নি',
        }
    }

    const trimmed = word.trim()
    const normalized = normalizeBangla(trimmed)

    // Step 1: Fast reject — check local foreign words cache
    if (foreignWords.has(normalized)) {
        return {
            word: trimmed,
            valid: false,
            type: 'foreign',
            reason: 'বিদেশী শব্দ (স্থানীয় অভিধান)',
        }
    }

    // Step 2: Fast accept — check local pure words cache
    if (pureWords.has(normalized)) {
        return {
            word: trimmed,
            valid: true,
            type: 'pure',
            reason: 'খাঁটি বাংলা শব্দ (স্থানীয় অভিধান)',
        }
    }

    // Step 3: Wiktionary API fallback
    try {
        const url = `https://bn.wiktionary.org/w/api.php?action=query&prop=revisions&titles=${encodeURIComponent(normalized)}&rvprop=content&format=json&origin=*`

        const data: any = await $fetch(url, {
            timeout: 8000,
        })

        const pages = data?.query?.pages
        if (!pages) {
            return {
                word: trimmed,
                valid: false,
                type: 'unknown',
                reason: 'উইকিশব্দকোষে খুঁজে পাওয়া যায়নি',
            }
        }

        const pageId = Object.keys(pages)[0]

        if (!pageId || pageId === '-1') {
            return {
                word: trimmed,
                valid: false,
                type: 'unknown',
                reason: 'উইকিশব্দকোষে খুঁজে পাওয়া যায়নি',
            }
        }

        const content: string = pages[pageId]?.revisions?.[0]?.['*'] || ''

        if (!content) {
            return {
                word: trimmed,
                valid: false,
                type: 'unknown',
                reason: 'উইকিশব্দকোষে বিষয়বস্তু পাওয়া যায়নি',
            }
        }

        // Analyze etymology with Pure-First priority
        const result = analyzeEtymology(content)

        if (result) {
            return {
                word: trimmed,
                valid: result.type === 'pure',
                type: result.type,
                reason: result.reason,
            }
        }

        // No clear etymology found — be strict, mark as unknown
        return {
            word: trimmed,
            valid: false,
            type: 'unknown',
            reason: 'শব্দের উৎস নিশ্চিত করা যায়নি',
        }
    } catch (error) {
        // API failure — be strict, mark as unknown
        console.error(`Wiktionary API error for word "${trimmed}":`, error)
        return {
            word: trimmed,
            valid: false,
            type: 'unknown',
            reason: 'API ত্রুটি — শব্দের উৎস নিশ্চিত করা সম্ভব হয়নি',
        }
    }
})
