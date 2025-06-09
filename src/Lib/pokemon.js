let pokemon = [];

export async function fetchAllPokemon() {
  if (pokemon.length != 0) return pokemon;

  console.log("[Pokemon] Fetching pokemon.")
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0");
  pokemon = (await response.json()).results;

  return pokemon;
}

/**
 * @returns {{name: string, value: string}[]}
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
