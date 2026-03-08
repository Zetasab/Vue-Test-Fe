<template>
  <main class="game-page">
    <section class="panel">
      <h1>Game</h1>
      <p>Esta es la vista de juego. Aqui puedes montar tu logica de gameplay.</p>

      <RouterLink class="back-link" to="/">Volver al Home</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.game-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: linear-gradient(145deg, #fff4e6 0%, #fffaf2 45%, #ffffff 100%);
}

.panel {
  width: min(100%, 40rem);
  border: 1px solid #f2dfc3;
  border-radius: 16px;
  background: #fff;
  padding: 1.5rem;
}

h1 {
  margin: 0 0 0.5rem;
  color: #7a4c00;
}

p {
  margin: 0 0 1.1rem;
  color: #6e5732;
}

.back-link {
  display: inline-block;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  background: #c87400;
  color: #fff;
  text-decoration: none;
}
</style>
