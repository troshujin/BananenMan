import globalState from "../Base/state.js";

const KEYS = {
  pokemon: "pokemonList",
  data: "pokemonData",
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<Pokemon>}
 */
export async function getPokemonData(pokemonName) {
  /** @type {Pokemon[]} */
  let pokemon = globalState.getState(KEYS.data) ?? [];
  if (pokemon.length == 0) {
    await fetchAllPokemon();
  }

  let pkmnData = pokemon.find(p => p.name == pokemonName);
  if (pkmnData) return pkmnData;

  if (pokemonName.toLowerCase() == "meowstic") {
    pkmnData = {
      id: 678,
      name: "meowstic",
      types: [],
      sprites: { front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/678.png" },
      height: -1,
      weight: -1,
      stats: {},
    }
    return pkmnData
  } else {
    console.log(`[Pokemon] Fetching pokemon data: ${pokemonName}.`)
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    if (!response.ok) throw new Error(`Pokémon ${pokemonName} not found`);
    pkmnData = await response.json();
  }

  pokemon.push(pkmnData);
  globalState.setState(KEYS.data, pokemon);

  return pkmnData;
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<string>}
 */
export async function getPokemonSprite(pokemonName) {
  let pokemon = await getPokemonData(pokemonName)

  return pokemon.sprites.front_default;
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<PokemonBulk[]>}
 */
export async function fetchAllPokemon() {
  let pokemon = globalState.getState(KEYS.pokemon) ?? [];
  if (pokemon.length != 0) return pokemon;

  console.log("[Pokemon] Fetching pokemon.")
  let response;
  try {
    response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0");
  } catch (error) {
    console.error(error)
    return [];
  }
  pokemon = (await response.json()).results;
  globalState.setState(KEYS.pokemon, pokemon);

  return pokemon;
}

/**
 * @returns {Promise<{name: string, value: string}[]>}
 */
export async function pokemonNamesAsChoices() {
  const list = await fetchAllPokemon();
  return list.map(p => ({ name: p.name, value: p.name }));
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<string[]>}
 */
export async function getEvolutionChain(pokemonName) {
  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
  const speciesData = await speciesRes.json();

  const evoUrl = speciesData.evolution_chain.url;
  const evoRes = await fetch(evoUrl);
  const evoData = await evoRes.json();

  const evolutions = [];
  let current = evoData.chain;

  // Traverse chain
  while (current) {
    evolutions.push(current.species.name);
    current = current.evolves_to?.[0]; // assuming linear evolution
  }

  return evolutions;
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<string?>}
 */
export async function getNextEvolution(pokemonName) {
  const evolutions = await getEvolutionChain(pokemonName);

  const index = evolutions.indexOf(pokemonName);

  if (index < evolutions.length - 1)
    return evolutions[index + 1];
}
