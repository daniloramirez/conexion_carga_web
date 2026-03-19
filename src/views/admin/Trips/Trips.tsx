import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash/debounce'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmarExportacionExcelDialog from '@/components/shared/ConfirmarExportacionExcelDialog'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import Segment from '@/components/ui/Segment'
import Switcher from '@/components/ui/Switcher'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import classNames from '@/utils/classNames'
import TiempoRestanteViaje from '@/components/viajes/TiempoRestanteViaje'
import CreatableSelect from 'react-select/creatable'
import { NumericFormat } from 'react-number-format'
import {
    actualizarViajeAdministracion,
    crearViajeAdministracion,
    eliminarViajeAdministracion,
    exportarViajesAdministracion,
    obtenerCausalesEliminacionAdministracion,
    obtenerDetalleViajeAdministracion,
    obtenerSugerenciasEmpresasViajesAdministracion,
    obtenerViajesAdministracion,
} from '@/services/ViajesAdminService'
import {
    obtenerMunicipiosCatalogo,
    obtenerTiposCargaCatalogo,
    obtenerTiposVehiculoCatalogo,
} from '@/services/CatalogosService'
import { obtenerMiPerfil } from '@/services/ProfileService'
import { exportarExcel } from '@/utils/exportarExcel'
import {
    PiBroomDuotone,
    PiCurrencyDollarSimpleDuotone,
    PiDownloadSimpleDuotone,
    PiEyeDuotone,
    PiMagnifyingGlassDuotone,
    PiMapPinAreaDuotone,
    PiPencilSimpleLineDuotone,
    PiPlusCircleDuotone,
    PiTrashDuotone,
    PiTruckTrailerDuotone,
} from 'react-icons/pi'
import type {
    ActualizarViajeAdminPayload,
    CausalEliminacion,
    CrearViajeAdminPayload,
    EstadoFiltroViajeAdmin,
    ViajeAdmin,
    ViajeAdminExportacion,
} from '@/@types/viajesAdmin'
import type { PerfilActual } from '@/@types/profile'

type FormularioViaje = {
    empresa: string
    empresa_id: string
    origen: string
    destino: string
    tipo_carga: string
    peso: string
    valor: string
    comercial: string
    contacto: string
    observaciones: string
    conductor: string
    tipo_vehiculo: string
    premium_trip: boolean
    duration_hours: string
}

type OpcionSelectNumero = {
    value: number
    label: string
}

type OpcionSelectTexto = {
    value: string
    label: string
}

const crearOpcionTexto = (valor: string): OpcionSelectTexto => ({
    value: valor,
    label: valor,
})

const obtenerValorSeleccionadoTexto = (
    valor: string,
    opciones: OpcionSelectTexto[],
) => {
    const texto = normalizarTextoEspacios(valor)

    if (!texto) {
        return null
    }

    return (
        opciones.find(
            (item) =>
                normalizarTextoEspacios(item.value).toLocaleLowerCase('es-CO') ===
                texto.toLocaleLowerCase('es-CO'),
        ) || crearOpcionTexto(texto)
    )
}

const estilosSelectCatalogo = {
    menuPortal: (base: Record<string, unknown>) => ({
        ...base,
        zIndex: 9999,
    }),
}

const { THead, TBody, Tr, Th, Td } = Table

const opcionesEstadoViaje: { value: EstadoFiltroViajeAdmin; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'activo', label: 'Activos' },
    { value: 'inactivo', label: 'Inactivos' },
]

const estadoBadge: Record<'activo' | 'inactivo', string> = {
    activo: 'bg-success-subtle text-success',
    inactivo: 'bg-warning-subtle text-warning',
}

const maximoObservacion = 2000
const minimoObservacionOtro = 8
const opcionesTamanoPagina: OpcionSelectNumero[] = [
    { value: 8, label: '8' },
    { value: 12, label: '12' },
    { value: 20, label: '20' },
]

const formularioVacio: FormularioViaje = {
    empresa: '',
    empresa_id: '',
    origen: '',
    destino: '',
    tipo_carga: '',
    peso: '',
    valor: '',
    comercial: '',
    contacto: '',
    observaciones: '',
    conductor: '',
    tipo_vehiculo: '',
    premium_trip: false,
    duration_hours: '24',
}

const normalizarTextoEspacios = (valor: string) =>
    valor
        .trim()
        .replace(/\s+/g, ' ')

const deduplicarOpcionesTexto = (items: string[]) => {
    const mapa = new Map<string, string>()

    items.forEach((item) => {
        const normalizado = normalizarTextoEspacios(String(item || ''))
        const clave = normalizado.toLocaleLowerCase('es-CO')

        if (normalizado && !mapa.has(clave)) {
            mapa.set(clave, normalizado)
        }
    })

    return Array.from(mapa.values()).sort((a, b) =>
        a.localeCompare(b, 'es-CO', { sensitivity: 'base' }),
    )
}

const construirNombreCompletoPerfil = (perfil?: PerfilActual | null) =>
    [perfil?.first_name || '', perfil?.last_name || '']
        .map((item) => item.trim())
        .filter(Boolean)
        .join(' ')

const aplicarDefaultsPerfilEnFormulario = (
    formulario: FormularioViaje,
    perfil: PerfilActual | null,
): FormularioViaje => {
    if (!perfil) {
        return formulario
    }

    const empresaPorDefecto =
        perfil.is_company && perfil.company_name
            ? normalizarTextoEspacios(perfil.company_name)
            : ''
    const contactoPorDefecto = normalizarTextoEspacios(perfil.phone || '')
    const comercialPorDefecto = construirNombreCompletoPerfil(perfil)

    return {
        ...formulario,
        empresa: formulario.empresa || empresaPorDefecto,
        contacto: formulario.contacto || contactoPorDefecto,
        comercial: formulario.comercial || comercialPorDefecto,
    }
}

const formatearMoneda = (valor: number) =>
    `$ ${Number(valor || 0).toLocaleString('es-CO', {
        maximumFractionDigits: 0,
    })}`

const formatearFecha = (fechaISO: string) => {
    if (!fechaISO) {
        return '-'
    }

    const fecha = new Date(fechaISO)
    if (Number.isNaN(fecha.getTime())) {
        return '-'
    }

    return fecha.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const extraerMensajeError = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any,
    mensajeBase: string,
) => {
    const detalle = error?.response?.data?.detail
    const mensaje = error?.response?.data?.message
    const status = error?.response?.status

    if (typeof detalle === 'string' && detalle.trim()) {
        return detalle
    }

    if (Array.isArray(detalle) && detalle.length > 0) {
        const primerDetalle = detalle[0]

        if (typeof primerDetalle?.msg === 'string' && primerDetalle.msg.trim()) {
            return primerDetalle.msg
        }
    }

    if (typeof mensaje === 'string' && mensaje.trim()) {
        return mensaje
    }

    if (status === 500) {
        return 'Error interno del servidor. Intentalo nuevamente en unos minutos.'
    }

    return mensajeBase
}

const normalizarNombreCausal = (nombre: string) => {
    const texto = String(nombre || '')
        .trim()
        .toLocaleLowerCase('es-CO')

    if (texto.startsWith('otro') || texto.startsWith('otra')) {
        return 'Otra'
    }

    return nombre
}

const esCausalOtro = (nombre?: string | null) => {
    const texto = String(nombre || '')
        .trim()
        .toLocaleLowerCase('es-CO')
    return texto.startsWith('otro') || texto.startsWith('otra')
}

