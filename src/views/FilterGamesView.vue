<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'

import type { DeveloperModel } from '@/models/games/developer.model'
import type { GameModel } from '@/models/games/game.model'
import type { GenreModel } from '@/models/games/genre.model'
import type { PlatformModel } from '@/models/games/platform.model'
import type { ReviewModel } from '@/models/games/review.model'
import type { TagModel } from '@/models/games/tag.model'
import { getAllDevelopers } from '@/services/games/developer.service'
import { searchGames } from '@/services/games/game.service'
import { getAllGenres } from '@/services/games/genre.service'
import { getAllPlatforms } from '@/services/games/platform.service'
import { getAllReviews } from '@/services/games/review.service'
import { getAllTags } from '@/services/games/tag.service'

type SelectOption = {
  label: string
  value: string
}

type GameRowModel = GameModel & { id: string }
type DeveloperRowModel = DeveloperModel & { id: string }
type PlatformRowModel = PlatformModel & { id: string }
type TagRowModel = TagModel & { id: string }
type GenreRowModel = GenreModel & { id: string }
type ReviewRowModel = ReviewModel & { id: string }

type FilterForm = {
  title: string
  description: string
  releaseDate: string
  platformId: string | null
  developerId: string | null
  tagIds: string[]
  genreIds: string[]
  reviewIds: string[]
}

const form = reactive<FilterForm>({
  title: '',
  description: '',
  releaseDate: '',
  platformId: null,
  developerId: null,
  tagIds: [],
  genreIds: [],
  reviewIds: [],
})

const loading = ref(false)
const lookupLoading = ref(false)
const games = ref<GameRowModel[]>([])
const totalResults = ref(0)

const developers = ref<DeveloperRowModel[]>([])
const platforms = ref<PlatformRowModel[]>([])
const tags = ref<TagRowModel[]>([])
const genres = ref<GenreRowModel[]>([])
const reviews = ref<ReviewRowModel[]>([])

const developerOptions = computed<SelectOption[]>(() =>
  developers.value.map((item) => ({
    label: item.name || item.id,
    value: item.id,
  })),
)

const platformOptions = computed<SelectOption[]>(() =>
  platforms.value.map((item) => ({
    label: item.name || item.id,
    value: item.id,
  })),
)

const tagOptions = computed<SelectOption[]>(() =>
  tags.value.map((item) => ({
    label: item.name || item.id,
    value: item.id,
  })),
)

const genreOptions = computed<SelectOption[]>(() =>
  genres.value.map((item) => ({
    label: item.name || item.id,
    value: item.id,
  })),
)

const reviewOptions = computed<SelectOption[]>(() =>
  reviews.value.map((item) => ({
    label: `${item.rating}/5 - ${item.id.slice(0, 8)}`,
    value: item.id,
  })),
)

const developerNameMap = computed(() => new Map(developers.value.map((item) => [item.id, item.name])))
const platformNameMap = computed(() => new Map(platforms.value.map((item) => [item.id, item.name])))
const tagNameMap = computed(() => new Map(tags.value.map((item) => [item.id, item.name])))
const genreNameMap = computed(() => new Map(genres.value.map((item) => [item.id, item.name])))

onMounted(async () => {
  await loadLookupData()
  await onSearch()
})

async function loadLookupData() {
  lookupLoading.value = true

  try {
    const [developersResult, platformsResult, tagsResult, genresResult, reviewsResult] = await Promise.all([
      getAllDevelopers(),
      getAllPlatforms(),
      getAllTags(),
      getAllGenres(),
      getAllReviews(),
    ])

    developers.value = developersResult as DeveloperRowModel[]
    platforms.value = platformsResult as PlatformRowModel[]
    tags.value = tagsResult as TagRowModel[]
    genres.value = genresResult as GenreRowModel[]
    reviews.value = reviewsResult as ReviewRowModel[]
  } finally {
    lookupLoading.value = false
  }
}

