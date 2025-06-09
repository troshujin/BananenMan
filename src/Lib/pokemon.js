let pokemon = [];

export async function fetchPokemon() {
  if (pokemon.length != 0) return pokemon;

  console.log("[Pokemon] Fetching pokemon.")
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0");
  pokemon = (await response.json()).results;

  return pokemon;
}

export async function pokemonNamesAsChoices() {
  const list = await fetchPokemon();
  return list.map(p => ({ name: p.name, value: p.name }));
}