const construirFormularioDesdeViaje = (
    viaje: ViajeAdmin,
): FormularioViaje => ({
    empresa: '',
    empresa_id: viaje.empresa_id || '',
    origen: viaje.origen || '',
    destino: viaje.destino || '',
    tipo_carga: viaje.tipo_carga || '',
    peso: String(viaje.peso ?? ''),
    valor: String(viaje.valor ?? ''),
    comercial: viaje.comercial || '',
    contacto: viaje.contacto || '',
    observaciones: viaje.observaciones || '',
    conductor: viaje.conductor || '',
    tipo_vehiculo: viaje.tipo_vehiculo || '',
    premium_trip: Boolean(viaje.premium_trip),
    duration_hours: String(viaje.duration_hours ?? 24),
})

type CamposFormularioViajeProps = {
    formulario: FormularioViaje
    onChange: (campo: keyof FormularioViaje, valor: string | boolean) => void
    modo: 'crear' | 'editar'
    sugerenciasEmpresas?: string[]
    sugerenciasMunicipios?: string[]
    opcionesTipoCarga?: OpcionSelectTexto[]
    opcionesTipoVehiculo?: OpcionSelectTexto[]
    cargandoAyudas?: boolean
    errorAyudas?: string
}

const CamposFormularioViaje = ({
    formulario,
    onChange,
    modo,
    sugerenciasEmpresas = [],
    sugerenciasMunicipios = [],
    opcionesTipoCarga = [],
    opcionesTipoVehiculo = [],
    cargandoAyudas = false,
    errorAyudas = '',
}: CamposFormularioViajeProps) => {
    const opcionesEmpresa = sugerenciasEmpresas.map(crearOpcionTexto)
    const opcionesMunicipio = sugerenciasMunicipios.map(crearOpcionTexto)
    const opcionesCarga = opcionesTipoCarga
    const opcionesVehiculo = opcionesTipoVehiculo
    const menuPortalTarget =
        typeof window === 'undefined' ? undefined : document.body

    return (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {modo === 'crear' ? (
                <div>
                    <label className="text-sm text-gray-500">Empresa</label>
                    <Select<OpcionSelectTexto, false>
                        componentAs={CreatableSelect}
                        placeholder="Escribe o selecciona una empresa"
                        options={opcionesEmpresa}
                        value={obtenerValorSeleccionadoTexto(
                            formulario.empresa,
                            opcionesEmpresa,
                        )}
                        isClearable
                        isSearchable
                        openMenuOnFocus
                        menuPosition="fixed"
                        menuPlacement="auto"
                        menuPortalTarget={menuPortalTarget}
                        styles={estilosSelectCatalogo}
                        formatCreateLabel={(inputValue) =>
                            `Usar "${inputValue}" como empresa`
                        }
                        noOptionsMessage={({ inputValue }) =>
                            cargandoAyudas
                                ? 'Cargando empresas...'
                                : inputValue
                                  ? 'Presiona Enter para usar este nombre'
                                  : 'No hay empresas disponibles'
                        }
                        onChange={(option) =>
                            onChange('empresa', option?.value || '')
                        }
                        onCreateOption={(inputValue) =>
                            onChange('empresa', normalizarTextoEspacios(inputValue))
                        }
                        onBlur={(event) => {
                            const valor = normalizarTextoEspacios(
                                event.target.value || '',
                            )
                            if (valor) {
                                onChange('empresa', valor)
                            }
                        }}
                    />
                </div>
            ) : (
                <div>
                    <label className="text-sm text-gray-500">Empresa</label>
                    <Input
                        value={formulario.empresa_id}
                        onChange={(event) =>
                            onChange('empresa_id', event.target.value)
                        }
                        placeholder="UUID de empresa (pendiente)"
                    />
                </div>
            )}

            <div>
                <label className="text-sm text-gray-500">Tipo de carga</label>
                {modo === 'crear' ? (
                    <Select<OpcionSelectTexto, false>
                        componentAs={CreatableSelect}
                        placeholder="Selecciona o escribe un tipo de carga"
                        options={opcionesCarga}
                        value={obtenerValorSeleccionadoTexto(
                            formulario.tipo_carga,
                            opcionesCarga,
                        )}
                        isClearable
                        isSearchable
                        openMenuOnFocus
                        menuPosition="fixed"
                        menuPlacement="auto"
                        menuPortalTarget={menuPortalTarget}
                        styles={estilosSelectCatalogo}
                        formatCreateLabel={(inputValue) =>
                            `Usar "${inputValue}" como tipo de carga`
                        }
                        noOptionsMessage={({ inputValue }) =>
                            cargandoAyudas
                                ? 'Cargando tipos de carga...'
                                : inputValue
                                  ? 'Presiona Enter para usar este tipo de carga'
                                  : 'No hay opciones disponibles'
                        }
                        onChange={(option) =>
                            onChange('tipo_carga', option?.value || '')
                        }
                        onCreateOption={(inputValue) =>
                            onChange(
                                'tipo_carga',
                                normalizarTextoEspacios(inputValue),
                            )
                        }
                        onBlur={(event) => {
                            const valor = normalizarTextoEspacios(
                                event.target.value || '',
                            )
                            if (valor) {
                                onChange('tipo_carga', valor)
                            }
                        }}
                    />
                ) : (
                    <Input
                        value={formulario.tipo_carga}
                        onChange={(event) =>
                            onChange('tipo_carga', event.target.value)
                        }
                        placeholder="Tipo de carga"
                    />
                )}
            </div>
            <div>
                <label className="text-sm text-gray-500">Origen</label>
                {modo === 'crear' ? (
                    <Select<OpcionSelectTexto, false>
                        componentAs={CreatableSelect}
                        placeholder="Escribe o selecciona un municipio"
                        options={opcionesMunicipio}
                        value={obtenerValorSeleccionadoTexto(
                            formulario.origen,
                            opcionesMunicipio,
                        )}
                        isClearable
                        isSearchable
                        openMenuOnFocus
                        menuPosition="fixed"
                        menuPlacement="auto"
                        menuPortalTarget={menuPortalTarget}
                        styles={estilosSelectCatalogo}
                        formatCreateLabel={(inputValue) =>
                            `Usar "${inputValue}" como origen`
                        }
                        noOptionsMessage={({ inputValue }) =>
                            cargandoAyudas
                                ? 'Cargando municipios...'
                                : inputValue
                                  ? 'Presiona Enter para usar este municipio'
                                  : 'No hay municipios disponibles'
                        }
                        onChange={(option) =>
                            onChange('origen', option?.value || '')
                        }
                        onCreateOption={(inputValue) =>
                            onChange('origen', normalizarTextoEspacios(inputValue))
                        }
                        onBlur={(event) => {
                            const valor = normalizarTextoEspacios(
                                event.target.value || '',
                            )
                            if (valor) {
                                onChange('origen', valor)
                            }
                        }}
                    />
                ) : (
                    <Input
                        value={formulario.origen}
                        onChange={(event) =>
                            onChange('origen', event.target.value)
                        }
                        placeholder="Ciudad de origen"
                    />
                )}
            </div>
            <div>
                <label className="text-sm text-gray-500">Destino</label>
                {modo === 'crear' ? (
                    <Select<OpcionSelectTexto, false>
                        componentAs={CreatableSelect}
                        placeholder="Escribe o selecciona un municipio"
                        options={opcionesMunicipio}
                        value={obtenerValorSeleccionadoTexto(
                            formulario.destino,
                            opcionesMunicipio,
                        )}
                        isClearable
                        isSearchable
                        openMenuOnFocus
                        menuPosition="fixed"
                        menuPlacement="auto"
                        menuPortalTarget={menuPortalTarget}
                        styles={estilosSelectCatalogo}
                        formatCreateLabel={(inputValue) =>
                            `Usar "${inputValue}" como destino`
                        }
                        noOptionsMessage={({ inputValue }) =>
                            cargandoAyudas
                                ? 'Cargando municipios...'
                                : inputValue
                                  ? 'Presiona Enter para usar este municipio'
                                  : 'No hay municipios disponibles'
                        }
                        onChange={(option) =>
                            onChange('destino', option?.value || '')
                        }
                        onCreateOption={(inputValue) =>
                            onChange('destino', normalizarTextoEspacios(inputValue))
                        }
                        onBlur={(event) => {
                            const valor = normalizarTextoEspacios(
                                event.target.value || '',
                            )
                            if (valor) {
                                onChange('destino', valor)
                            }
                        }}
                    />
                ) : (
                    <Input
                        value={formulario.destino}
                        onChange={(event) =>
                            onChange('destino', event.target.value)
                        }
                        placeholder="Ciudad de destino"
                    />
                )}
            </div>
            <div>
                <label className="text-sm text-gray-500">
                    Peso {modo === 'crear' ? '(toneladas)' : ''}
                </label>
                <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formulario.peso}
                    onChange={(event) => onChange('peso', event.target.value)}
                    placeholder={
                        modo === 'crear' ? 'Peso en toneladas' : 'Peso'
                    }
                />
            </div>
            <div>
                <label className="text-sm text-gray-500">Valor</label>
                {modo === 'crear' ? (
                    <NumericFormat
                        customInput={Input}
                        value={formulario.valor}
                        thousandSeparator="."
                        decimalSeparator=","
                        allowNegative={false}
                        decimalScale={0}
                        valueIsNumericString
                        prefix="$ "
                        placeholder="Valor"
                        onValueChange={({ value }) => onChange('valor', value)}
                    />
                ) : (
                    <Input
                        type="number"
                        min={0}
                        value={formulario.valor}
                        onChange={(event) =>
                            onChange('valor', event.target.value)
                        }
                        placeholder="Valor"
                    />
                )}
            </div>
            <div>
                <label className="text-sm text-gray-500">Comercial</label>
                <Input
                    value={formulario.comercial}
                    onChange={(event) =>
                        onChange('comercial', event.target.value)
                    }
                    placeholder="Comercial"
                />
            </div>
            <div>
                <label className="text-sm text-gray-500">Contacto</label>
                <Input
                    value={formulario.contacto}
                    onChange={(event) => onChange('contacto', event.target.value)}
                    placeholder="Teléfono o contacto"
                />
            </div>
            <div>
                <label className="text-sm text-gray-500">Conductor</label>
                <Input
                    value={formulario.conductor}
                    onChange={(event) => onChange('conductor', event.target.value)}
                    placeholder="Nombre del conductor"
                />
            </div>
            <div>
                <label className="text-sm text-gray-500">Tipo de vehículo</label>
                {modo === 'crear' ? (
                    <Select<OpcionSelectTexto, false>
                        componentAs={CreatableSelect}
                        placeholder="Selecciona o escribe un tipo de vehículo"
                        options={opcionesVehiculo}
                        value={obtenerValorSeleccionadoTexto(
                            formulario.tipo_vehiculo,
                            opcionesVehiculo,
                        )}
                        isClearable
                        isSearchable
                        openMenuOnFocus
                        menuPosition="fixed"
                        menuPlacement="auto"
                        menuPortalTarget={menuPortalTarget}
                        styles={estilosSelectCatalogo}
                        formatCreateLabel={(inputValue) =>
                            `Usar "${inputValue}" como tipo de vehículo`
                        }
                        noOptionsMessage={({ inputValue }) =>
                            cargandoAyudas
                                ? 'Cargando tipos de vehículo...'
                                : inputValue
                                  ? 'Presiona Enter para usar este tipo de vehículo'
                                  : 'No hay opciones disponibles'
                        }
                        onChange={(option) =>
                            onChange('tipo_vehiculo', option?.value || '')
                        }
                        onCreateOption={(inputValue) =>
                            onChange(
                                'tipo_vehiculo',
                                normalizarTextoEspacios(inputValue),
                            )
                        }
                        onBlur={(event) => {
                            const valor = normalizarTextoEspacios(
                                event.target.value || '',
                            )
                            if (valor) {
                                onChange('tipo_vehiculo', valor)
                            }
                        }}
                    />
                ) : (
                    <Input
                        value={formulario.tipo_vehiculo}
                        onChange={(event) =>
                            onChange('tipo_vehiculo', event.target.value)
                        }
                        placeholder="Tipo de vehículo"
                    />
                )}
            </div>
            <div>
                <label className="text-sm text-gray-500">
                    Duración de publicación (horas)
                </label>
                <Input
                    type="number"
                    min={1}
                    max={168}
                    value={formulario.duration_hours}
                    onChange={(event) =>
                        onChange('duration_hours', event.target.value)
                    }
                    placeholder="24"
                />
            </div>
            <div className="flex items-end">
                <div className="rounded-xl border border-gray-200 px-3 py-2 w-full">
                    <label className="text-sm text-gray-500 block mb-2">
                        Viaje premium
                    </label>
                    <Switcher
                        checked={formulario.premium_trip}
                        onChange={(checked) =>
                            onChange('premium_trip', checked)
                        }
                    />
                </div>
            </div>
            <div className="md:col-span-2">
                <label className="text-sm text-gray-500">Observaciones</label>
                <Input
                    textArea
                    rows={4}
                    value={formulario.observaciones}
                    onChange={(event) =>
                        onChange('observaciones', event.target.value)
                    }
                    placeholder="Observaciones del viaje"
                />
            </div>

            {modo === 'crear' && (cargandoAyudas || errorAyudas) && (
                <div className="md:col-span-2">
                    {cargandoAyudas && (
                        <p className="text-xs text-gray-500">
                            Cargando sugerencias y valores por defecto...
                        </p>
                    )}
                    {!cargandoAyudas && errorAyudas && (
                        <p className="text-xs text-warning">{errorAyudas}</p>
                    )}
                </div>
            )}
        </div>
    )
}