async function onSearch() {
  loading.value = true

  try {
    const response = await searchGames({
      page: 1,
      pageSize: 100,
      title: nullable(form.title),
      description: nullable(form.description),
      releaseDate: nullable(form.releaseDate),
      platformId: form.platformId,
      developerId: form.developerId,
      tagIds: idsToQuery(form.tagIds),
      genreIds: idsToQuery(form.genreIds),
      reviewIds: idsToQuery(form.reviewIds),
    })

    console.log('[FilterGames] raw response:', response)

    const returnedGames = extractGamesFromResponse(response)
    console.log('[FilterGames] lista devuelta:', returnedGames)

    games.value = returnedGames
    totalResults.value = extractTotalResults(response, returnedGames.length)
  } finally {
    loading.value = false
  }
}

function extractGamesFromResponse(response: unknown): GameRowModel[] {
  if (Array.isArray(response)) {
    return normalizeGames(response)
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const source = response as Record<string, unknown>
  const possibleCollections = [
    source.Games,
    source.games,
    source.Items,
    source.items,
    source.Results,
    source.results,
    source.Data,
    source.data,
  ]

  for (const collection of possibleCollections) {
    if (Array.isArray(collection)) {
      return normalizeGames(collection)
    }

    if (collection && typeof collection === 'object') {
      const withValues = (collection as { $values?: unknown }).$values
      if (Array.isArray(withValues)) {
        return normalizeGames(withValues)
      }
    }
  }

  return []
}

function extractTotalResults(response: unknown, fallback: number): number {
  if (!response || typeof response !== 'object') {
    return fallback
  }

  const source = response as Record<string, unknown>
  const possibleTotals = [
    source.TotalResutls,
    source.TotalResults,
    source.totalResutls,
    source.totalResults,
    source.Count,
    source.count,
  ]

  for (const total of possibleTotals) {
    if (typeof total === 'number' && Number.isFinite(total)) {
      return total
    }
  }

  return fallback
}

function normalizeGames(rawGames: unknown): GameRowModel[] {
  if (!Array.isArray(rawGames)) {
    return []
  }

  return rawGames.map((item) => {
    const game = (item ?? {}) as Partial<GameRowModel>

    return {
      id: typeof game.id === 'string' ? game.id : '',
      title: typeof game.title === 'string' ? game.title : '',
      imgUrl: typeof game.imgUrl === 'string' ? game.imgUrl : null,
      description: typeof game.description === 'string' ? game.description : null,
      releaseDate: typeof game.releaseDate === 'string' ? game.releaseDate : null,
      platformId: typeof game.platformId === 'string' ? game.platformId : null,
      developerId: typeof game.developerId === 'string' ? game.developerId : null,
      tagIds: Array.isArray(game.tagIds) ? game.tagIds.filter((id): id is string => typeof id === 'string') : [],
      genreIds: Array.isArray(game.genreIds) ? game.genreIds.filter((id): id is string => typeof id === 'string') : [],
      reviewIds: Array.isArray(game.reviewIds)
        ? game.reviewIds.filter((id): id is string => typeof id === 'string')
        : [],
      createdUtc: game.createdUtc instanceof Date ? game.createdUtc : new Date(),
      updatedUtc: game.updatedUtc instanceof Date || game.updatedUtc === null ? game.updatedUtc : null,
    }
  })
}

function onResetFilters() {
  form.title = ''
  form.description = ''
  form.releaseDate = ''
  form.platformId = null
  form.developerId = null
  form.tagIds = []
  form.genreIds = []
  form.reviewIds = []
  void onSearch()
}

function nullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

function idsToQuery(ids: string[]): string | null {
  if (!ids.length) {
    return null
  }

  return ids.join(',')
}

function getDeveloperName(id: string | null): string {
  if (!id) {
    return 'Sin developer'
  }

  return developerNameMap.value.get(id) || id
}

function getPlatformName(id: string | null): string {
  if (!id) {
    return 'Sin plataforma'
  }

  return platformNameMap.value.get(id) || id
}

function getTagName(id: string): string {
  return tagNameMap.value.get(id) || id
}

function getGenreName(id: string): string {
  return genreNameMap.value.get(id) || id
}
</script>

<template>
  <main class="filter-page">
    <section class="filter-panel">
      <h1>Filter Games</h1>
      <p>Filtra juegos y visualiza resultados en cards.</p>

      <form class="filters-grid" @submit.prevent="onSearch">
        <div>
          <label for="title">Titulo</label>
          <InputText id="title" v-model="form.title" placeholder="Ej: Zelda" />
        </div>

        <div>
          <label for="description">Descripcion</label>
          <InputText id="description" v-model="form.description" placeholder="Texto libre" />
        </div>

        <div>
          <label for="releaseDate">Fecha lanzamiento</label>
          <InputText id="releaseDate" v-model="form.releaseDate" placeholder="YYYY-MM-DD" />
        </div>

        <div>
          <label for="platformId">Plataforma</label>
          <Select
            id="platformId"
            v-model="form.platformId"
            :options="platformOptions"
            option-label="label"
            option-value="value"
            filter
            show-clear
            :loading="lookupLoading"
            placeholder="Todas"
          />
        </div>

        <div>
          <label for="developerId">Developer</label>
          <Select
            id="developerId"
            v-model="form.developerId"
            :options="developerOptions"
            option-label="label"
            option-value="value"
            filter
            show-clear
            :loading="lookupLoading"
            placeholder="Todos"
          />
        </div>

        <div>
          <label for="tagIds">Tags</label>
          <MultiSelect
            id="tagIds"
            v-model="form.tagIds"
            :options="tagOptions"
            option-label="label"
            option-value="value"
            filter
            display="chip"
            :loading="lookupLoading"
            placeholder="Selecciona tags"
          />
        </div>

        <div>
          <label for="genreIds">Generos</label>
          <MultiSelect
            id="genreIds"
            v-model="form.genreIds"
            :options="genreOptions"
            option-label="label"
            option-value="value"
            filter
            display="chip"
            :loading="lookupLoading"
            placeholder="Selecciona generos"
          />
        </div>

        <div>
          <label for="reviewIds">Reviews</label>
          <MultiSelect
            id="reviewIds"
            v-model="form.reviewIds"
            :options="reviewOptions"
            option-label="label"
            option-value="value"
            filter
            display="chip"
            :loading="lookupLoading"
            placeholder="Selecciona reviews"
          />
        </div>

        <div class="filter-actions">
          <Button type="submit" label="Buscar" :loading="loading" />
          <Button type="button" label="Limpiar" severity="secondary" outlined @click="onResetFilters" />
        </div>
      </form>
    </section>

    <section class="results-panel">
      <div class="results-header">
        <h2>Resultados</h2>
        <span>{{ totalResults }} juegos</span>
      </div>

      <div v-if="!loading && !games.length" class="empty-state">No se encontraron juegos con esos filtros.</div>

      <div class="cards-grid">
        <Card v-for="game in games" :key="game.id" class="game-card">
          <template #content>
            <article class="game-content">
              <div class="media-wrap">
                <img
                  v-if="game.imgUrl"
                  class="cover"
                  :src="game.imgUrl"
                  :alt="`Portada de ${game.title}`"
                  loading="lazy"
                />
                <div v-else class="cover placeholder">Sin imagen</div>

                <div class="media-overlay">
                  <h3>{{ game.title }}</h3>
                  <div class="chips-row compact">
                    <span class="chip chip-platform">{{ getPlatformName(game.platformId) }}</span>
                    <span class="chip chip-dev">{{ getDeveloperName(game.developerId) }}</span>
                    <span v-if="game.releaseDate" class="chip chip-date">{{ game.releaseDate.slice(0, 10) }}</span>
                  </div>
                </div>
              </div>

              <div class="meta">
                <p>{{ game.description || 'Sin descripcion.' }}</p>

                <div class="chips-row">
                  <span v-for="tagId in game.tagIds" :key="`tag-${game.id}-${tagId}`" class="chip chip-tag">
                    {{ getTagName(tagId) }}
                  </span>
                  <span v-if="!game.tagIds.length" class="chip chip-empty">Sin tags</span>
                </div>

                <div class="chips-row">
                  <span v-for="genreId in game.genreIds" :key="`genre-${game.id}-${genreId}`" class="chip chip-genre">
                    {{ getGenreName(genreId) }}
                  </span>
                  <span v-if="!game.genreIds.length" class="chip chip-empty">Sin generos</span>
                </div>
              </div>
            </article>
          </template>
        </Card>
      </div>
    </section>
  </main>
</template>

<style scoped>
.filter-page {
  min-height: 100dvh;
  padding: 1rem;
  background:
    radial-gradient(circle at 15% 10%, rgb(255 246 217 / 75%), transparent 42%),
    radial-gradient(circle at 95% 85%, rgb(222 244 255 / 65%), transparent 35%),
    #f9fcff;
}

.filter-panel,
.results-panel {
  width: min(100%, 74rem);
  margin: 0 auto;
  border: 1px solid #d5e4f3;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 25px rgb(16 36 63 / 7%);
  padding: 1rem;
}

.results-panel {
  margin-top: 1rem;
}

h1,
h2,
h3 {
  margin: 0;
}

p {
  margin: 0.3rem 0 0;
  color: #4a5f78;
}

.filters-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.filters-grid > div {
  display: grid;
  gap: 0.4rem;
}

label {
  font-size: 0.88rem;
  color: #2f4d6e;
}

.filter-actions {
  align-self: end;
  display: flex;
  gap: 0.55rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.results-header span {
  color: #38597f;
  font-weight: 600;
}

.empty-state {
  padding: 1rem;
  border-radius: 10px;
  background: #eef5ff;
  color: #345377;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18.5rem, 1fr));
  gap: 1rem;
}

.game-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #d8e2ed;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  box-shadow: 0 10px 22px rgb(12 31 56 / 10%);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 28px rgb(12 31 56 / 18%);
}

.game-content {
  display: grid;
  gap: 0.75rem;
}

.media-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.cover {
  inline-size: 100%;
  block-size: 11rem;
  object-fit: cover;
  border: 1px solid #cfdcea;
}

.cover.placeholder {
  display: grid;
  place-items: center;
  font-size: 0.82rem;
  font-weight: 700;
  color: #f6f7fa;
  background: linear-gradient(135deg, #37567a 0%, #14263f 100%);
}

.media-overlay {
  position: absolute;
  inset: auto 0 0;
  padding: 0.6rem;
  background: linear-gradient(180deg, rgb(2 8 18 / 0%) 0%, rgb(2 8 18 / 85%) 68%, rgb(2 8 18 / 95%) 100%);
}

.media-overlay h3 {
  color: #fff;
  margin: 0 0 0.4rem;
  font-size: 1.05rem;
  line-height: 1.15;
}

.meta h3 {
  color: #15375a;
}

.meta p {
  margin-top: 0;
  font-size: 0.88rem;
  color: #304e6f;
  line-height: 1.45;
  min-height: 2.5rem;
}

.chips-row {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.38rem;
  flex-wrap: wrap;
}

.chips-row.compact {
  margin-top: 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.22rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.chip-platform {
  background: #28a8ff;
  color: #05243d;
}

.chip-dev {
  background: #ffb648;
  color: #452700;
}

.chip-date {
  background: #8e9dff;
  color: #152060;
}

.chip-tag {
  background: #e9fff1;
  color: #0f6a34;
  border: 1px solid #bceecd;
}

.chip-genre {
  background: #ffeef0;
  color: #892f4b;
  border: 1px solid #f5cad4;
}

.chip-empty {
  background: #ecf2f9;
  color: #577191;
}

@media (width <= 940px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 640px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .game-content {
    grid-template-columns: 1fr;
  }

  .cover,
  .cover.placeholder {
    inline-size: 100%;
    block-size: 12rem;
  }
}
</style>