<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import Button from 'primevue/button'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'

import type { DeveloperModel } from '@/models/games/developer.model'
import type { GenreModel } from '@/models/games/genre.model'
import { GameModel } from '@/models/games/game.model'
import type { PlatformModel } from '@/models/games/platform.model'
import type { ReviewModel } from '@/models/games/review.model'
import type { TagModel } from '@/models/games/tag.model'
import { getAllDevelopers } from '@/services/games/developer.service'
import { deleteGame, getAllGames, insertGame, updateGame } from '@/services/games/game.service'
import { getAllGenres } from '@/services/games/genre.service'
import { getAllPlatforms } from '@/services/games/platform.service'
import { getAllReviews } from '@/services/games/review.service'
import { getAllTags } from '@/services/games/tag.service'

type SelectOption = {
  label: string
  value: string
}

type DeveloperRowModel = DeveloperModel & { id: string }
type PlatformRowModel = PlatformModel & { id: string }
type TagRowModel = TagModel & { id: string }
type GenreRowModel = GenreModel & { id: string }
type ReviewRowModel = ReviewModel & { id: string }

type GameFormModel = {
  title: string
  imgUrl: string
  description: string
  releaseDate: string
  platformId: string | null
  developerId: string | null
  tagIds: string[]
  genreIds: string[]
  reviewIds: string[]
}

type GameRowModel = GameModel & { id: string }

const games = ref<GameRowModel[]>([])
const developers = ref<DeveloperRowModel[]>([])
const platforms = ref<PlatformRowModel[]>([])
const tags = ref<TagRowModel[]>([])
const genres = ref<GenreRowModel[]>([])
const reviews = ref<ReviewRowModel[]>([])

const loading = ref(false)
const lookupLoading = ref(false)
const saving = ref(false)
const deletingId = ref('')
const dialogVisible = ref(false)
const editingId = ref('')
const formError = ref('')
const confirm = useConfirm()

const form = reactive<GameFormModel>(createEmptyForm())

const dialogTitle = computed(() => (editingId.value ? 'Editar juego' : 'Insertar juego'))
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

onMounted(() => {
  void loadGames()
  void loadLookupData()
})

async function loadGames() {
  loading.value = true

  try {
    games.value = (await getAllGames()) as GameRowModel[]
  } finally {
    loading.value = false
  }
}

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

function openInsertDialog() {
  editingId.value = ''
  formError.value = ''
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(game: GameRowModel) {
  editingId.value = game.id
  formError.value = ''
  fillForm(game)
  dialogVisible.value = true
}

function closeDialog() {
  if (saving.value) {
    return
  }

  dialogVisible.value = false
}

async function onSave() {
  if (saving.value) {
    return
  }

  const payload = toGameModel()

  if (!payload.title.trim()) {
    formError.value = 'El titulo es obligatorio.'
    return
  }

  saving.value = true
  formError.value = ''

  try {
    if (editingId.value) {
      await updateGame(editingId.value, payload)
    } else {
      await insertGame(payload)
    }

    dialogVisible.value = false
    await loadGames()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'No se pudo guardar el juego.'
  } finally {
    saving.value = false
  }
}

async function onDelete(game: GameRowModel) {
  if (!game.id || deletingId.value) {
    return
  }

  confirm.require({
    header: 'Confirmar borrado',
    message: `Se eliminara el juego "${game.title}". Esta accion no se puede deshacer.`,
    rejectLabel: 'Cancelar',
    acceptLabel: 'Borrar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      deletingId.value = game.id

      try {
        await deleteGame(game.id)
        await loadGames()
      } finally {
        deletingId.value = ''
      }
    },
  })
}

function createEmptyForm(): GameFormModel {
  return {
    title: '',
    imgUrl: '',
    description: '',
    releaseDate: '',
    platformId: null,
    developerId: null,
    tagIds: [],
    genreIds: [],
    reviewIds: [],
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm())
}

function fillForm(game: GameRowModel) {
  Object.assign(form, {
    title: game.title ?? '',
    imgUrl: game.imgUrl ?? '',
    description: game.description ?? '',
    releaseDate: game.releaseDate ? game.releaseDate.slice(0, 10) : '',
    platformId: game.platformId,
    developerId: game.developerId,
    tagIds: [...game.tagIds],
    genreIds: [...game.genreIds],
    reviewIds: [...game.reviewIds],
  })
}

function toGameModel(): GameModel {
  const model = new GameModel()
  model.title = form.title.trim()
  model.imgUrl = nullable(form.imgUrl)
  model.description = nullable(form.description)
  model.releaseDate = nullable(form.releaseDate)
  model.platformId = form.platformId
  model.developerId = form.developerId
  model.tagIds = [...form.tagIds]
  model.genreIds = [...form.genreIds]
  model.reviewIds = [...form.reviewIds]

  return model
}

function nullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}
</script>