const Trips = () => {
    const [textoBusqueda, setTextoBusqueda] = useState('')
    const [busquedaAplicada, setBusquedaAplicada] = useState('')
    const [estadoFiltro, setEstadoFiltro] =
        useState<EstadoFiltroViajeAdmin>('todos')

    const [paginaActual, setPaginaActual] = useState(1)
    const [tamanoPagina, setTamanoPagina] = useState(8)
    const [tokenRecarga, setTokenRecarga] = useState(0)

    const [viajes, setViajes] = useState<ViajeAdmin[]>([])
    const [totalViajes, setTotalViajes] = useState(0)
    const [cargandoViajes, setCargandoViajes] = useState(true)
    const [errorViajes, setErrorViajes] = useState('')

    const [causales, setCausales] = useState<CausalEliminacion[]>([])
    const [cargandoCausales, setCargandoCausales] = useState(false)
    const [errorCausales, setErrorCausales] = useState('')

    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false)
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)

    const [viajeSeleccionado, setViajeSeleccionado] = useState<ViajeAdmin | null>(
        null,
    )
    const [detalleViaje, setDetalleViaje] = useState<ViajeAdmin | null>(null)
    const [cargandoDetalle, setCargandoDetalle] = useState(false)

    const [formularioCrear, setFormularioCrear] =
        useState<FormularioViaje>(formularioVacio)
    const [erroresCrear, setErroresCrear] = useState<string[]>([])
    const [creandoViaje, setCreandoViaje] = useState(false)
    const [sugerenciasEmpresas, setSugerenciasEmpresas] = useState<string[]>([])
    const [sugerenciasMunicipios, setSugerenciasMunicipios] = useState<string[]>(
        [],
    )
    const [opcionesTipoCarga, setOpcionesTipoCarga] = useState<
        OpcionSelectTexto[]
    >([])
    const [opcionesTipoVehiculo, setOpcionesTipoVehiculo] = useState<
        OpcionSelectTexto[]
    >([])
    const [cargandoAyudasCrear, setCargandoAyudasCrear] = useState(false)
    const [errorAyudasCrear, setErrorAyudasCrear] = useState('')

    const [formularioEditar, setFormularioEditar] =
        useState<FormularioViaje>(formularioVacio)
    const [erroresEditar, setErroresEditar] = useState<string[]>([])
    const [guardandoEdicion, setGuardandoEdicion] = useState(false)

    const [causalSeleccionadaId, setCausalSeleccionadaId] = useState<number | null>(
        null,
    )
    const [observacionEliminar, setObservacionEliminar] = useState('')
    const [errorEliminar, setErrorEliminar] = useState('')
    const [eliminandoViaje, setEliminandoViaje] = useState(false)
    const [modalExportarAbierto, setModalExportarAbierto] = useState(false)
    const [exportandoExcel, setExportandoExcel] = useState(false)

    const controladorListadoRef = useRef<AbortController | null>(null)
    const recursosCrearCargadosRef = useRef(false)

    const recargarListado = useCallback(() => {
        setTokenRecarga((prev) => prev + 1)
    }, [])

    const aplicarBusquedaDebounce = useMemo(
        () =>
            debounce((valor: string) => {
                setPaginaActual(1)
                setBusquedaAplicada(valor)
            }, 350),
        [],
    )

    useEffect(() => {
        aplicarBusquedaDebounce(textoBusqueda.trim())
        return () => aplicarBusquedaDebounce.cancel()
    }, [textoBusqueda, aplicarBusquedaDebounce])

    useEffect(() => {
        let activo = true

        if (controladorListadoRef.current) {
            controladorListadoRef.current.abort()
        }

        const controller = new AbortController()
        controladorListadoRef.current = controller

        const cargarViajes = async () => {
            setCargandoViajes(true)
            setErrorViajes('')

            try {
                const data = await obtenerViajesAdministracion(
                    {
                        q: busquedaAplicada,
                        estado: estadoFiltro,
                        page: paginaActual,
                        page_size: tamanoPagina,
                    },
                    controller.signal,
                )

                if (!activo) {
                    return
                }

                setViajes(data.items || [])
                setTotalViajes(Number(data.total || 0))
            } catch (error) {
                if (!activo) {
                    return
                }

                if (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (error as any)?.code === 'ERR_CANCELED' ||
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (error as any)?.name === 'CanceledError'
                ) {
                    return
                }

                setViajes([])
                setTotalViajes(0)
                setErrorViajes(
                    extraerMensajeError(
                        error,
                        'No fue posible consultar los viajes administrativos.',
                    ),
                )
            } finally {
                if (activo) {
                    setCargandoViajes(false)
                }
            }
        }

        cargarViajes()

        return () => {
            activo = false
            controller.abort()
        }
    }, [busquedaAplicada, estadoFiltro, paginaActual, tamanoPagina, tokenRecarga])

    const cargarCausales = useCallback(async (signal?: AbortSignal) => {
        setCargandoCausales(true)
        setErrorCausales('')

        try {
            const data = await obtenerCausalesEliminacionAdministracion(signal)
            setCausales(
                (data || []).map((item) => ({
                    ...item,
                    nombre: normalizarNombreCausal(item.nombre),
                })),
            )
        } catch (error) {
            if (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any)?.code === 'ERR_CANCELED' ||
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any)?.name === 'CanceledError'
            ) {
                return
            }

            setErrorCausales(
                extraerMensajeError(
                    error,
                    'No fue posible cargar las causales de eliminación.',
                ),
            )
        } finally {
            setCargandoCausales(false)
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        cargarCausales(controller.signal)
        return () => controller.abort()
    }, [cargarCausales])

    useEffect(() => {
        if (modalEliminarAbierto && !causalSeleccionadaId && causales.length > 0) {
            setCausalSeleccionadaId(causales[0].id)
        }
    }, [modalEliminarAbierto, causalSeleccionadaId, causales])

    const cargarAyudasCrear = useCallback(async () => {
        setCargandoAyudasCrear(true)
        setErrorAyudasCrear('')

        const errores: string[] = []

        try {
            const perfil = await obtenerMiPerfil()
            setFormularioCrear((prev) =>
                aplicarDefaultsPerfilEnFormulario(prev, perfil),
            )
        } catch {
            errores.push(
                'No fue posible precargar toda la información del usuario autenticado.',
            )
        }

        if (!recursosCrearCargadosRef.current) {
            const resultados = await Promise.allSettled([
                obtenerSugerenciasEmpresasViajesAdministracion({ limit: 200 }),
                obtenerMunicipiosCatalogo(),
                obtenerTiposCargaCatalogo(),
                obtenerTiposVehiculoCatalogo(),
            ])

            const [
                empresasResult,
                municipiosResult,
                tiposCargaResult,
                vehiculosResult,
            ] = resultados

            if (empresasResult.status === 'fulfilled') {
                setSugerenciasEmpresas(
                    deduplicarOpcionesTexto(empresasResult.value || []),
                )
            } else {
                errores.push(
                    'No fue posible cargar todas las sugerencias de empresas.',
                )
            }

            if (municipiosResult.status === 'fulfilled') {
                setSugerenciasMunicipios(
                    deduplicarOpcionesTexto(municipiosResult.value || []),
                )
            } else {
                errores.push('No fue posible cargar el catálogo de municipios.')
            }

            if (tiposCargaResult.status === 'fulfilled') {
                const tiposCarga = deduplicarOpcionesTexto(
                    tiposCargaResult.value || [],
                )
                setOpcionesTipoCarga(
                    tiposCarga.map((item) => ({
                        value: item,
                        label: item,
                    })),
                )
            } else {
                errores.push('No fue posible cargar el catálogo de tipos de carga.')
            }

            if (vehiculosResult.status === 'fulfilled') {
                const vehiculos = deduplicarOpcionesTexto(
                    vehiculosResult.value || [],
                )
                setOpcionesTipoVehiculo(
                    vehiculos.map((item) => ({
                        value: item,
                        label: item,
                    })),
                )
            } else {
                errores.push(
                    'No fue posible cargar el catálogo de tipos de vehículo.',
                )
            }

            if (
                empresasResult.status === 'fulfilled' &&
                municipiosResult.status === 'fulfilled' &&
                tiposCargaResult.status === 'fulfilled' &&
                vehiculosResult.status === 'fulfilled'
            ) {
                recursosCrearCargadosRef.current = true
            }
        }

        setErrorAyudasCrear(errores.join(' '))
        setCargandoAyudasCrear(false)
    }, [])

    const buscarAhora = () => {
        aplicarBusquedaDebounce.cancel()
        setPaginaActual(1)
        setBusquedaAplicada(textoBusqueda.trim())
    }

    const limpiarBusqueda = () => {
        aplicarBusquedaDebounce.cancel()
        setTextoBusqueda('')
        setBusquedaAplicada('')
        setPaginaActual(1)
        setEstadoFiltro('todos')
    }

    const cerrarModalExportar = () => {
        setModalExportarAbierto(false)
        setExportandoExcel(false)
    }

    const abrirConfirmacionExportacion = () => {
        if (totalViajes === 0) {
            mostrarToast(
                'danger',
                'No hay viajes para exportar con los filtros seleccionados.',
            )
            return
        }

        setModalExportarAbierto(true)
    }

    const mostrarToast = (tipo: 'success' | 'danger', mensaje: string) => {
        toast.push(
            <Notification title="Administración de Viajes" type={tipo}>
                {mensaje}
            </Notification>,
            { placement: 'top-end' },
        )
    }

    const resumenFiltrosExportacion = useMemo(() => {
        const filtros: string[] = []

        if (busquedaAplicada.trim()) {
            filtros.push(`Búsqueda: ${busquedaAplicada.trim()}`)
        }

        if (estadoFiltro !== 'todos') {
            filtros.push(
                `Estado: ${estadoFiltro === 'activo' ? 'Activos' : 'Inactivos'}`,
            )
        }

        return filtros
    }, [busquedaAplicada, estadoFiltro])

    const consultarDetalleViaje = async (
        viaje: ViajeAdmin,
        destino: 'detalle' | 'edicion',
    ) => {
        setViajeSeleccionado(viaje)
        setCargandoDetalle(true)

        if (destino === 'detalle') {
            setModalDetalleAbierto(true)
        } else {
            setModalEditarAbierto(true)
            setErroresEditar([])
        }

        try {
            const data = await obtenerDetalleViajeAdministracion(viaje.id)
            setDetalleViaje(data)

            if (destino === 'edicion') {
                setFormularioEditar(construirFormularioDesdeViaje(data))
            }
        } catch (error) {
            const mensaje = extraerMensajeError(
                error,
                'No fue posible cargar el detalle del viaje.',
            )
            mostrarToast('danger', mensaje)

            if (destino === 'detalle') {
                setModalDetalleAbierto(false)
            } else {
                setModalEditarAbierto(false)
            }
        } finally {
            setCargandoDetalle(false)
        }
    }

    const abrirModalEliminar = (viaje: ViajeAdmin) => {
        setViajeSeleccionado(viaje)
        setErrorEliminar('')
        setObservacionEliminar('')
        setCausalSeleccionadaId(causales.length > 0 ? causales[0].id : null)
        setModalEliminarAbierto(true)

        if (causales.length === 0 && !cargandoCausales) {
            cargarCausales()
        }
    }

    const cerrarModalDetalle = () => {
        setModalDetalleAbierto(false)
        setDetalleViaje(null)
    }

    const abrirModalCrear = () => {
        setFormularioCrear(formularioVacio)
        setErroresCrear([])
        setModalCrearAbierto(true)
        void cargarAyudasCrear()
    }

    const cerrarModalCrear = () => {
        setModalCrearAbierto(false)
        setFormularioCrear(formularioVacio)
        setErroresCrear([])
    }

    const cerrarModalEditar = () => {
        setModalEditarAbierto(false)
        setDetalleViaje(null)
        setErroresEditar([])
        setFormularioEditar(formularioVacio)
    }

    const cerrarModalEliminar = () => {
        setModalEliminarAbierto(false)
        setErrorEliminar('')
        setObservacionEliminar('')
        setCausalSeleccionadaId(null)
    }

    const abrirEliminarDesdeEditar = () => {
        if (!viajeSeleccionado) {
            return
        }

        setModalEditarAbierto(false)
        setErroresEditar([])
        setDetalleViaje(null)
        abrirModalEliminar(viajeSeleccionado)
    }

    const validarFormulario = (formulario: FormularioViaje): string[] => {
        const errores: string[] = []

        if (!formulario.origen.trim()) {
            errores.push('El origen es obligatorio.')
        }
        if (!formulario.destino.trim()) {
            errores.push('El destino es obligatorio.')
        }
        if (!formulario.tipo_carga.trim()) {
            errores.push('El tipo de carga es obligatorio.')
        }

        const peso = Number(formulario.peso)
        if (Number.isNaN(peso) || peso < 0) {
            errores.push('El peso debe ser un numero mayor o igual a 0.')
        }

        const valor = Number(formulario.valor)
        if (Number.isNaN(valor) || valor < 0) {
            errores.push('El valor debe ser un numero mayor o igual a 0.')
        }

        const horas = Number(formulario.duration_hours)
        if (Number.isNaN(horas) || horas < 1 || horas > 168) {
            errores.push('La duracion de publicacion debe estar entre 1 y 168 horas.')
        }

        return errores
    }

    const crearViaje = async () => {
        const errores = validarFormulario(formularioCrear)
        if (errores.length > 0) {
            setErroresCrear(errores)
            return
        }

        const payload: CrearViajeAdminPayload = {
            origen: formularioCrear.origen.trim(),
            destino: formularioCrear.destino.trim(),
            tipo_carga: formularioCrear.tipo_carga.trim(),
            peso: Number(formularioCrear.peso),
            valor: Number(formularioCrear.valor),
            comercial: formularioCrear.comercial.trim() || undefined,
            contacto: formularioCrear.contacto.trim() || undefined,
            observaciones: formularioCrear.observaciones.trim() || undefined,
            conductor: formularioCrear.conductor.trim() || undefined,
            tipo_vehiculo: formularioCrear.tipo_vehiculo.trim() || undefined,
            premium_trip: Boolean(formularioCrear.premium_trip),
            duration_hours: Number(formularioCrear.duration_hours),
        }

        const empresa = formularioCrear.empresa.trim()
        if (empresa) {
            payload.empresa = empresa
        }

        const empresaId = formularioCrear.empresa_id.trim()
        if (empresaId) {
            payload.empresa_id = empresaId
        }

        setCreandoViaje(true)
        setErroresCrear([])

        try {
            await crearViajeAdministracion(payload)
            mostrarToast('success', 'Viaje creado correctamente.')
            cerrarModalCrear()
            setPaginaActual(1)
            recargarListado()
        } catch (error) {
            const mensaje = extraerMensajeError(
                error,
                'No fue posible crear el viaje.',
            )
            setErroresCrear([mensaje])
        } finally {
            setCreandoViaje(false)
        }
    }

    const guardarEdicion = async () => {
        if (!viajeSeleccionado) {
            return
        }

        const errores = validarFormulario(formularioEditar)
        if (errores.length > 0) {
            setErroresEditar(errores)
            return
        }

        const payload: ActualizarViajeAdminPayload = {
            origen: formularioEditar.origen.trim(),
            destino: formularioEditar.destino.trim(),
            tipo_carga: formularioEditar.tipo_carga.trim(),
            peso: Number(formularioEditar.peso),
            valor: Number(formularioEditar.valor),
            comercial: formularioEditar.comercial.trim(),
            contacto: formularioEditar.contacto.trim(),
            observaciones: formularioEditar.observaciones.trim(),
            conductor: formularioEditar.conductor.trim(),
            tipo_vehiculo: formularioEditar.tipo_vehiculo.trim(),
            premium_trip: Boolean(formularioEditar.premium_trip),
            duration_hours: Number(formularioEditar.duration_hours),
        }

        const empresa = formularioEditar.empresa_id.trim()
        if (empresa) {
            payload.empresa_id = empresa
        }

        setGuardandoEdicion(true)
        setErroresEditar([])

        try {
            await actualizarViajeAdministracion(viajeSeleccionado.id, payload)
            mostrarToast('success', 'Viaje actualizado correctamente.')
            cerrarModalEditar()
            recargarListado()
        } catch (error) {
            const mensaje = extraerMensajeError(
                error,
                'No fue posible actualizar el viaje.',
            )
            setErroresEditar([mensaje])
        } finally {
            setGuardandoEdicion(false)
        }
    }

    const causalSeleccionada = causales.find(
        (item) => item.id === causalSeleccionadaId,
    )
    const opcionesCausal = useMemo<OpcionSelectNumero[]>(
        () =>
            causales.map((causal) => ({
                value: causal.id,
                label: normalizarNombreCausal(causal.nombre),
            })),
        [causales],
    )
    const opcionCausalSeleccionada = useMemo(
        () =>
            opcionesCausal.find((item) => item.value === causalSeleccionadaId) ||
            null,
        [opcionesCausal, causalSeleccionadaId],
    )
    const opcionTamanoPagina = useMemo(
        () =>
            opcionesTamanoPagina.find((item) => item.value === tamanoPagina) ||
            opcionesTamanoPagina[0],
        [tamanoPagina],
    )
    const causalEsOtro = Boolean(
        esCausalOtro(causalSeleccionada?.nombre),
    )
    const longitudObservacion = observacionEliminar.trim().length

    const confirmarEliminacion = async () => {
        if (!viajeSeleccionado) {
            return
        }

        if (!causalSeleccionadaId) {
            setErrorEliminar('Debes seleccionar una causal de eliminación.')
            return
        }

        if (causalEsOtro && longitudObservacion === 0) {
            setErrorEliminar('La observación es obligatoria.')
            return
        }

        if (causalEsOtro && longitudObservacion < minimoObservacionOtro) {
            setErrorEliminar(
                `La observación debe tener mínimo ${minimoObservacionOtro} caracteres.`,
            )
            return
        }

        if (longitudObservacion > maximoObservacion) {
            setErrorEliminar(
                `La observación no debe superar ${maximoObservacion} caracteres.`,
            )
            return
        }

        setErrorEliminar('')
        setEliminandoViaje(true)

        try {
            await eliminarViajeAdministracion(viajeSeleccionado.id, {
                causal_id: causalSeleccionadaId,
                observacion: observacionEliminar.trim() || undefined,
            })

            mostrarToast(
                'success',
                'El viaje se elimino correctamente con trazabilidad administrativa.',
            )
            cerrarModalEliminar()
            recargarListado()
        } catch (error) {
            setErrorEliminar(
                extraerMensajeError(
                    error,
                    'No fue posible eliminar el viaje seleccionado.',
                ),
            )
        } finally {
            setEliminandoViaje(false)
        }
    }

    const actualizarCampoCrear = (
        campo: keyof FormularioViaje,
        valor: string | boolean,
    ) => {
        setFormularioCrear((prev) => ({
            ...prev,
            [campo]: valor,
        }))
    }

    const actualizarCampoEditar = (
        campo: keyof FormularioViaje,
        valor: string | boolean,
    ) => {
        setFormularioEditar((prev) => ({
            ...prev,
            [campo]: valor,
        }))
    }

    const onChangeEstado = (valor: string | string[]) => {
        if (typeof valor !== 'string') {
            return
        }

        if (opcionesEstadoViaje.some((item) => item.value === valor)) {
            setEstadoFiltro(valor as EstadoFiltroViajeAdmin)
            setPaginaActual(1)
        }
    }

    const confirmarExportacionExcel = async () => {
        if (totalViajes === 0) {
            cerrarModalExportar()
            mostrarToast(
                'danger',
                'No hay viajes para exportar con los filtros seleccionados.',
            )
            return
        }

        setExportandoExcel(true)

        try {
            const registros = await exportarViajesAdministracion({
                q: busquedaAplicada || undefined,
                estado: estadoFiltro,
            })

            if (!registros || registros.length === 0) {
                cerrarModalExportar()
                mostrarToast(
                    'danger',
                    'No hay viajes para exportar con los filtros seleccionados.',
                )
                return
            }

            exportarExcel({
                nombreArchivo: `viajes_admin_${new Date()
                    .toISOString()
                    .slice(0, 10)}`,
                nombreHoja: 'Viajes',
                filas: registros.map((viaje: ViajeAdminExportacion) => ({
                    'ID viaje': viaje.id_viaje,
                    Usuario: viaje.usuario || '-',
                    Empresa: viaje.empresa || '-',
                    Origen: viaje.origen,
                    Destino: viaje.destino,
                    Estado: viaje.estado,
                    'Tipo de carga': viaje.tipo_carga || '-',
                    Valor: Number(viaje.valor || 0),
                    'Fecha de creación': formatearFecha(viaje.fecha_creacion || ''),
                })),
            })

            cerrarModalExportar()
            mostrarToast('success', 'Los viajes se exportaron correctamente.')
        } catch (error) {
            setExportandoExcel(false)
            mostrarToast(
                'danger',
                extraerMensajeError(
                    error,
                    'No fue posible exportar los viajes a Excel.',
                ),
            )
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h5>Administración de Viajes</h5>
                            <p className="text-sm text-gray-500 mt-1">
                                Consulta, edicion y eliminacion de viajes con trazabilidad.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                                variant="default"
                                icon={<PiDownloadSimpleDuotone />}
                                onClick={abrirConfirmacionExportacion}
                            >
                                Exportar a Excel
                            </Button>
                            <Button
                                variant="solid"
                                icon={<PiPlusCircleDuotone />}
                                onClick={abrirModalCrear}
                            >
                                Crear viaje
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                        <div className="xl:col-span-5">
                            <Input
                                value={textoBusqueda}
                                onChange={(event) =>
                                    setTextoBusqueda(event.target.value)
                                }
                                prefix={<PiMagnifyingGlassDuotone />}
                                placeholder="Buscar por origen, destino, tipo, conductor, vehiculo o valor"
                            />
                        </div>

                        <div className="xl:col-span-4">
                            <Segment value={estadoFiltro} onChange={onChangeEstado}>
                                {opcionesEstadoViaje.map((item) => (
                                    <Segment.Item key={item.value} value={item.value}>
                                        {item.label}
                                    </Segment.Item>
                                ))}
                            </Segment>
                        </div>

                        <div className="xl:col-span-3 flex items-center justify-end gap-2">
                            <Button
                                size="sm"
                                variant="default"
                                icon={<PiMagnifyingGlassDuotone />}
                                onClick={buscarAhora}
                            >
                                Buscar
                            </Button>
                            <Button
                                size="sm"
                                variant="default"
                                icon={<PiBroomDuotone />}
                                onClick={limpiarBusqueda}
                            >
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </div>
            </AdaptiveCard>

            {errorViajes && (
                <div className="rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3">
                    {errorViajes}
                </div>
            )}

            <ConfirmarExportacionExcelDialog
                isOpen={modalExportarAbierto}
                titulo="Exportar viajes a Excel"
                mensaje="Antes de continuar, valida si tienes filtros activos. Solo esos registros quedarán incluidos en el archivo."
                resumen={resumenFiltrosExportacion}
                loading={exportandoExcel}
                onClose={cerrarModalExportar}
                onConfirm={confirmarExportacionExcel}
            />

            <AdaptiveCard>
                <div className="flex items-center justify-between mb-4">
                    <h5>Viajes en tarjetas</h5>
                    <p className="text-sm text-gray-500">
                        Total: {totalViajes.toLocaleString('es-CO')}
                    </p>
                </div>

                {cargandoViajes ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={`skeleton-viaje-${index}`}
                                className="rounded-2xl border border-gray-200 p-4 animate-pulse"
                            >
                                <div className="h-4 w-3/4 bg-gray-200 rounded-md" />
                                <div className="h-3 w-1/2 bg-gray-200 rounded-md mt-3" />
                                <div className="h-10 w-full bg-gray-100 rounded-md mt-4" />
                                <div className="h-8 w-full bg-gray-100 rounded-md mt-3" />
                            </div>
                        ))}
                    </div>
                ) : viajes.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                        No se encontraron viajes con los filtros actuales.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {viajes.map((viaje) => (
                            <AdaptiveCard
                                key={`card-${viaje.id}`}
                                className={classNames(
                                    'border border-gray-200',
                                    'shadow-[0_12px_28px_-20px_rgba(0,0,0,0.5)]',
                                )}
                            >
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-400 truncate">
                                                ID: {viaje.id}
                                            </p>
                                            <h5 className="mt-1 flex items-center gap-2 leading-tight">
                                                <PiMapPinAreaDuotone className="text-primary text-xl shrink-0" />
                                                <span className="truncate">
                                                    {viaje.origen} - {viaje.destino}
                                                </span>
                                            </h5>
                                        </div>
                                        <Tag
                                            className={estadoBadge[viaje.estado]}
                                            prefix={false}
                                        >
                                            {viaje.estado === 'activo'
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </Tag>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-gray-500">Tipo de carga</div>
                                        <div className="font-medium text-right truncate">
                                            {viaje.tipo_carga || '-'}
                                        </div>

                                        <div className="text-gray-500">Valor</div>
                                        <div className="font-semibold text-right flex items-center justify-end gap-1">
                                            <PiCurrencyDollarSimpleDuotone className="text-primary" />
                                            {formatearMoneda(viaje.valor)}
                                        </div>

                                        <div className="text-gray-500">Vehiculo</div>
                                        <div className="text-right truncate">
                                            {viaje.tipo_vehiculo || '-'}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3">
                                        <Button
                                            size="xs"
                                            variant="default"
                                            icon={<PiEyeDuotone />}
                                            onClick={() =>
                                                consultarDetalleViaje(viaje, 'detalle')
                                            }
                                        >
                                            Ver detalle
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="default"
                                            icon={<PiPencilSimpleLineDuotone />}
                                            onClick={() =>
                                                consultarDetalleViaje(viaje, 'edicion')
                                            }
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="default"
                                            icon={<PiTrashDuotone />}
                                            onClick={() => abrirModalEliminar(viaje)}
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            </AdaptiveCard>
                        ))}
                    </div>
                )}
            </AdaptiveCard>

            <AdaptiveCard>
                <div className="flex items-center justify-between mb-4">
                    <h5>Tabla administrativa de viajes</h5>
                    <div className="text-sm text-gray-500">
                        Pagina {paginaActual} de{' '}
                        {Math.max(1, Math.ceil(totalViajes / tamanoPagina))}
                    </div>
                </div>

                <Table>
                    <THead>
                        <Tr>
                            <Th>Ruta</Th>
                            <Th>Tipo</Th>
                            <Th>Valor</Th>
                            <Th>Estado</Th>
                            <Th>Fecha</Th>
                            <Th>Acciones</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {cargandoViajes ? (
                            <Tr>
                                <Td colSpan={6}>
                                    <div className="py-6 text-center text-gray-500">
                                        Cargando viajes...
                                    </div>
                                </Td>
                            </Tr>
                        ) : viajes.length === 0 ? (
                            <Tr>
                                <Td colSpan={6}>
                                    <div className="py-6 text-center text-gray-500">
                                        No hay viajes para mostrar.
                                    </div>
                                </Td>
                            </Tr>
                        ) : (
                            viajes.map((viaje) => (
                                <Tr key={`table-${viaje.id}`}>
                                    <Td>
                                        <div className="flex items-center gap-2 min-w-[220px]">
                                            <PiTruckTrailerDuotone className="text-lg text-primary shrink-0" />
                                            <span className="truncate">
                                                {viaje.origen} - {viaje.destino}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td>{viaje.tipo_carga || '-'}</Td>
                                    <Td>{formatearMoneda(viaje.valor)}</Td>
                                    <Td>
                                        <Tag
                                            className={estadoBadge[viaje.estado]}
                                            prefix={false}
                                        >
                                            {viaje.estado === 'activo'
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </Tag>
                                    </Td>
                                    <Td>{formatearFecha(viaje.fecha_publicacion)}</Td>
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="xs"
                                                variant="default"
                                                icon={<PiEyeDuotone />}
                                                onClick={() =>
                                                    consultarDetalleViaje(
                                                        viaje,
                                                        'detalle',
                                                    )
                                                }
                                            />
                                            <Button
                                                size="xs"
                                                variant="default"
                                                icon={<PiPencilSimpleLineDuotone />}
                                                onClick={() =>
                                                    consultarDetalleViaje(
                                                        viaje,
                                                        'edicion',
                                                    )
                                                }
                                            />
                                            <Button
                                                size="xs"
                                                variant="default"
                                                icon={<PiTrashDuotone />}
                                                onClick={() =>
                                                    abrirModalEliminar(viaje)
                                                }
                                            />
                                        </div>
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </TBody>
                </Table>

                <div className="mt-5 flex flex-col lg:flex-row items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2">
                    <Pagination
                        className="rounded-xl"
                        currentPage={paginaActual}
                        pageSize={tamanoPagina}
                        total={totalViajes}
                        onChange={setPaginaActual}
                    />

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Por página</span>
                        <div className="w-[120px]">
                            <Select
                                size="sm"
                                menuPlacement="top"
                                isSearchable={false}
                                value={opcionTamanoPagina}
                                options={opcionesTamanoPagina}
                                onChange={(option) => {
                                    setTamanoPagina(Number(option?.value || 8))
                                    setPaginaActual(1)
                                }}
                            />
                        </div>
                    </div>
                </div>
            </AdaptiveCard>

            <Dialog
                isOpen={modalDetalleAbierto}
                width={760}
                onClose={cerrarModalDetalle}
                onRequestClose={cerrarModalDetalle}
            >
                <div className="max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                        <h5>Detalle del viaje</h5>
                        <p className="text-sm text-gray-500 mt-1">
                            Vista de solo lectura del viaje seleccionado.
                        </p>
                    </div>

                    <div className="flex-1 px-6 py-4 overflow-y-auto">
                        {cargandoDetalle ? (
                            <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                                Cargando detalle...
                            </div>
                        ) : detalleViaje ? (
                            <div>
                                <TiempoRestanteViaje
                                    estado={detalleViaje.estado}
                                    createdAt={
                                        detalleViaje.created_at ||
                                        detalleViaje.fecha_publicacion
                                    }
                                    duracionPublicacion={
                                        detalleViaje.duracion_publicacion ??
                                        detalleViaje.duration_hours
                                    }
                                    duracionPublicacionUnidad={
                                        detalleViaje.duracion_publicacion_unidad ||
                                        'horas'
                                    }
                                    expiresAt={detalleViaje.expires_at}
                                />

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Ruta</p>
                                        <p className="font-semibold mt-1">
                                            {detalleViaje.origen} - {detalleViaje.destino}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Estado</p>
                                        <Tag
                                            className={estadoBadge[detalleViaje.estado]}
                                            prefix={false}
                                        >
                                            {detalleViaje.estado === 'activo'
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </Tag>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Tipo de carga</p>
                                        <p className="mt-1">
                                            {detalleViaje.tipo_carga || '-'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Valor</p>
                                        <p className="mt-1">
                                            {formatearMoneda(detalleViaje.valor)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Conductor</p>
                                        <p className="mt-1">
                                            {detalleViaje.conductor || '-'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Vehiculo</p>
                                        <p className="mt-1">
                                            {detalleViaje.tipo_vehiculo || '-'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Comercial</p>
                                        <p className="mt-1">
                                            {detalleViaje.comercial || '-'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Contacto</p>
                                        <p className="mt-1">
                                            {detalleViaje.contacto || '-'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3 md:col-span-2">
                                        <p className="text-gray-500">Observaciones</p>
                                        <p className="mt-1 whitespace-pre-wrap">
                                            {detalleViaje.observaciones || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                                No fue posible cargar el detalle del viaje.
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 bg-white">
                        <div className="flex justify-end">
                            <Button variant="default" onClick={cerrarModalDetalle}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={modalCrearAbierto}
                width={940}
                onClose={cerrarModalCrear}
                onRequestClose={cerrarModalCrear}
            >
                <div className="max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                        <h5>Crear viaje</h5>
                        <p className="text-sm text-gray-500 mt-1">
                            Registra un viaje nuevo usando las mismas reglas de negocio del flujo móvil.
                        </p>
                    </div>

                    <div className="flex-1 px-6 py-4 overflow-y-auto">
                        {erroresCrear.length > 0 && (
                            <div className="rounded-xl border border-error-subtle bg-error-subtle px-4 py-3 text-sm text-error">
                                <ul className="list-disc ml-5 space-y-1">
                                    {erroresCrear.map((error, index) => (
                                        <li key={`error-crear-${index}`}>
                                            {error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <CamposFormularioViaje
                            formulario={formularioCrear}
                            onChange={actualizarCampoCrear}
                            modo="crear"
                            sugerenciasEmpresas={sugerenciasEmpresas}
                            sugerenciasMunicipios={sugerenciasMunicipios}
                            opcionesTipoCarga={opcionesTipoCarga}
                            opcionesTipoVehiculo={opcionesTipoVehiculo}
                            cargandoAyudas={cargandoAyudasCrear}
                            errorAyudas={errorAyudasCrear}
                        />
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="default" onClick={cerrarModalCrear}>
                                Cancelar
                            </Button>
                            <Button
                                variant="solid"
                                loading={creandoViaje}
                                onClick={crearViaje}
                            >
                                Crear viaje
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={modalEditarAbierto}
                width={940}
                onClose={cerrarModalEditar}
                onRequestClose={cerrarModalEditar}
            >
                <div className="max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                        <h5>Editar viaje</h5>
                        <p className="text-sm text-gray-500 mt-1">
                            Actualiza los mismos campos con los que se crea un viaje.
                        </p>
                    </div>

                    <div className="flex-1 px-6 py-4 overflow-y-auto">
                        {cargandoDetalle ? (
                            <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                                Cargando información del viaje...
                            </div>
                        ) : (
                            <>
                                {erroresEditar.length > 0 && (
                                    <div className="rounded-xl border border-error-subtle bg-error-subtle px-4 py-3 text-sm text-error">
                                        <ul className="list-disc ml-5 space-y-1">
                                            {erroresEditar.map((error, index) => (
                                                <li key={`error-editar-${index}`}>
                                                    {error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <CamposFormularioViaje
                                    formulario={formularioEditar}
                                    onChange={actualizarCampoEditar}
                                    modo="editar"
                                />
                            </>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="default" onClick={cerrarModalEditar}>
                                Cancelar
                            </Button>
                            <Button variant="default" onClick={abrirEliminarDesdeEditar}>
                                Eliminar
                            </Button>
                            <Button
                                variant="solid"
                                loading={guardandoEdicion}
                                onClick={guardarEdicion}
                            >
                                Guardar cambios
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={modalEliminarAbierto}
                width={760}
                onClose={cerrarModalEliminar}
                onRequestClose={cerrarModalEliminar}
            >
                <div className="p-6">
                    <h5>Eliminar viaje</h5>
                    <p className="text-sm text-gray-500 mt-1">
                        Selecciona la causal y confirma la eliminación del viaje.
                    </p>

                    {viajeSeleccionado && (
                        <div className="mt-4 rounded-xl border border-gray-200 p-3 text-sm">
                            <p className="text-gray-500">Viaje seleccionado</p>
                            <p className="font-semibold mt-1">
                                {viajeSeleccionado.origen} - {viajeSeleccionado.destino}
                            </p>
                            <p className="text-gray-500 mt-1">
                                Valor: {formatearMoneda(viajeSeleccionado.valor)}
                            </p>
                        </div>
                    )}

                    <div className="mt-4">
                        <label className="text-sm text-gray-500">
                            Causal de eliminación
                        </label>
                        <Select
                            className="mt-1"
                            placeholder="Selecciona una causal"
                            value={opcionCausalSeleccionada}
                            options={opcionesCausal}
                            isLoading={cargandoCausales}
                            isDisabled={cargandoCausales}
                            isSearchable
                            isClearable={false}
                            noOptionsMessage={() => 'No hay causales disponibles'}
                            onChange={(option) =>
                                setCausalSeleccionadaId(
                                    option ? Number(option.value) : null,
                                )
                            }
                        />
                        {errorCausales && (
                            <p className="text-sm text-error mt-2">{errorCausales}</p>
                        )}
                    </div>

                    {causalEsOtro && (
                        <div className="mt-4">
                            <label className="text-sm text-gray-500">
                                Observación libre
                            </label>
                            <Input
                                textArea
                                rows={6}
                                value={observacionEliminar}
                                maxLength={maximoObservacion}
                                onChange={(event) =>
                                    setObservacionEliminar(event.target.value)
                                }
                                placeholder={`Escribe una observación (mínimo ${minimoObservacionOtro} caracteres).`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {longitudObservacion.toLocaleString('es-CO')} /{' '}
                                {maximoObservacion.toLocaleString('es-CO')} caracteres
                            </p>
                        </div>
                    )}

                    {!causalEsOtro && (
                        <div className="mt-4">
                            <label className="text-sm text-gray-500">
                                Observación adicional (opcional)
                            </label>
                            <Input
                                textArea
                                rows={4}
                                value={observacionEliminar}
                                maxLength={maximoObservacion}
                                onChange={(event) =>
                                    setObservacionEliminar(event.target.value)
                                }
                                placeholder="Observación adicional para trazabilidad."
                            />
                        </div>
                    )}

                    {errorEliminar && (
                        <div className="mt-4 rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3 text-sm">
                            {errorEliminar}
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <Button variant="default" onClick={cerrarModalEliminar}>
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            loading={eliminandoViaje}
                            onClick={confirmarEliminacion}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default Trips
