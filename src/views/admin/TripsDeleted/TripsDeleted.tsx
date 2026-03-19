import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash/debounce'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmarExportacionExcelDialog from '@/components/shared/ConfirmarExportacionExcelDialog'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import DatePicker from '@/components/ui/DatePicker'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import classNames from '@/utils/classNames'
import dayjs from 'dayjs'
import {
    exportarViajesEliminadosAdministracion,
    obtenerCausalesEliminacionAdministracion,
    obtenerDetalleViajeEliminadoAdministracion,
    obtenerViajesEliminadosAdministracion,
} from '@/services/ViajesAdminService'
import { exportarExcel } from '@/utils/exportarExcel'
import {
    PiBroomDuotone,
    PiCalendarDotsDuotone,
    PiCurrencyDollarSimpleDuotone,
    PiDownloadSimpleDuotone,
    PiEyeDuotone,
    PiMagnifyingGlassDuotone,
    PiMapPinLineDuotone,
    PiTrashDuotone,
} from 'react-icons/pi'
import type {
    CausalEliminacion,
    ViajeEliminadoAdmin,
    ViajeEliminadoAdminDetalle,
    ViajeEliminadoAdminExportacion,
} from '@/@types/viajesAdmin'

type OpcionSelectNumero = {
    value: number
    label: string
}

const { THead, TBody, Tr, Th, Td } = Table

