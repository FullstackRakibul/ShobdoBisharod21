<script setup lang="ts">
import { toPng } from 'html-to-image'

interface WordResult {
  word: string
  valid: boolean
  type: string
  reason: string
}

const props = defineProps<{
  name: string
  results: WordResult[]
  score: number
  total: number
}>()

const emit = defineEmits<{
  restart: []
}>()

const resultCardRef = ref<HTMLElement | null>(null)
const isDownloading = ref(false)

const grade = computed(() => {
  const ratio = props.score / props.total
  if (ratio >= 0.9) return { label: 'খাঁটি বাঙালি 🏆', color: 'text-green-700 dark:text-green-400', emoji: '🇧🇩' }
  if (ratio >= 0.7) return { label: 'প্রায় খাঁটি ✨', color: 'text-emerald-600 dark:text-emerald-400', emoji: '🌟' }
  if (ratio >= 0.5) return { label: 'মিশ্র ভাষী 🔄', color: 'text-yellow-600 dark:text-yellow-400', emoji: '⚖️' }
  if (ratio >= 0.3) return { label: 'বিদেশী প্রভাবিত 🌐', color: 'text-orange-600 dark:text-orange-400', emoji: '🌍' }
  return { label: 'ভাষা মিশ্রণকারী 😅', color: 'text-red-600 dark:text-red-400', emoji: '😬' }
})

const pureWords = computed(() => props.results.filter((r) => r.valid))
const rejectedWords = computed(() => props.results.filter((r) => !r.valid))

const scorePercentage = computed(() => Math.round((props.score / props.total) * 100))

async function downloadCard() {
  if (!resultCardRef.value || isDownloading.value) return
  isDownloading.value = true
  try {
    const dataUrl = await toPng(resultCardRef.value, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#f8f5f2',
    })
    const link = document.createElement('a')
    link.download = `শব্দবিশারদ-${props.name}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Failed to generate image:', err)
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Shareable Result Card -->
    <div
      ref="resultCardRef"
      class="result-card-export rounded-2xl overflow-hidden"
      style="background: linear-gradient(135deg, #f8f5f2 0%, #fef2e8 50%, #f8f5f2 100%)"
    >
      <!-- Header Banner -->
      <div
        class="relative px-6 py-8 text-center overflow-hidden"
        style="background: linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #ea580c 100%)"
      >
        <!-- Decorative elements -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-2 left-4 text-6xl">🌺</div>
          <div class="absolute bottom-2 right-4 text-6xl">🌺</div>
        </div>
        <div class="relative z-10">
          <h2 class="text-3xl font-bold text-white mb-1" style="font-family: 'Hind Siliguri', sans-serif">
            শব্দবিশারদ ২১
          </h2>
          <p class="text-red-100 text-sm">আন্তর্জাতিক মাতৃভাষা দিবস ২০২৬</p>
        </div>
      </div>

      <!-- Score Section -->
      <div class="px-6 py-6 text-center">
        <p class="text-lg text-gray-600 mb-2" style="font-family: 'Hind Siliguri', sans-serif">
          {{ name }}-এর ফলাফল
        </p>

        <!-- Score Circle -->
        <div class="flex justify-center mb-4">
          <div
            class="relative w-32 h-32 rounded-full flex items-center justify-center"
            style="background: linear-gradient(135deg, #991b1b, #ea580c)"
          >
            <div class="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center">
              <span class="text-4xl font-bold" style="color: #991b1b">{{ score }}</span>
              <span class="text-sm text-gray-500">/{{ total }}</span>
            </div>
          </div>
        </div>

        <!-- Grade -->
        <div
          class="inline-block px-6 py-2 rounded-full text-lg font-bold mb-4"
          :class="grade.color"
          style="background: rgba(153, 27, 27, 0.08); font-family: 'Hind Siliguri', sans-serif"
        >
          {{ grade.emoji }} {{ grade.label }}
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-3 rounded-full bg-gray-200 overflow-hidden mb-6">
          <div
            class="h-full rounded-full transition-all duration-1000 ease-out"
            :style="{
              width: scorePercentage + '%',
              background: `linear-gradient(90deg, #991b1b, #ea580c)`,
            }"
          />
        </div>

        <!-- Word Results -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <!-- Pure Words -->
          <div v-if="pureWords.length > 0" class="rounded-xl p-4" style="background: rgba(22, 163, 74, 0.06); border: 1px solid rgba(22, 163, 74, 0.15)">
            <h3 class="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2" style="font-family: 'Hind Siliguri', sans-serif">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              খাঁটি বাংলা শব্দ ({{ pureWords.length }})
            </h3>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="(r, i) in pureWords"
                :key="i"
                variant="secondary"
                class="text-sm px-3 py-1 bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                style="font-family: 'Hind Siliguri', sans-serif"
              >
                {{ r.word }}
              </Badge>
            </div>
          </div>

          <!-- Rejected Words -->
          <div v-if="rejectedWords.length > 0" class="rounded-xl p-4" style="background: rgba(220, 38, 38, 0.06); border: 1px solid rgba(220, 38, 38, 0.15)">
            <h3 class="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2" style="font-family: 'Hind Siliguri', sans-serif">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              প্রত্যাখ্যাত শব্দ ({{ rejectedWords.length }})
            </h3>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="(r, i) in rejectedWords"
                :key="i"
                variant="secondary"
                class="text-sm px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                style="font-family: 'Hind Siliguri', sans-serif"
              >
                {{ r.word }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t border-dashed" style="border-color: rgba(153, 27, 27, 0.2)">
          <p class="text-xs text-gray-400" style="font-family: 'Hind Siliguri', sans-serif">
            শব্দবিশারদ ২১ • আন্তর্জাতিক মাতৃভাষা দিবস ২০২৬ • #ShobdoBisharod21
          </p>
        </div>
      </div>
    </div>

    <!-- Action Buttons (outside result card for export) -->
    <div class="flex flex-col sm:flex-row gap-3 justify-center">
      <Button
        size="lg"
        class="gap-2 text-white font-semibold rounded-xl"
        style="background: linear-gradient(135deg, #991b1b, #ea580c); font-family: 'Hind Siliguri', sans-serif"
        :disabled="isDownloading"
        @click="downloadCard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        {{ isDownloading ? 'ডাউনলোড হচ্ছে...' : 'ফলাফল ডাউনলোড করুন' }}
      </Button>

      <Button
        variant="outline"
        size="lg"
        class="gap-2 rounded-xl border-2"
        style="border-color: #991b1b; color: #991b1b; font-family: 'Hind Siliguri', sans-serif"
        @click="$emit('restart')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        আবার খেলুন
      </Button>
    </div>
  </div>
</template>
