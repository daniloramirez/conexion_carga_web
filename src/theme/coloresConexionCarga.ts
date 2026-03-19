export const coloresConexionCarga = {
    naranjaPrincipal: '#FF7800',
    verdeClaroMarca: '#A7E27A',
    verdeAccionPrincipal: '#19B300',
    fondoCremaClaro: '#F5F5F2',
    grisClaroBordes: '#EAEAEA',
    grisSecundarioTextoIconos: '#6B7280',
    amarilloApoyo: '#FFD54F',
    naranjaDeshabilitado: '#FFEDD9',
    verdeDeshabilitado: '#DBF0D9',
    verdeProfundoContraste: '#2F4D2A',
} as const

export const temaConexionCargaLigero = {
    primary: coloresConexionCarga.verdeAccionPrincipal,
    primaryDeep: coloresConexionCarga.verdeProfundoContraste,
    primaryMild: coloresConexionCarga.verdeClaroMarca,
    primarySubtle: coloresConexionCarga.verdeDeshabilitado,
    neutral: '#FFFFFF',
} as const
