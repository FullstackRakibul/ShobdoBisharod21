<script setup lang="ts">
interface WordResult {
  word: string
  valid: boolean
  type: string
  reason: string
}

type GameState = 'input' | 'processing' | 'result'

const gameState = ref<GameState>('input')
const userName = ref('')
const wordsInput = ref('')
const wordResults = ref<WordResult[]>([])
const score = ref(0)
const processingProgress = ref(0)
const currentWord = ref('')
const currentWordIndex = ref(0)
const totalWords = ref(0)
const errorMessage = ref('')

function parseWords(input: string): string[] {
  return input
    .split(/[,\n।\|]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0)
}

const wordList = computed(() => parseWords(wordsInput.value))
const wordCount = computed(() => wordList.value.length)
const isValidInput = computed(() => {
  return userName.value.trim().length > 0 && wordCount.value === 21
})

async function startGame() {
  if (!isValidInput.value) {
    if (userName.value.trim().length === 0) {
      errorMessage.value = 'আপনার নাম লিখুন'
    } else if (wordCount.value < 21) {
      errorMessage.value = `আরও ${21 - wordCount.value}টি শব্দ দরকার (বর্তমানে ${wordCount.value}টি)`
    } else if (wordCount.value > 21) {
      errorMessage.value = `${wordCount.value - 21}টি শব্দ বেশি হয়েছে (সর্বোচ্চ ২১টি)`
    }
    return
  }

  errorMessage.value = ''
  gameState.value = 'processing'
  const words = wordList.value.slice(0, 21)
  totalWords.value = words.length
  wordResults.value = []
  score.value = 0
  processingProgress.value = 0

  for (let i = 0; i < words.length; i++) {
    currentWordIndex.value = i + 1
    currentWord.value = words[i]

    // Add a small delay for visual effect
    await new Promise((resolve) => setTimeout(resolve, 300))

    try {
      const res = await $fetch<WordResult>('/api/check-word', {
        method: 'POST',
        body: { word: words[i] },
      })
      wordResults.value.push(res)
      if (res.valid) score.value++
    } catch (err) {
      wordResults.value.push({
        word: words[i],
        valid: false,
        type: 'error',
        reason: 'যাচাই করতে ব্যর্থ',
      })
    }

    processingProgress.value = Math.round(((i + 1) / words.length) * 100)
  }

  // Brief pause before showing results
  await new Promise((resolve) => setTimeout(resolve, 600))
  gameState.value = 'result'
}

