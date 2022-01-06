import $rdf from 'rdf-ext'

const api = $rdf.namespace(`${window.location.origin}/api/`)
const hydra = $rdf.namespace('http://www.w3.org/ns/hydra/core#')
const rdf = $rdf.namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const schema = $rdf.namespace('http://schema.org/')
const sh = $rdf.namespace('http://www.w3.org/ns/shacl#')
const xsd = $rdf.namespace('http://www.w3.org/2001/XMLSchema#')
const rdfs = $rdf.namespace('http://www.w3.org/2000/01/rdf-schema#')
const ex = $rdf.namespace('http://example.org/')
const dash = $rdf.namespace('http://datashapes.org/dash#')

export const ns = {
  api,
  hydra,
  schema,
  sh,
  xsd,
  rdf,
  rdfs,
  ex,
  dash
}