<template>
  <main class="game-page">
    <ConfirmDialog />

    <section class="panel">
      <div class="panel-header">
        <div>
          <h1>CRUD de juegos</h1>
          <p>Administra el catalogo desde esta grilla.</p>
        </div>

        <Button label="Insertar" @click="openInsertDialog" />
      </div>

      <DataTable :value="games" data-key="id" :loading="loading" striped-rows responsive-layout="scroll">
        <Column header="Img" :style="{ width: '5rem' }">
          <template #body="slotProps">
            <img
              v-if="slotProps.data.imgUrl"
              class="game-thumb"
              :src="slotProps.data.imgUrl"
              :alt="`Portada de ${slotProps.data.title || 'juego'}`"
              loading="lazy"
            />
            <div v-else class="game-thumb placeholder">N/A</div>
          </template>
        </Column>
        <Column field="title" header="Titulo" />
        <Column field="description" header="Descripcion" />
        <Column field="releaseDate" header="Lanzamiento" />
        <Column header="Acciones" :style="{ width: '7rem', textAlign: 'center' }">
          <template #body="slotProps">
            <div class="row-actions">
              <button
                class="icon-action"
                type="button"
                aria-label="Editar"
                title="Editar"
                @click="openEditDialog(slotProps.data)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4 17.25V20h2.75l8.12-8.12-2.75-2.75zm12.71-7.46a1.003 1.003 0 000-1.42l-1.08-1.08a1.003 1.003 0 00-1.42 0l-.84.84 2.75 2.75z"
                  />
                </svg>
              </button>

              <button
                class="icon-action danger"
                type="button"
                aria-label="Borrar"
                title="Borrar"
                :disabled="deletingId === slotProps.data.id"
                @click="onDelete(slotProps.data)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 7h12l-1 13H7zm3-3h6l1 2H8z"
                  />
                </svg>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <Dialog v-model:visible="dialogVisible" modal :header="dialogTitle" :style="{ width: 'min(92vw, 42rem)' }">
      <form class="dialog-form" @submit.prevent="onSave">
        <label for="title">Titulo</label>
        <InputText id="title" v-model="form.title" autocomplete="off" />

        <label for="description">Descripcion</label>
        <Textarea id="description" v-model="form.description" auto-resize rows="4" />

        <div class="two-columns">
          <div>
            <label for="releaseDate">Fecha de lanzamiento</label>
            <InputText id="releaseDate" v-model="form.releaseDate" placeholder="YYYY-MM-DD" />
          </div>

          <div>
            <label for="imgUrl">URL de imagen</label>
            <InputText id="imgUrl" v-model="form.imgUrl" />
          </div>
        </div>

        <div class="two-columns">
          <div>
            <label for="platformId">Platform Id</label>
            <Select
              id="platformId"
              v-model="form.platformId"
              :options="platformOptions"
              option-label="label"
              option-value="value"
              filter
              show-clear
              :loading="lookupLoading"
              placeholder="Selecciona plataforma"
            />
          </div>

          <div>
            <label for="developerId">Developer Id</label>
            <Select
              id="developerId"
              v-model="form.developerId"
              :options="developerOptions"
              option-label="label"
              option-value="value"
              filter
              show-clear
              :loading="lookupLoading"
              placeholder="Selecciona developer"
            />
          </div>
        </div>

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

        <label for="genreIds">Genres</label>
        <MultiSelect
          id="genreIds"
          v-model="form.genreIds"
          :options="genreOptions"
          option-label="label"
          option-value="value"
          filter
          display="chip"
          :loading="lookupLoading"
          placeholder="Selecciona genres"
        />

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

        <small v-if="formError" class="error">{{ formError }}</small>

        <div class="dialog-actions">
          <Button type="button" label="Cancelar" severity="secondary" outlined @click="closeDialog" />
          <Button type="submit" label="Guardar" :loading="saving" />
        </div>
      </form>
    </Dialog>
  </main>
</template>

<style scoped>
.game-page {
  min-height: 100dvh;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top right, rgb(255 242 227 / 85%), transparent 42%),
    radial-gradient(circle at bottom left, rgb(253 230 199 / 70%), transparent 40%),
    #fff;
}

.panel {
  width: min(100%, 74rem);
  margin: 0 auto;
  border: 1px solid #f0ddc2;
  border-radius: 16px;
  background: #fff;
  padding: 1.1rem;
  box-shadow: 0 10px 28px rgb(199 116 0 / 9%);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

h1 {
  margin: 0;
  color: #7a4c00;
  font-size: 1.45rem;
}

p {
  margin: 0.25rem 0 0;
  color: #6e5732;
}

.game-thumb {
  inline-size: 2.5rem;
  block-size: 2.5rem;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #ead3b2;
  background: #fffaf3;
}

.game-thumb.placeholder {
  display: grid;
  place-items: center;
  color: #a2824f;
  font-size: 0.72rem;
  font-weight: 600;
}

.row-actions {
  display: inline-flex;
  gap: 0.4rem;
}

.icon-action {
  inline-size: 2rem;
  block-size: 2rem;
  border-radius: 8px;
  border: 1px solid #ead3b2;
  background: #fffaf3;
  color: #8f5f1f;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.icon-action svg {
  inline-size: 1rem;
  block-size: 1rem;
  fill: currentcolor;
}

.icon-action:hover {
  background: #ffefd8;
}

.icon-action.danger {
  border-color: #f2c8c8;
  color: #b64a4a;
  background: #fff6f6;
}

.icon-action.danger:hover {
  background: #ffeaea;
}

.icon-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dialog-form {
  display: grid;
  gap: 0.55rem;
}

.two-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.two-columns > div {
  display: grid;
  gap: 0.45rem;
}

label {
  font-size: 0.9rem;
  color: #5f461f;
}

.dialog-actions {
  margin-top: 0.8rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.error {
  color: #b13f3f;
  margin-top: 0.2rem;
}

@media (width <= 760px) {
  .two-columns {
    grid-template-columns: 1fr;
  }

  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