function restart() {
  gameState.value = 'input'
  userName.value = ''
  wordsInput.value = ''
  wordResults.value = []
  score.value = 0
  processingProgress.value = 0
  currentWord.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 md:p-8" style="background: linear-gradient(180deg, #f8f5f2 0%, #fef2e8 100%)">
    <div class="w-full max-w-2xl">

      <!-- ============ INPUT STATE ============ -->
      <Transition name="fade" mode="out-in">
        <div v-if="gameState === 'input'" key="input">
          <Card class="border-0 shadow-2xl rounded-3xl overflow-hidden" style="background: white">
            <!-- Header -->
            <div
              class="relative px-6 py-10 text-center overflow-hidden"
              style="background: linear-gradient(135deg, #991b1b 0%, #b91c1c 40%, #ea580c 100%)"
            >
              <!-- Shaheed Minar silhouette -->
              <div class="absolute inset-0 flex items-end justify-center opacity-[0.07] pointer-events-none">
                <svg viewBox="0 0 200 180" class="w-64 h-auto" fill="white">
                  <rect x="88" y="20" width="24" height="160" rx="4" />
                  <rect x="60" y="50" width="16" height="130" rx="3" transform="rotate(-8, 68, 180)" />
                  <rect x="124" y="50" width="16" height="130" rx="3" transform="rotate(8, 132, 180)" />
                  <rect x="36" y="70" width="14" height="110" rx="3" transform="rotate(-15, 43, 180)" />
                  <rect x="150" y="70" width="14" height="110" rx="3" transform="rotate(15, 157, 180)" />
                  <ellipse cx="100" cy="30" rx="35" ry="18" fill="none" stroke="white" stroke-width="3" />
                </svg>
              </div>

              <div class="relative z-10">
                <div class="text-5xl mb-3">🌺</div>
                <h1 class="text-3xl md:text-4xl font-bold text-white mb-2" style="font-family: 'Hind Siliguri', sans-serif">
                  শব্দবিশারদ ২১
                </h1>
                <p class="text-red-100 text-sm md:text-base" style="font-family: 'Hind Siliguri', sans-serif">
                  আন্তর্জাতিক মাতৃভাষা দিবস উপলক্ষে<br />
                  আপনার বাংলা শব্দভান্ডার যাচাই করুন
                </p>
              </div>
            </div>

            <CardContent class="p-6 md:p-8 space-y-6">
              <!-- How it works -->
              <div class="rounded-xl p-4 text-sm space-y-2" style="background: rgba(234, 88, 12, 0.06); border: 1px solid rgba(234, 88, 12, 0.15); font-family: 'Hind Siliguri', sans-serif; color: #92400e">
                <p class="font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  কীভাবে খেলবেন?
                </p>
                <ul class="space-y-1 pl-6 list-disc text-xs">
                  <li>আপনার নাম লিখুন</li>
                  <li>২১টি বাংলা শব্দ লিখুন (কমা বা নতুন লাইন দিয়ে আলাদা করুন)</li>
                  <li>আমরা যাচাই করব শব্দগুলো <strong>খাঁটি বাংলা</strong> (তৎসম/তদ্ভব) কিনা</li>
                  <li>বিদেশী শব্দ (ইংরেজি, আরবি, ফারসি) ০ পয়েন্ট পাবে</li>
                </ul>
              </div>

              <!-- Name Input -->
              <div class="space-y-2">
                <label class="text-sm font-medium" style="color: #991b1b; font-family: 'Hind Siliguri', sans-serif">
                  আপনার নাম
                </label>
                <Input
                  v-model="userName"
                  placeholder="আপনার নাম লিখুন..."
                  class="h-12 rounded-xl text-lg border-2 focus-visible:ring-0 focus-visible:border-[#ea580c] transition-colors"
                  style="font-family: 'Hind Siliguri', sans-serif; border-color: #e5e1dc"
                />
              </div>

              <!-- Words Textarea -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium" style="color: #991b1b; font-family: 'Hind Siliguri', sans-serif">
                    ২১টি বাংলা শব্দ
                  </label>
                  <span
                    class="text-xs font-mono px-2 py-1 rounded-full"
                    :class="wordCount === 21 ? 'bg-green-100 text-green-700' : wordCount > 21 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'"
                  >
                    {{ wordCount }}/21
                  </span>
                </div>
                <Textarea
                  v-model="wordsInput"
                  placeholder="কমা বা নতুন লাইন দিয়ে আলাদা করুন...&#10;যেমন: আকাশ, পৃথিবী, সূর্য, চন্দ্র, নদী..."
                  rows="6"
                  class="rounded-xl text-base border-2 focus-visible:ring-0 focus-visible:border-[#ea580c] transition-colors resize-none"
                  style="font-family: 'Hind Siliguri', sans-serif; border-color: #e5e1dc"
                />
              </div>

              <!-- Error message -->
              <p
                v-if="errorMessage"
                class="text-sm text-red-600 text-center px-4 py-2 rounded-lg bg-red-50"
                style="font-family: 'Hind Siliguri', sans-serif"
              >
                {{ errorMessage }}
              </p>

              <!-- Submit Button -->
              <Button
                size="lg"
                class="w-full h-14 text-lg font-bold text-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                :style="{
                  background: isValidInput
                    ? 'linear-gradient(135deg, #991b1b, #ea580c)'
                    : '#d1d5db',
                  fontFamily: '\'Hind Siliguri\', sans-serif',
                }"
                :disabled="!isValidInput"
                @click="startGame"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                শব্দ যাচাই শুরু করুন
              </Button>
            </CardContent>
          </Card>

          <!-- Footer credit -->
          <p class="text-center text-xs mt-6 opacity-40" style="font-family: 'Hind Siliguri', sans-serif; color: #991b1b">
            🌺 একুশে ফেব্রুয়ারি ২০২৬ • ভাষা শহীদদের স্মরণে 🌺
          </p>
        </div>

        <!-- ============ PROCESSING STATE ============ -->
        <div v-else-if="gameState === 'processing'" key="processing">
          <Card class="border-0 shadow-2xl rounded-3xl overflow-hidden" style="background: white">
            <div
              class="px-6 py-8 text-center"
              style="background: linear-gradient(135deg, #991b1b 0%, #b91c1c 40%, #ea580c 100%)"
            >
              <h2 class="text-2xl font-bold text-white" style="font-family: 'Hind Siliguri', sans-serif">
                🔍 ভাষাগত বিশ্লেষণ চলছে...
              </h2>
            </div>

            <CardContent class="p-6 md:p-8 space-y-8">
              <!-- Progress -->
              <div class="space-y-3">
                <div class="flex justify-between text-sm" style="font-family: 'Hind Siliguri', sans-serif">
                  <span class="text-gray-500">অগ্রগতি</span>
                  <span class="font-mono font-bold" style="color: #991b1b">{{ currentWordIndex }}/{{ totalWords }}</span>
                </div>
                <Progress :model-value="processingProgress" class="h-3 rounded-full" />
              </div>

              <!-- Current Word Scanner -->
              <div class="text-center py-8">
                <div class="relative inline-block">
                  <!-- Scanning ring animation -->
                  <div class="w-40 h-40 rounded-full flex items-center justify-center mx-auto relative">
                    <div class="absolute inset-0 rounded-full animate-ping opacity-20" style="background: #991b1b"></div>
                    <div class="absolute inset-2 rounded-full animate-pulse opacity-30" style="background: linear-gradient(135deg, #991b1b, #ea580c)"></div>
                    <div class="relative w-32 h-32 rounded-full bg-white shadow-xl flex items-center justify-center border-4" style="border-color: #991b1b">
                      <span class="text-2xl font-bold" style="color: #991b1b; font-family: 'Hind Siliguri', sans-serif">
                        {{ currentWord }}
                      </span>
                    </div>
                  </div>
                </div>
                <p class="mt-4 text-sm text-gray-400 animate-pulse" style="font-family: 'Hind Siliguri', sans-serif">
                  শব্দের উৎপত্তি যাচাই হচ্ছে...
                </p>
              </div>

              <!-- Already processed words preview -->
              <div v-if="wordResults.length > 0" class="space-y-2">
                <p class="text-xs text-gray-400" style="font-family: 'Hind Siliguri', sans-serif">সম্প্রতি যাচাই করা:</p>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="(r, i) in wordResults.slice(-5)"
                    :key="i"
                    :variant="r.valid ? 'default' : 'destructive'"
                    class="text-xs px-2 py-1 animate-in fade-in slide-in-from-bottom-1"
                    :class="r.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                    style="font-family: 'Hind Siliguri', sans-serif"
                  >
                    {{ r.valid ? '✓' : '✗' }} {{ r.word }}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- ============ RESULT STATE ============ -->
        <div v-else key="result">
          <ResultCard
            :name="userName"
            :results="wordResults"
            :score="score"
            :total="totalWords"
            @restart="restart"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
