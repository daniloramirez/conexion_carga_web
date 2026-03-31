import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash/debounce'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import acronym from '@/utils/acronym'
import {
    obtenerPuntosReferidos,
    obtenerReferidosDeUsuario,
    quitarReferidoDeUsuario,
} from '@/services/PuntosReferidosService'
import {
    PiBroomDuotone,
    PiBuildingsDuotone,
    PiCaretDownBold,
    PiEnvelopeSimpleDuotone,
    PiIdentificationCardDuotone,
    PiMagnifyingGlassDuotone,
    PiMedalDuotone,
    PiPhoneDuotone,
    PiSpinnerGapDuotone,
    PiTrashDuotone,
    PiUsersThreeDuotone,
} from 'react-icons/pi'
import type {
    UsuarioPuntosReferidos,
    UsuarioReferido,
} from '@/@types/puntosReferidos'

type OpcionSelectNumero = {
    value: number
    label: string
}

type UsuarioVisual = {
    first_name?: string | null
    last_name?: string | null
    email?: string | null
}

const { THead, TBody, Tr, Th, Td } = Table

const opcionesTamanoPagina: OpcionSelectNumero[] = [
    { value: 8, label: '8' },
    { value: 12, label: '12' },
    { value: 20, label: '20' },
]

const estadoBadge = {
    habilitado: 'bg-success-subtle text-success',
    inhabilitado: 'bg-warning-subtle text-warning',
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

    if (typeof mensaje === 'string' && mensaje.trim()) {
        return mensaje
    }

    if (status === 500) {
        return 'Error interno del servidor. Inténtalo nuevamente en unos minutos.'
    }

    return mensajeBase
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

const obtenerNombreCompleto = (usuario: UsuarioVisual) =>
    `${usuario.first_name || ''} ${usuario.last_name || ''}`.trim() || '-'

const obtenerInicialesUsuario = (usuario: UsuarioVisual) => {
    const nombreCompleto = obtenerNombreCompleto(usuario)
    if (nombreCompleto && nombreCompleto !== '-') {
        return acronym(nombreCompleto).slice(0, 2).toUpperCase()
    }

    const correo = (usuario.email || '').trim()
    if (!correo) {
        return 'US'
    }

    return acronym(correo.split('@')[0]).slice(0, 2).toUpperCase() || 'US'
}

const obtenerInsigniaRanking = (posicion: number) => {
    if (posicion === 1) {
        return (
            <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-500 shadow-sm"
                title="Primer lugar"
            >
                <PiMedalDuotone className="text-lg" />
            </span>
        )
    }

    if (posicion === 2) {
        return (
            <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm"
                title="Segundo lugar"
            >
                <PiMedalDuotone className="text-lg" />
            </span>
        )
    }

    if (posicion === 3) {
        return (
            <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-500 shadow-sm"
                title="Tercer lugar"
            >
                <PiMedalDuotone className="text-lg" />
            </span>
        )
    }

    return (
        <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-subtle text-primary shadow-sm"
            title={`Posición ${posicion}`}
        >
            <span className="text-base leading-none">🎗️</span>
        </span>
    )
}

const ReferralPoints = () => {
    const [textoBusqueda, setTextoBusqueda] = useState('')
    const [busquedaAplicada, setBusquedaAplicada] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [tamanoPagina, setTamanoPagina] = useState(8)

    const [usuarios, setUsuarios] = useState<UsuarioPuntosReferidos[]>([])
    const [totalUsuarios, setTotalUsuarios] = useState(0)
    const [cargandoUsuarios, setCargandoUsuarios] = useState(true)
    const [errorUsuarios, setErrorUsuarios] = useState('')

    const [usuariosExpandidos, setUsuariosExpandidos] = useState<
        Record<string, boolean>
    >({})
    const [referidosPorPadre, setReferidosPorPadre] = useState<
        Record<string, UsuarioReferido[]>
    >({})
    const [cargandoReferidos, setCargandoReferidos] = useState<
        Record<string, boolean>
    >({})
    const [erroresReferidos, setErroresReferidos] = useState<
        Record<string, string>
    >({})
    const [quitandoReferidoId, setQuitandoReferidoId] = useState<string | null>(
        null,
    )

    const controladorListadoRef = useRef<AbortController | null>(null)
    const controladoresReferidosRef = useRef<Record<string, AbortController>>({})

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
        return () => {
            if (controladorListadoRef.current) {
                controladorListadoRef.current.abort()
            }

            Object.values(controladoresReferidosRef.current).forEach((controller) =>
                controller.abort(),
            )
        }
    }, [])

    useEffect(() => {
        setUsuariosExpandidos({})
        setReferidosPorPadre({})
        setCargandoReferidos({})
        setErroresReferidos({})

        Object.values(controladoresReferidosRef.current).forEach((controller) =>
            controller.abort(),
        )
        controladoresReferidosRef.current = {}
    }, [busquedaAplicada, paginaActual, tamanoPagina])

    useEffect(() => {
        let activo = true

        if (controladorListadoRef.current) {
            controladorListadoRef.current.abort()
        }

        const controller = new AbortController()
        controladorListadoRef.current = controller

        const cargarUsuarios = async () => {
            setCargandoUsuarios(true)
            setErrorUsuarios('')

            try {
                const data = await obtenerPuntosReferidos(
                    {
                        q: busquedaAplicada,
                        page: paginaActual,
                        page_size: tamanoPagina,
                    },
                    controller.signal,
                )

                if (!activo) {
                    return
                }

                setUsuarios(data.items || [])
                setTotalUsuarios(Number(data.total || 0))
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

                setUsuarios([])
                setTotalUsuarios(0)
                setErrorUsuarios(
                    extraerMensajeError(
                        error,
                        'No fue posible consultar el ranking de puntos por referidos.',
                    ),
                )
            } finally {
                if (activo) {
                    setCargandoUsuarios(false)
                }
            }
        }

        cargarUsuarios()

        return () => {
            activo = false
            controller.abort()
        }
    }, [busquedaAplicada, paginaActual, tamanoPagina])

    const opcionTamanoSeleccionada = useMemo(
        () =>
            opcionesTamanoPagina.find((item) => item.value === tamanoPagina) ||
            opcionesTamanoPagina[0],
        [tamanoPagina],
    )

    const mostrarToast = useCallback((tipo: 'success' | 'danger', mensaje: string) => {
        toast.push(
            <Notification title="Puntos por referidos" type={tipo}>
                {mensaje}
            </Notification>,
            { placement: 'top-end' },
        )
    }, [])

    const limpiarFiltros = () => {
        aplicarBusquedaDebounce.cancel()
        setTextoBusqueda('')
        setBusquedaAplicada('')
        setPaginaActual(1)
    }

    const cargarReferidosUsuario = useCallback(
        async (usuario: UsuarioPuntosReferidos) => {
            const usuarioId = usuario.id

            if (controladoresReferidosRef.current[usuarioId]) {
                controladoresReferidosRef.current[usuarioId].abort()
            }

            const controller = new AbortController()
            controladoresReferidosRef.current[usuarioId] = controller

            setCargandoReferidos((prev) => ({ ...prev, [usuarioId]: true }))
            setErroresReferidos((prev) => ({ ...prev, [usuarioId]: '' }))

            try {
                const data = await obtenerReferidosDeUsuario(
                    usuarioId,
                    controller.signal,
                )
                const items = data.items || []
                const total = Number(data.total ?? items.length ?? 0)

                setReferidosPorPadre((prev) => ({ ...prev, [usuarioId]: items }))
                setUsuarios((prev) =>
                    prev.map((item) =>
                        item.id === usuarioId
                            ? {
                                  ...item,
                                  referred_count: total,
                              }
                            : item,
                    ),
                )

                if (total === 0) {
                    setUsuariosExpandidos((prev) => ({ ...prev, [usuarioId]: false }))
                }
            } catch (error) {
                if (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (error as any)?.code === 'ERR_CANCELED' ||
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (error as any)?.name === 'CanceledError'
                ) {
                    return
                }

                setErroresReferidos((prev) => ({
                    ...prev,
                    [usuarioId]: extraerMensajeError(
                        error,
                        'No fue posible consultar los referidos del usuario.',
                    ),
                }))
            } finally {
                setCargandoReferidos((prev) => ({ ...prev, [usuarioId]: false }))
                delete controladoresReferidosRef.current[usuarioId]
            }
        },
        [],
    )

    const alternarReferidosUsuario = useCallback(
        async (usuario: UsuarioPuntosReferidos) => {
            if (Number(usuario.referred_count || 0) <= 0) {
                return
            }

            const estaExpandido = Boolean(usuariosExpandidos[usuario.id])
            if (estaExpandido) {
                setUsuariosExpandidos((prev) => ({ ...prev, [usuario.id]: false }))
                return
            }

            setUsuariosExpandidos((prev) => ({ ...prev, [usuario.id]: true }))

            if (!referidosPorPadre[usuario.id]) {
                await cargarReferidosUsuario(usuario)
            }
        },
        [cargarReferidosUsuario, referidosPorPadre, usuariosExpandidos],
    )

    const quitarReferido = useCallback(
        async (usuarioPadre: UsuarioPuntosReferidos, referido: UsuarioReferido) => {
            setQuitandoReferidoId(referido.id)
            setErroresReferidos((prev) => ({ ...prev, [usuarioPadre.id]: '' }))

            try {
                const response = await quitarReferidoDeUsuario(
                    usuarioPadre.id,
                    referido.id,
                )

                setReferidosPorPadre((prev) => {
                    const referidosActuales = prev[usuarioPadre.id] || []
                    return {
                        ...prev,
                        [usuarioPadre.id]: referidosActuales.filter(
                            (item) => item.id !== referido.id,
                        ),
                    }
                })

                setUsuarios((prev) =>
                    prev.map((item) =>
                        item.id === usuarioPadre.id ? response.parent_user : item,
                    ),
                )

                if (Number(response.parent_user.referred_count || 0) <= 0) {
                    setUsuariosExpandidos((prev) => ({
                        ...prev,
                        [usuarioPadre.id]: false,
                    }))
                }

                mostrarToast('success', response.message)
            } catch (error) {
                const mensaje = extraerMensajeError(
                    error,
                    'No fue posible quitar el referido seleccionado.',
                )
                setErroresReferidos((prev) => ({
                    ...prev,
                    [usuarioPadre.id]: mensaje,
                }))
                mostrarToast('danger', mensaje)
            } finally {
                setQuitandoReferidoId(null)
            }
        },
        [mostrarToast],
    )

    return (
        <div className="flex flex-col gap-6">
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                            <h5 className="inline-flex items-center gap-2">
                                <PiMedalDuotone className="text-primary text-xl" />
                                <span>Puntos por referidos</span>
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">
                                Ranking administrativo con gestión directa de referidos
                                reales a partir de la relación registrada en usuarios.
                            </p>
                        </div>
                        <Tag
                            className="bg-primary-subtle text-primary px-3 py-1.5 text-sm"
                            prefix={false}
                        >
                            Total ranking: {totalUsuarios.toLocaleString('es-CO')}
                        </Tag>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                        <div className="xl:col-span-10">
                            <Input
                                value={textoBusqueda}
                                onChange={(event) =>
                                    setTextoBusqueda(event.target.value)
                                }
                                prefix={<PiMagnifyingGlassDuotone />}
                                placeholder="Buscar por nombre, correo, teléfono o empresa"
                            />
                        </div>

                        <div className="xl:col-span-2 flex justify-end">
                            <Button
                                variant="default"
                                icon={<PiBroomDuotone />}
                                onClick={limpiarFiltros}
                            >
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </div>
            </AdaptiveCard>

            {errorUsuarios && (
                <div className="rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3">
                    {errorUsuarios}
                </div>
            )}

            <AdaptiveCard>
                <div className="flex items-center justify-between mb-4">
                    <h5>Ranking de usuarios</h5>
                    <p className="text-sm text-gray-500">
                        Expande cada usuario con referidos para gestionar la relación
                        individualmente.
                    </p>
                </div>

                <Table>
                    <THead>
                        <Tr>
                            <Th>Usuario</Th>
                            <Th>Puntos</Th>
                            <Th>Fecha de creación</Th>
                            <Th>Estado</Th>
                            <Th>Referidos</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {cargandoUsuarios ? (
                            <Tr>
                                <Td colSpan={5}>
                                    <div className="py-6 text-center text-gray-500">
                                        Cargando ranking...
                                    </div>
                                </Td>
                            </Tr>
                        ) : usuarios.length === 0 ? (
                            <Tr>
                                <Td colSpan={5}>
                                    <div className="py-6 text-center text-gray-500">
                                        No se encontraron usuarios para los filtros actuales.
                                    </div>
                                </Td>
                            </Tr>
                        ) : (
                            usuarios.map((usuario, index) => {
                                const posicion =
                                    (paginaActual - 1) * tamanoPagina + index + 1
                                const estaExpandido = Boolean(
                                    usuariosExpandidos[usuario.id],
                                )
                                const totalReferidos = Number(
                                    usuario.referred_count || 0,
                                )
                                const referidos = referidosPorPadre[usuario.id] || []
                                const errorReferidos = erroresReferidos[usuario.id]
                                const estaCargandoReferidos = Boolean(
                                    cargandoReferidos[usuario.id],
                                )

                                return (
                                    <Fragment key={usuario.id}>
                                        <Tr>
                                            <Td>
                                                <div className="min-w-[240px] flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        {obtenerInsigniaRanking(posicion)}
                                                        <Avatar
                                                            shape="circle"
                                                            size={36}
                                                            className="bg-primary-subtle text-primary font-semibold shadow-sm"
                                                        >
                                                            {obtenerInicialesUsuario(usuario)}
                                                        </Avatar>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold leading-5">
                                                            {obtenerNombreCompleto(usuario)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                                            {usuario.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Td>
                                            <Td>
                                                <span className="inline-flex min-w-[76px] items-center justify-center rounded-full bg-success-subtle px-3 py-1 text-sm font-semibold text-success">
                                                    {Number(
                                                        usuario.points || 0,
                                                    ).toLocaleString('es-CO')}
                                                </span>
                                            </Td>
                                            <Td>{formatearFecha(usuario.created_at)}</Td>
                                            <Td>
                                                <Tag
                                                    className={
                                                        usuario.active
                                                            ? estadoBadge.habilitado
                                                            : estadoBadge.inhabilitado
                                                    }
                                                    prefix={false}
                                                >
                                                    {usuario.active
                                                        ? 'Habilitado'
                                                        : 'Inhabilitado'}
                                                </Tag>
                                            </Td>
                                            <Td>
                                                {totalReferidos > 0 ? (
                                                    <Button
                                                        size="xs"
                                                        variant="default"
                                                        onClick={() =>
                                                            alternarReferidosUsuario(
                                                                usuario,
                                                            )
                                                        }
                                                    >
                                                        <span className="inline-flex items-center gap-2">
                                                            <PiUsersThreeDuotone className="text-base" />
                                                            <span>Referidos</span>
                                                            <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-semibold text-primary">
                                                                {totalReferidos}
                                                            </span>
                                                            <PiCaretDownBold
                                                                className={`text-xs transition-transform ${
                                                                    estaExpandido
                                                                        ? 'rotate-180'
                                                                        : ''
                                                                }`}
                                                            />
                                                        </span>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        -
                                                    </span>
                                                )}
                                            </Td>
                                        </Tr>

                                        {estaExpandido && (
                                            <Tr>
                                                <Td
                                                    colSpan={5}
                                                    className="bg-gray-50/60"
                                                >
                                                    <div className="px-2 py-1">
                                                        {estaCargandoReferidos ? (
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <PiSpinnerGapDuotone className="animate-spin text-base" />
                                                                <span>
                                                                    Cargando referidos...
                                                                </span>
                                                            </div>
                                                        ) : errorReferidos ? (
                                                            <div className="rounded-xl border border-error-subtle bg-error-subtle px-4 py-3 text-sm text-error">
                                                                {errorReferidos}
                                                            </div>
                                                        ) : referidos.length === 0 ? (
                                                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                                                                Este usuario ya no tiene
                                                                referidos activos asociados.
                                                            </div>
                                                        ) : (
                                                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                                                {referidos.map((referido) => (
                                                                    <div
                                                                        key={referido.id}
                                                                        className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4 border-b border-gray-100 last:border-b-0"
                                                                    >
                                                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                            <div className="shrink-0">
                                                                                <Avatar
                                                                                    shape="circle"
                                                                                    size={36}
                                                                                    className="bg-primary-subtle text-primary font-semibold shadow-sm"
                                                                                >
                                                                                    {obtenerInicialesUsuario(
                                                                                        referido,
                                                                                    )}
                                                                                </Avatar>
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="truncate text-sm font-semibold text-gray-900 leading-5">
                                                                                    {obtenerNombreCompleto(
                                                                                        referido,
                                                                                    )}
                                                                                </p>
                                                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                                                                    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                                                                                        <PiEnvelopeSimpleDuotone className="shrink-0 text-sm text-primary" />
                                                                                        <span className="truncate">
                                                                                            {referido.email}
                                                                                        </span>
                                                                                    </span>

                                                                                    {referido.document && (
                                                                                        <span className="inline-flex items-center gap-1.5">
                                                                                            <PiIdentificationCardDuotone className="shrink-0 text-sm text-primary" />
                                                                                            <span>
                                                                                                {referido.document}
                                                                                            </span>
                                                                                        </span>
                                                                                    )}

                                                                                    {referido.phone && (
                                                                                        <span className="inline-flex items-center gap-1.5">
                                                                                            <PiPhoneDuotone className="shrink-0 text-sm text-primary" />
                                                                                            <span>
                                                                                                {referido.phone}
                                                                                            </span>
                                                                                        </span>
                                                                                    )}

                                                                                    {referido.company_name && (
                                                                                        <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                                                                                            <PiBuildingsDuotone className="shrink-0 text-sm text-primary" />
                                                                                            <span className="truncate">
                                                                                                {
                                                                                                    referido.company_name
                                                                                                }
                                                                                            </span>
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                                                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                                                                                Registrado el{' '}
                                                                                {formatearFecha(
                                                                                    referido.created_at,
                                                                                )}
                                                                            </span>

                                                                            <Tag
                                                                                className={
                                                                                    referido.active
                                                                                        ? estadoBadge.habilitado
                                                                                        : estadoBadge.inhabilitado
                                                                                }
                                                                                prefix={
                                                                                    false
                                                                                }
                                                                            >
                                                                                {referido.active
                                                                                    ? 'Activo'
                                                                                    : 'Inactivo'}
                                                                            </Tag>

                                                                            <Button
                                                                                size="xs"
                                                                                variant="default"
                                                                                icon={
                                                                                    <PiTrashDuotone />
                                                                                }
                                                                                loading={
                                                                                    quitandoReferidoId ===
                                                                                    referido.id
                                                                                }
                                                                                onClick={() =>
                                                                                    quitarReferido(
                                                                                        usuario,
                                                                                        referido,
                                                                                    )
                                                                                }
                                                                            >
                                                                                Quitar
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Td>
                                            </Tr>
                                        )}
                                    </Fragment>
                                )
                            })
                        )}
                    </TBody>
                </Table>

                <div className="mt-5 flex flex-col lg:flex-row items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2">
                    <Pagination
                        className="rounded-xl"
                        currentPage={paginaActual}
                        pageSize={tamanoPagina}
                        total={totalUsuarios}
                        onChange={setPaginaActual}
                    />

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Por página</span>
                        <div className="w-[120px]">
                            <Select
                                size="sm"
                                menuPlacement="top"
                                isSearchable={false}
                                value={opcionTamanoSeleccionada}
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
        </div>
    )
}

export default ReferralPoints