const opcionesTamanoPagina: OpcionSelectNumero[] = [
    { value: 8, label: '8' },
    { value: 12, label: '12' },
    { value: 20, label: '20' },
]

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

    if (typeof mensaje === 'string' && mensaje.trim()) {
        return mensaje
    }

    if (status === 500) {
        return 'Error interno del servidor. Inténtalo nuevamente en unos minutos.'
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

const truncarTexto = (texto?: string | null, maximo = 90) => {
    const valor = String(texto || '').trim()
    if (!valor) {
        return '-'
    }

    if (valor.length <= maximo) {
        return valor
    }

    return `${valor.slice(0, maximo)}...`
}

const formatearMoneda = (valor: number) =>
    `$ ${Number(valor || 0).toLocaleString('es-CO', {
        maximumFractionDigits: 0,
    })}`

const convertirFechaISOAFecha = (valor: string): Date | null => {
    const texto = String(valor || '').trim()
    if (!texto) {
        return null
    }

    const [anio, mes, dia] = texto.split('-').map(Number)
    if (!anio || !mes || !dia) {
        return null
    }

    const fecha = new Date(anio, mes - 1, dia)
    return Number.isNaN(fecha.getTime()) ? null : fecha
}

const formatearFecha = (fechaISO?: string | null) => {
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

const claseTagCausal = (causalNombre: string) => {
    const causal = String(causalNombre || '')
        .trim()
        .toLocaleLowerCase('es-CO')

    if (causal.includes('fraude') || causal.includes('sospecha')) {
        return 'bg-error-subtle text-error'
    }

    if (causal.includes('duplicado')) {
        return 'bg-warning-subtle text-warning'
    }

    if (causal.startsWith('otra') || causal.startsWith('otro')) {
        return 'bg-primary-subtle text-primary'
    }

    return 'bg-success-subtle text-success'
}

const formatearEtiquetaSnapshot = (clave: string) =>
    ({
        id: 'ID',
        origen: 'Origen',
        destino: 'Destino',
        valor: 'Valor',
        estado: 'Estado',
        peso: 'Peso',
        created_at: 'Fecha de creación',
        updated_at: 'Fecha de actualización',
        fecha_publicacion: 'Fecha de publicación',
        expires_at: 'Vence el',
        tipo_carga: 'Tipo de carga',
        tipo_vehiculo: 'Tipo de vehículo',
        contacto: 'Contacto',
        comercial: 'Comercial',
        comercial_id: 'ID comercial',
        empresa_id: 'ID de empresa',
        premium_trip: 'Viaje prémium',
        observaciones: 'Observaciones',
        conductor: 'Conductor',
        duration_hours: 'Duración (horas)',
        duracion_publicacion: 'Duración de publicación',
        duracion_publicacion_unidad: 'Unidad de duración',
    }[clave] ||
        clave
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (letra) => letra.toUpperCase()))

const formatearValorSnapshot = (valor: unknown) => {
    if (valor === null || valor === undefined || valor === '') {
        return '-'
    }

    if (typeof valor === 'boolean') {
        return valor ? 'Sí' : 'No'
    }

    if (typeof valor === 'number') {
        return valor.toLocaleString('es-CO')
    }

    if (typeof valor === 'object') {
        return JSON.stringify(valor, null, 2)
    }

    return String(valor)
}

const TripsDeleted = () => {
    const [textoBusqueda, setTextoBusqueda] = useState('')
    const [busquedaAplicada, setBusquedaAplicada] = useState('')
    const [causalFiltroId, setCausalFiltroId] = useState<number | null>(null)
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [tamanoPagina, setTamanoPagina] = useState(8)

    const [causales, setCausales] = useState<CausalEliminacion[]>([])
    const [cargandoCausales, setCargandoCausales] = useState(false)
    const [errorCausales, setErrorCausales] = useState('')

    const [viajesEliminados, setViajesEliminados] = useState<ViajeEliminadoAdmin[]>(
        [],
    )
    const [totalViajesEliminados, setTotalViajesEliminados] = useState(0)
    const [cargandoListado, setCargandoListado] = useState(true)
    const [errorListado, setErrorListado] = useState('')

    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false)
    const [detalleSeleccionado, setDetalleSeleccionado] =
        useState<ViajeEliminadoAdminDetalle | null>(null)
    const [cargandoDetalle, setCargandoDetalle] = useState(false)
    const [errorDetalle, setErrorDetalle] = useState('')
    const [modalExportarAbierto, setModalExportarAbierto] = useState(false)
    const [exportandoExcel, setExportandoExcel] = useState(false)

    const controladorListadoRef = useRef<AbortController | null>(null)
    const controladorDetalleRef = useRef<AbortController | null>(null)

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
        const controller = new AbortController()

        const cargarCausales = async () => {
            setCargandoCausales(true)
            setErrorCausales('')

            try {
                const data = await obtenerCausalesEliminacionAdministracion(
                    controller.signal,
                )
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
        }

        cargarCausales()
        return () => controller.abort()
    }, [])

    const rangoFechasInvalido = useMemo(
        () =>
            Boolean(fechaDesde && fechaHasta && fechaDesde.trim() > fechaHasta.trim()),
        [fechaDesde, fechaHasta],
    )

    useEffect(() => {
        let activo = true

        if (rangoFechasInvalido) {
            setCargandoListado(false)
            setViajesEliminados([])
            setTotalViajesEliminados(0)
            setErrorListado(
                'El rango de fechas no es válido: la fecha desde no puede ser mayor que la fecha hasta.',
            )
            return
        }

        if (controladorListadoRef.current) {
            controladorListadoRef.current.abort()
        }

        const controller = new AbortController()
        controladorListadoRef.current = controller

        const cargarListado = async () => {
            setCargandoListado(true)
            setErrorListado('')

            try {
                const data = await obtenerViajesEliminadosAdministracion(
                    {
                        q: busquedaAplicada || undefined,
                        causal_id: causalFiltroId || undefined,
                        fecha_desde: fechaDesde || undefined,
                        fecha_hasta: fechaHasta || undefined,
                        page: paginaActual,
                        page_size: tamanoPagina,
                    },
                    controller.signal,
                )

                if (!activo) {
                    return
                }

                setViajesEliminados(data.items || [])
                setTotalViajesEliminados(Number(data.total || 0))
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

                setViajesEliminados([])
                setTotalViajesEliminados(0)
                setErrorListado(
                    extraerMensajeError(
                        error,
                        'No fue posible consultar el historial de viajes eliminados.',
                    ),
                )
            } finally {
                if (activo) {
                    setCargandoListado(false)
                }
            }
        }

        cargarListado()

        return () => {
            activo = false
            controller.abort()
        }
    }, [
        busquedaAplicada,
        causalFiltroId,
        fechaDesde,
        fechaHasta,
        paginaActual,
        tamanoPagina,
        rangoFechasInvalido,
    ])

    const mostrarToast = useCallback((tipo: 'success' | 'danger', mensaje: string) => {
        toast.push(
            <Notification title="Historial de Viajes Eliminados" type={tipo}>
                {mensaje}
            </Notification>,
            { placement: 'top-end' },
        )
    }, [])

    const abrirDetalle = async (viajeEliminado: ViajeEliminadoAdmin) => {
        if (controladorDetalleRef.current) {
            controladorDetalleRef.current.abort()
        }

        const controller = new AbortController()
        controladorDetalleRef.current = controller

        setModalDetalleAbierto(true)
        setCargandoDetalle(true)
        setErrorDetalle('')
        setDetalleSeleccionado(null)

        try {
            const data = await obtenerDetalleViajeEliminadoAdministracion(
                viajeEliminado.id,
                controller.signal,
            )
            setDetalleSeleccionado(data)
        } catch (error) {
            if (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any)?.code === 'ERR_CANCELED' ||
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any)?.name === 'CanceledError'
            ) {
                return
            }

            const mensaje = extraerMensajeError(
                error,
                'No fue posible consultar el detalle del viaje eliminado.',
            )
            setErrorDetalle(mensaje)
            mostrarToast('danger', mensaje)
        } finally {
            setCargandoDetalle(false)
        }
    }

    const cerrarModalDetalle = () => {
        if (controladorDetalleRef.current) {
            controladorDetalleRef.current.abort()
        }

        setModalDetalleAbierto(false)
        setDetalleSeleccionado(null)
        setErrorDetalle('')
        setCargandoDetalle(false)
    }

    const cerrarModalExportar = () => {
        setModalExportarAbierto(false)
        setExportandoExcel(false)
    }

    const limpiarFiltros = () => {
        aplicarBusquedaDebounce.cancel()
        setTextoBusqueda('')
        setBusquedaAplicada('')
        setCausalFiltroId(null)
        setFechaDesde('')
        setFechaHasta('')
        setPaginaActual(1)
    }

    const abrirConfirmacionExportacion = () => {
        if (totalViajesEliminados === 0 || rangoFechasInvalido) {
            mostrarToast(
                'danger',
                'No hay registros eliminados para exportar con los filtros seleccionados.',
            )
            return
        }

        setModalExportarAbierto(true)
    }

    const opcionesCausales = useMemo<OpcionSelectNumero[]>(
        () =>
            causales.map((item) => ({
                value: item.id,
                label: normalizarNombreCausal(item.nombre),
            })),
        [causales],
    )

    const opcionCausalSeleccionada = useMemo(
        () => opcionesCausales.find((item) => item.value === causalFiltroId) || null,
        [opcionesCausales, causalFiltroId],
    )

    const opcionTamanoPagina = useMemo(
        () =>
            opcionesTamanoPagina.find((item) => item.value === tamanoPagina) ||
            opcionesTamanoPagina[0],
        [tamanoPagina],
    )

    const fechaMaximaFiltro = useMemo(() => dayjs().endOf('day').toDate(), [])

    const resumenFiltrosExportacion = useMemo(() => {
        const filtros: string[] = []

        if (busquedaAplicada.trim()) {
            filtros.push(`Búsqueda: ${busquedaAplicada.trim()}`)
        }

        if (causalFiltroId) {
            const causal = opcionesCausales.find((item) => item.value === causalFiltroId)
            if (causal) {
                filtros.push(`Causal: ${causal.label}`)
            }
        }

        if (fechaDesde) {
            filtros.push(`Desde: ${fechaDesde}`)
        }

        if (fechaHasta) {
            filtros.push(`Hasta: ${fechaHasta}`)
        }

        return filtros
    }, [busquedaAplicada, causalFiltroId, fechaDesde, fechaHasta, opcionesCausales])

    const snapshotDetalle = useMemo(() => {
        if (!detalleSeleccionado?.snapshot_json) {
            return []
        }

        return Object.entries(detalleSeleccionado.snapshot_json)
    }, [detalleSeleccionado])

    const confirmarExportacionExcel = async () => {
        if (totalViajesEliminados === 0 || rangoFechasInvalido) {
            cerrarModalExportar()
            mostrarToast(
                'danger',
                'No hay registros eliminados para exportar con los filtros seleccionados.',
            )
            return
        }

        setExportandoExcel(true)

        try {
            const registros =
                await exportarViajesEliminadosAdministracion({
                    q: busquedaAplicada || undefined,
                    causal_id: causalFiltroId || undefined,
                    fecha_desde: fechaDesde || undefined,
                    fecha_hasta: fechaHasta || undefined,
                })

            if (!registros || registros.length === 0) {
                cerrarModalExportar()
                mostrarToast(
                    'danger',
                    'No hay registros eliminados para exportar con los filtros seleccionados.',
                )
                return
            }

            exportarExcel({
                nombreArchivo: `viajes_eliminados_${new Date()
                    .toISOString()
                    .slice(0, 10)}`,
                nombreHoja: 'Viajes eliminados',
                filas: registros.map((viaje: ViajeEliminadoAdminExportacion) => ({
                    'ID viaje': viaje.id_viaje,
                    Usuario: viaje.usuario || '-',
                    Empresa: viaje.empresa || '-',
                    Origen: viaje.origen || '-',
                    Destino: viaje.destino || '-',
                    'Causal de eliminación': viaje.causal_eliminacion,
                    Observación: viaje.observacion || '-',
                    'Fecha de creación del viaje':
                        formatearFecha(viaje.fecha_creacion_viaje),
                    'Fecha de eliminación': formatearFecha(viaje.fecha_eliminacion),
                })),
            })

            cerrarModalExportar()
            mostrarToast(
                'success',
                'El historial de viajes eliminados se exportó correctamente.',
            )
        } catch (error) {
            setExportandoExcel(false)
            mostrarToast(
                'danger',
                extraerMensajeError(
                    error,
                    'No fue posible exportar el historial de viajes eliminados.',
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
                            <h5>Historial de viajes eliminados</h5>
                            <p className="text-sm text-gray-500 mt-1">
                                Consulta de trazabilidad y auditoría operativa de eliminaciones.
                            </p>
                        </div>
                        <Button
                            variant="default"
                            icon={<PiDownloadSimpleDuotone />}
                            onClick={abrirConfirmacionExportacion}
                        >
                            Exportar a Excel
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                        <div className="xl:col-span-3">
                            <label className="text-sm text-gray-500">Búsqueda</label>
                            <Input
                                className="mt-1"
                                value={textoBusqueda}
                                onChange={(event) =>
                                    setTextoBusqueda(event.target.value)
                                }
                                prefix={<PiMagnifyingGlassDuotone />}
                                placeholder="Origen, destino, causal, observación o id de carga"
                            />
                        </div>

                        <div className="xl:col-span-3">
                            <label className="text-sm text-gray-500">Causal</label>
                            <Select
                                className="mt-1"
                                placeholder="Todas las causales"
                                value={opcionCausalSeleccionada}
                                options={opcionesCausales}
                                isLoading={cargandoCausales}
                                isDisabled={cargandoCausales}
                                isSearchable
                                isClearable
                                menuPlacement="bottom"
                                menuPosition="fixed"
                                menuPortalTarget={
                                    typeof window !== 'undefined'
                                        ? document.body
                                        : undefined
                                }
                                styles={{
                                    menuPortal: (base) => ({
                                        ...base,
                                        zIndex: 60,
                                    }),
                                }}
                                noOptionsMessage={() => 'No hay causales disponibles'}
                                onChange={(option) => {
                                    setCausalFiltroId(
                                        option ? Number(option.value) : null,
                                    )
                                    setPaginaActual(1)
                                }}
                            />
                            {errorCausales && (
                                <p className="text-sm text-error mt-2">{errorCausales}</p>
                            )}
                        </div>

                        <div className="xl:col-span-2">
                            <label className="text-sm text-gray-500">Desde</label>
                            <DatePicker
                                className="mt-1"
                                value={convertirFechaISOAFecha(fechaDesde)}
                                inputFormat="YYYY-MM-DD"
                                placeholder="YYYY-MM-DD"
                                maxDate={fechaMaximaFiltro}
                                onChange={(fecha) => {
                                    setFechaDesde(
                                        fecha
                                            ? dayjs(fecha).format('YYYY-MM-DD')
                                            : '',
                                    )
                                    setPaginaActual(1)
                                }}
                            />
                        </div>

                        <div className="xl:col-span-2">
                            <label className="text-sm text-gray-500">Hasta</label>
                            <DatePicker
                                className="mt-1"
                                value={convertirFechaISOAFecha(fechaHasta)}
                                inputFormat="YYYY-MM-DD"
                                placeholder="YYYY-MM-DD"
                                maxDate={fechaMaximaFiltro}
                                onChange={(fecha) => {
                                    setFechaHasta(
                                        fecha
                                            ? dayjs(fecha).format('YYYY-MM-DD')
                                            : '',
                                    )
                                    setPaginaActual(1)
                                }}
                            />
                        </div>

                        <div className="xl:col-span-2 flex items-end xl:justify-end">
                            <Button
                                size="sm"
                                variant="default"
                                icon={<PiBroomDuotone />}
                                className="w-full xl:w-auto xl:min-w-[120px]"
                                onClick={limpiarFiltros}
                            >
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </div>
            </AdaptiveCard>

            {errorListado && (
                <div className="rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3">
                    {errorListado}
                </div>
            )}

            <ConfirmarExportacionExcelDialog
                isOpen={modalExportarAbierto}
                titulo="Exportar historial de viajes eliminados"
                mensaje="Antes de continuar, valida si tienes filtros activos. Solo esos registros quedarán incluidos en el archivo."
                resumen={resumenFiltrosExportacion}
                loading={exportandoExcel}
                onClose={cerrarModalExportar}
                onConfirm={confirmarExportacionExcel}
            />

            <AdaptiveCard>
                <div className="flex items-center justify-between mb-4">
                    <h5>Registros eliminados</h5>
                    <p className="text-sm text-gray-500">
                        Total: {totalViajesEliminados.toLocaleString('es-CO')}
                    </p>
                </div>

                <Table>
                    <THead>
                        <Tr>
                            <Th>Ruta</Th>
                            <Th>Valor</Th>
                            <Th>Causal</Th>
                            <Th>Observación</Th>
                            <Th>Eliminado por</Th>
                            <Th>Fecha de eliminación</Th>
                            <Th>Acciones</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {cargandoListado ? (
                            <Tr>
                                <Td colSpan={7}>
                                    <div className="py-6 text-center text-gray-500">
                                        Cargando historial de viajes eliminados...
                                    </div>
                                </Td>
                            </Tr>
                        ) : viajesEliminados.length === 0 ? (
                            <Tr>
                                <Td colSpan={7}>
                                    <div className="py-6 text-center text-gray-500">
                                        No hay registros de viajes eliminados con los filtros
                                        actuales.
                                    </div>
                                </Td>
                            </Tr>
                        ) : (
                            viajesEliminados.map((viajeEliminado) => (
                                <Tr key={viajeEliminado.id}>
                                    <Td>
                                        <div className="flex items-center gap-2 min-w-[220px]">
                                            <PiMapPinLineDuotone className="text-lg text-primary shrink-0" />
                                            <span className="truncate">
                                                {viajeEliminado.origen || 'No disponible'} -{' '}
                                                {viajeEliminado.destino || 'No disponible'}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <PiCurrencyDollarSimpleDuotone className="text-primary" />
                                            {formatearMoneda(viajeEliminado.valor)}
                                        </div>
                                    </Td>
                                    <Td>
                                        <Tag
                                            className={classNames(
                                                claseTagCausal(
                                                    viajeEliminado.causal_nombre,
                                                ),
                                            )}
                                            prefix={false}
                                        >
                                            {normalizarNombreCausal(
                                                viajeEliminado.causal_nombre,
                                            )}
                                        </Tag>
                                    </Td>
                                    <Td>
                                        <span
                                            className="block max-w-[320px] truncate"
                                            title={viajeEliminado.observacion || ''}
                                        >
                                            {truncarTexto(viajeEliminado.observacion)}
                                        </span>
                                    </Td>
                                    <Td>
                                        {viajeEliminado.eliminado_por || 'No disponible'}
                                    </Td>
                                    <Td>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <PiCalendarDotsDuotone className="text-primary" />
                                            {formatearFecha(viajeEliminado.eliminado_en)}
                                        </div>
                                    </Td>
                                    <Td>
                                        <Button
                                            size="xs"
                                            variant="default"
                                            icon={<PiEyeDuotone />}
                                            onClick={() => abrirDetalle(viajeEliminado)}
                                        >
                                            Ver detalle
                                        </Button>
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
                        total={totalViajesEliminados}
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
                width={860}
                onClose={cerrarModalDetalle}
                onRequestClose={cerrarModalDetalle}
            >
                <div className="max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                        <h5 className="inline-flex items-center gap-2">
                            <PiTrashDuotone className="text-primary" />
                            <span>Detalle del viaje eliminado</span>
                        </h5>
                        <p className="text-sm text-gray-500 mt-1">
                            Información completa para trazabilidad administrativa.
                        </p>
                    </div>

                    <div className="flex-1 px-6 py-4 overflow-y-auto">
                        {cargandoDetalle ? (
                            <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                                Cargando detalle...
                            </div>
                        ) : errorDetalle ? (
                            <div className="rounded-xl border border-error-subtle bg-error-subtle px-4 py-3 text-error">
                                {errorDetalle}
                            </div>
                        ) : detalleSeleccionado ? (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-gray-200 p-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <h5 className="leading-tight">
                                            {detalleSeleccionado.origen || 'No disponible'} -{' '}
                                            {detalleSeleccionado.destino ||
                                                'No disponible'}
                                        </h5>
                                        <Tag
                                            className={classNames(
                                                claseTagCausal(
                                                    detalleSeleccionado.causal_nombre,
                                                ),
                                            )}
                                            prefix={false}
                                        >
                                            {normalizarNombreCausal(
                                                detalleSeleccionado.causal_nombre,
                                            )}
                                        </Tag>
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Valor</p>
                                            <p className="font-semibold mt-1">
                                                {formatearMoneda(
                                                    detalleSeleccionado.valor,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Eliminado por</p>
                                            <p className="mt-1">
                                                {detalleSeleccionado.eliminado_por ||
                                                    'No disponible'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">
                                                Fecha de eliminación
                                            </p>
                                            <p className="mt-1">
                                                {formatearFecha(
                                                    detalleSeleccionado.eliminado_en,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Tipo de carga</p>
                                        <p className="mt-1">
                                            {detalleSeleccionado.tipo_carga || '-'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Estado original</p>
                                        <p className="mt-1">
                                            {detalleSeleccionado.estado
                                                ? detalleSeleccionado.estado ===
                                                  'activo'
                                                    ? 'Activo'
                                                    : 'Inactivo'
                                                : '-'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">Fecha publicación</p>
                                        <p className="mt-1">
                                            {formatearFecha(
                                                detalleSeleccionado.fecha_publicacion,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <p className="text-gray-500">ID de carga</p>
                                        <p className="mt-1 break-all">
                                            {detalleSeleccionado.carga_id}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3 md:col-span-2">
                                        <p className="text-gray-500">
                                            Observación completa
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap">
                                            {detalleSeleccionado.observacion || '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500 font-medium mb-3">
                                        Instantánea del registro
                                    </p>

                                    {snapshotDetalle.length === 0 ? (
                                        <p className="text-sm text-gray-500">
                                            No hay instantánea disponible para este
                                            registro.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            {snapshotDetalle.map(
                                                ([clave, valor], index) => (
                                                    <div
                                                        key={`snapshot-${clave}-${index}`}
                                                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                                                    >
                                                        <p className="text-gray-500 text-xs">
                                                            {formatearEtiquetaSnapshot(
                                                                clave,
                                                            )}
                                                        </p>
                                                        <pre className="mt-1 whitespace-pre-wrap break-words text-xs font-sans text-gray-700">
                                                            {formatearValorSnapshot(
                                                                valor,
                                                            )}
                                                        </pre>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                                No fue posible cargar el detalle del viaje eliminado.
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
        </div>
    )
}

export default TripsDeleted
