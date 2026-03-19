import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash/debounce'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmarExportacionExcelDialog from '@/components/shared/ConfirmarExportacionExcelDialog'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import Pagination from '@/components/ui/Pagination'
import Segment from '@/components/ui/Segment'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import classNames from '@/utils/classNames'
import acronym from '@/utils/acronym'
import dayjs from 'dayjs'
import {
    actualizarUsuarioAdministracion,
    cambiarEstadoUsuarioAdministracion,
    crearUsuarioAdministracion,
    exportarUsuariosAdministracion,
    obtenerDetalleUsuarioAdministracion,
    obtenerUsuariosAdministracion,
} from '@/services/UsuariosAdminService'
import { exportarExcel } from '@/utils/exportarExcel'
import {
    PiBroomDuotone,
    PiDownloadSimpleDuotone,
    PiEyeDuotone,
    PiMagnifyingGlassDuotone,
    PiPencilSimpleLineDuotone,
    PiPlusDuotone,
    PiPowerDuotone,
    PiUsersThreeDuotone,
} from 'react-icons/pi'
import type {
    EstadoFiltroUsuarioAdmin,
    TipoFiltroUsuarioAdmin,
    UsuarioAdmin,
} from '@/@types/usuariosAdmin'

type FormularioUsuario = {
    first_name: string
    last_name: string
    email: string
    phone: string
    password: string
    confirm_password: string
    is_company: boolean
    company_name: string
    is_premium: boolean
    is_driver: boolean
    is_admin: boolean
    active: boolean
}

type OpcionSelectString = {
    value: string
    label: string
}

type OpcionSelectNumero = {
    value: number
    label: string
}

const { THead, TBody, Tr, Th, Td } = Table

const opcionesEstado: { value: EstadoFiltroUsuarioAdmin; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'habilitado', label: 'Habilitados' },
    { value: 'inhabilitado', label: 'Inhabilitados' },
]

const opcionesTipo: OpcionSelectString[] = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: 'usuario', label: 'Persona' },
    { value: 'empresa', label: 'Empresa' },
    { value: 'conductor', label: 'Conductor' },
    { value: 'premium', label: 'Premium' },
]

const opcionesTamanoPagina: OpcionSelectNumero[] = [
    { value: 8, label: '8' },
    { value: 12, label: '12' },
    { value: 20, label: '20' },
]

const formularioVacio: FormularioUsuario = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    is_company: false,
    company_name: '',
    is_premium: false,
    is_driver: false,
    is_admin: false,
    active: true,
}

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

const convertirFechaISOAFecha = (valor: string) => {
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

const obtenerNombreCompleto = (usuario: UsuarioAdmin) =>
    `${usuario.first_name || ''} ${usuario.last_name || ''}`.trim() || '-'

const obtenerInicialesUsuario = (usuario: UsuarioAdmin) => {
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

const obtenerTagsTipo = (usuario: UsuarioAdmin) => {
    const tags: { label: string; className: string }[] = []

    if (usuario.is_company) {
        tags.push({ label: 'Empresa', className: 'bg-primary-subtle text-primary' })
    }
    if (usuario.is_driver) {
        tags.push({ label: 'Conductor', className: 'bg-warning-subtle text-warning' })
    }
    if (usuario.is_premium) {
        tags.push({ label: 'Premium', className: 'bg-success-subtle text-success' })
    }

    if (tags.length === 0) {
        tags.push({ label: 'Usuario', className: 'bg-gray-100 text-gray-700' })
    }

    return tags
}

const construirFormulario = (usuario: UsuarioAdmin): FormularioUsuario => ({
    first_name: usuario.first_name || '',
    last_name: usuario.last_name || '',
    email: usuario.email || '',
    phone: usuario.phone || '',
    password: '',
    confirm_password: '',
    is_company: Boolean(usuario.is_company),
    company_name: usuario.company_name || '',
    is_premium: Boolean(usuario.is_premium),
    is_driver: Boolean(usuario.is_driver),
    is_admin: Boolean(usuario.is_admin),
    active: Boolean(usuario.active),
})

const Users = () => {
    const [textoBusqueda, setTextoBusqueda] = useState('')
    const [busquedaAplicada, setBusquedaAplicada] = useState('')
    const [estadoFiltro, setEstadoFiltro] =
        useState<EstadoFiltroUsuarioAdmin>('todos')
    const [tipoFiltro, setTipoFiltro] = useState<TipoFiltroUsuarioAdmin>('todos')
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [tamanoPagina, setTamanoPagina] = useState(8)
    const [tokenRecarga, setTokenRecarga] = useState(0)

    const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
    const [totalUsuarios, setTotalUsuarios] = useState(0)
    const [cargandoUsuarios, setCargandoUsuarios] = useState(true)
    const [errorUsuarios, setErrorUsuarios] = useState('')

    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false)
    const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false)
    const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false)

    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAdmin | null>(
        null,
    )
    const [detalleUsuario, setDetalleUsuario] = useState<UsuarioAdmin | null>(null)
    const [cargandoDetalle, setCargandoDetalle] = useState(false)

    const [modoFormulario, setModoFormulario] = useState<'crear' | 'editar'>('crear')
    const [formulario, setFormulario] = useState<FormularioUsuario>(formularioVacio)
    const [erroresFormulario, setErroresFormulario] = useState<string[]>([])
    const [guardandoFormulario, setGuardandoFormulario] = useState(false)
    const [cargandoFormulario, setCargandoFormulario] = useState(false)

    const [errorCambioEstado, setErrorCambioEstado] = useState('')
    const [cambiandoEstado, setCambiandoEstado] = useState(false)
    const [modalExportarAbierto, setModalExportarAbierto] = useState(false)
    const [exportandoExcel, setExportandoExcel] = useState(false)

    const controladorListadoRef = useRef<AbortController | null>(null)

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

    const rangoFechasInvalido = useMemo(
        () =>
            Boolean(fechaDesde && fechaHasta && fechaDesde.trim() > fechaHasta.trim()),
        [fechaDesde, fechaHasta],
    )

    useEffect(() => {
        let activo = true

        if (rangoFechasInvalido) {
            setCargandoUsuarios(false)
            setUsuarios([])
            setTotalUsuarios(0)
            setErrorUsuarios(
                'El rango de fechas no es válido: la fecha desde no puede ser mayor que la fecha hasta.',
            )
            return
        }

        if (controladorListadoRef.current) {
            controladorListadoRef.current.abort()
        }

        const controller = new AbortController()
        controladorListadoRef.current = controller

        const cargarUsuarios = async () => {
            setCargandoUsuarios(true)
            setErrorUsuarios('')

            try {
                const data = await obtenerUsuariosAdministracion(
                    {
                        q: busquedaAplicada,
                        estado: estadoFiltro,
                        tipo: tipoFiltro,
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
                        'No fue posible consultar los usuarios administrativos.',
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
    }, [
        busquedaAplicada,
        estadoFiltro,
        tipoFiltro,
        fechaDesde,
        fechaHasta,
        paginaActual,
        tamanoPagina,
        tokenRecarga,
        rangoFechasInvalido,
    ])

    const opcionTipoSeleccionada = useMemo(
        () => opcionesTipo.find((item) => item.value === tipoFiltro) || opcionesTipo[0],
        [tipoFiltro],
    )

    const opcionTamanoSeleccionada = useMemo(
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

        if (estadoFiltro !== 'todos') {
            filtros.push(
                `Estado: ${
                    estadoFiltro === 'habilitado' ? 'Habilitados' : 'Inhabilitados'
                }`,
            )
        }

        if (tipoFiltro !== 'todos') {
            filtros.push(`Tipo: ${opcionTipoSeleccionada.label}`)
        }

        if (fechaDesde) {
            filtros.push(`Desde: ${fechaDesde}`)
        }

        if (fechaHasta) {
            filtros.push(`Hasta: ${fechaHasta}`)
        }

        return filtros
    }, [
        busquedaAplicada,
        estadoFiltro,
        tipoFiltro,
        fechaDesde,
        fechaHasta,
        opcionTipoSeleccionada.label,
    ])

    const recargarListado = useCallback(() => {
        setTokenRecarga((prev) => prev + 1)
    }, [])

    const mostrarToast = useCallback((tipo: 'success' | 'danger', mensaje: string) => {
        toast.push(
            <Notification title="Administración de Usuarios" type={tipo}>
                {mensaje}
            </Notification>,
            { placement: 'top-end' },
        )
    }, [])

    const consultarDetalle = async (usuarioId: string) => {
        setCargandoDetalle(true)
        try {
            const data = await obtenerDetalleUsuarioAdministracion(usuarioId)
            setDetalleUsuario(data)
            return data
        } catch (error) {
            const mensaje = extraerMensajeError(
                error,
                'No fue posible cargar el detalle del usuario.',
            )
            mostrarToast('danger', mensaje)
            return null
        } finally {
            setCargandoDetalle(false)
        }
    }

    const abrirModalDetalle = async (usuario: UsuarioAdmin) => {
        setUsuarioSeleccionado(usuario)
        setDetalleUsuario(null)
        setModalDetalleAbierto(true)
        await consultarDetalle(usuario.id)
    }

    const abrirModalCrear = () => {
        setModoFormulario('crear')
        setFormulario(formularioVacio)
        setErroresFormulario([])
        setUsuarioSeleccionado(null)
        setModalFormularioAbierto(true)
    }

    const abrirModalEditar = async (usuario: UsuarioAdmin) => {
        setModoFormulario('editar')
        setUsuarioSeleccionado(usuario)
        setErroresFormulario([])
        setModalFormularioAbierto(true)
        setCargandoFormulario(true)

        try {
            const data = await obtenerDetalleUsuarioAdministracion(usuario.id)
            setFormulario(construirFormulario(data))
        } catch (error) {
            const mensaje = extraerMensajeError(
                error,
                'No fue posible cargar la información del usuario para editar.',
            )
            setModalFormularioAbierto(false)
            mostrarToast('danger', mensaje)
        } finally {
            setCargandoFormulario(false)
        }
    }

    const cerrarModalDetalle = () => {
        setModalDetalleAbierto(false)
        setDetalleUsuario(null)
    }

    const cerrarModalFormulario = () => {
        setModalFormularioAbierto(false)
        setFormulario(formularioVacio)
        setErroresFormulario([])
        setGuardandoFormulario(false)
        setCargandoFormulario(false)
    }

    const abrirConfirmarEstado = (usuario: UsuarioAdmin) => {
        setUsuarioSeleccionado(usuario)
        setErrorCambioEstado('')
        setModalEstadoAbierto(true)
    }

    const cerrarModalEstado = () => {
        setModalEstadoAbierto(false)
        setUsuarioSeleccionado(null)
        setErrorCambioEstado('')
        setCambiandoEstado(false)
    }

    const cerrarModalExportar = () => {
        setModalExportarAbierto(false)
        setExportandoExcel(false)
    }

    const limpiarFiltros = () => {
        aplicarBusquedaDebounce.cancel()
        setTextoBusqueda('')
        setBusquedaAplicada('')
        setEstadoFiltro('todos')
        setTipoFiltro('todos')
        setFechaDesde('')
        setFechaHasta('')
        setPaginaActual(1)
    }

    const abrirConfirmacionExportacion = () => {
        if (totalUsuarios === 0 || rangoFechasInvalido) {
            mostrarToast(
                'danger',
                'No hay usuarios para exportar con los filtros seleccionados.',
            )
            return
        }

        setModalExportarAbierto(true)
    }

    const onChangeEstado = (valor: string | string[]) => {
        if (typeof valor !== 'string') {
            return
        }

        if (opcionesEstado.some((item) => item.value === valor)) {
            setEstadoFiltro(valor as EstadoFiltroUsuarioAdmin)
            setPaginaActual(1)
        }
    }

    const actualizarCampoFormulario = (
        campo: keyof FormularioUsuario,
        valor: string | boolean,
    ) => {
        setFormulario((prev) => ({
            ...prev,
            [campo]: valor,
        }))
    }

    const validarFormulario = (): string[] => {
        const errores: string[] = []

        if (!formulario.first_name.trim()) {
            errores.push('Los nombres son obligatorios.')
        }

        if (!formulario.last_name.trim()) {
            errores.push('Los apellidos son obligatorios.')
        }

        const email = formulario.email.trim()
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        if (!email) {
            errores.push('El correo es obligatorio.')
        } else if (!emailValido) {
            errores.push('El correo no tiene un formato válido.')
        }

        const password = formulario.password.trim()
        const confirmPassword = formulario.confirm_password.trim()

        if (modoFormulario === 'crear') {
            if (!password) {
                errores.push('La contraseña es obligatoria al crear el usuario.')
            }
        }

        if (password) {
            if (password.length < 8) {
                errores.push('La contraseña debe tener mínimo 8 caracteres.')
            }
            if (password !== confirmPassword) {
                errores.push('La contraseña y su confirmación no coinciden.')
            }
        }

        return errores
    }

    const guardarFormulario = async () => {
        const errores = validarFormulario()
        if (errores.length > 0) {
            setErroresFormulario(errores)
            return
        }

        setGuardandoFormulario(true)
        setErroresFormulario([])

        const payloadBase = {
            first_name: formulario.first_name.trim(),
            last_name: formulario.last_name.trim(),
            email: formulario.email.trim(),
            phone: formulario.phone.trim(),
            is_company: Boolean(formulario.is_company),
            company_name: formulario.is_company
                ? formulario.company_name.trim()
                : undefined,
            is_premium: Boolean(formulario.is_premium),
            is_driver: Boolean(formulario.is_driver),
            is_admin: Boolean(formulario.is_admin),
            active: Boolean(formulario.active),
        }

        try {
            if (modoFormulario === 'crear') {
                await crearUsuarioAdministracion({
                    ...payloadBase,
                    password: formulario.password.trim(),
                    confirm_password: formulario.confirm_password.trim(),
                })

                mostrarToast('success', 'Usuario creado correctamente.')
            } else if (usuarioSeleccionado) {
                await actualizarUsuarioAdministracion(usuarioSeleccionado.id, {
                    ...payloadBase,
                    password: formulario.password.trim() || undefined,
                    confirm_password:
                        formulario.password.trim().length > 0
                            ? formulario.confirm_password.trim()
                            : undefined,
                })

                mostrarToast('success', 'Usuario actualizado correctamente.')
            }

            cerrarModalFormulario()
            recargarListado()
        } catch (error) {
            setErroresFormulario([
                extraerMensajeError(
                    error,
                    'No fue posible guardar la información del usuario.',
                ),
            ])
        } finally {
            setGuardandoFormulario(false)
        }
    }

    const confirmarCambioEstado = async () => {
        if (!usuarioSeleccionado) {
            return
        }

        setCambiandoEstado(true)
        setErrorCambioEstado('')

        try {
            const activoDestino = !usuarioSeleccionado.active
            const response = await cambiarEstadoUsuarioAdministracion(
                usuarioSeleccionado.id,
                {
                    active: activoDestino,
                },
            )

            mostrarToast('success', response.message)
            cerrarModalEstado()
            recargarListado()
        } catch (error) {
            setErrorCambioEstado(
                extraerMensajeError(
                    error,
                    'No fue posible actualizar el estado del usuario.',
                ),
            )
        } finally {
            setCambiandoEstado(false)
        }
    }

    const confirmarExportacionExcel = async () => {
        if (totalUsuarios === 0 || rangoFechasInvalido) {
            cerrarModalExportar()
            mostrarToast(
                'danger',
                'No hay usuarios para exportar con los filtros seleccionados.',
            )
            return
        }

        setExportandoExcel(true)

        try {
            const registros = await exportarUsuariosAdministracion({
                q: busquedaAplicada || undefined,
                estado: estadoFiltro,
                tipo: tipoFiltro,
                fecha_desde: fechaDesde || undefined,
                fecha_hasta: fechaHasta || undefined,
            })

            if (!registros || registros.length === 0) {
                cerrarModalExportar()
                mostrarToast(
                    'danger',
                    'No hay usuarios para exportar con los filtros seleccionados.',
                )
                return
            }

            exportarExcel({
                nombreArchivo: `usuarios_admin_${new Date()
                    .toISOString()
                    .slice(0, 10)}`,
                nombreHoja: 'Usuarios',
                filas: registros.map((usuario) => ({
                    ID: usuario.id,
                    'Nombre completo': usuario.nombre_completo,
                    Correo: usuario.correo,
                    Teléfono: usuario.telefono || '-',
                    Empresa: usuario.empresa || '-',
                    Tipo: usuario.tipo,
                    Estado: usuario.estado,
                    Puntos: Number(usuario.puntos || 0),
                    'Fecha de creación': formatearFecha(usuario.fecha_creacion),
                })),
            })

            cerrarModalExportar()
            mostrarToast('success', 'El archivo de usuarios se exportó correctamente.')
        } catch (error) {
            setExportandoExcel(false)
            mostrarToast(
                'danger',
                extraerMensajeError(
                    error,
                    'No fue posible exportar los usuarios a Excel.',
                ),
            )
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                            <h5 className="inline-flex items-center gap-2">
                                <PiUsersThreeDuotone className="text-primary text-xl" />
                                <span>Administración de Usuarios</span>
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">
                                Consulta, creación, edición y control de habilitación de
                                usuarios.
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
                                icon={<PiPlusDuotone />}
                                onClick={abrirModalCrear}
                            >
                                Crear usuario
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
                                placeholder="Buscar por correo, nombres, apellidos, teléfono o empresa"
                            />
                        </div>

                        <div className="xl:col-span-4">
                            <Segment value={estadoFiltro} onChange={onChangeEstado}>
                                {opcionesEstado.map((item) => (
                                    <Segment.Item key={item.value} value={item.value}>
                                        {item.label}
                                    </Segment.Item>
                                ))}
                            </Segment>
                        </div>

                        <div className="xl:col-span-3">
                            <Select
                                value={opcionTipoSeleccionada}
                                options={opcionesTipo}
                                isSearchable={false}
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
                                onChange={(option) => {
                                    setTipoFiltro(
                                        (option?.value as TipoFiltroUsuarioAdmin) ||
                                            'todos',
                                    )
                                    setPaginaActual(1)
                                }}
                            />
                        </div>

                        <div className="xl:col-span-3">
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

                        <div className="xl:col-span-3">
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

                        <div className="xl:col-span-2 flex items-end">
                            <Button
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

            {errorUsuarios && (
                <div className="rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3">
                    {errorUsuarios}
                </div>
            )}

            <AdaptiveCard>
                <div className="flex items-center justify-between mb-4">
                    <h5>Usuarios registrados</h5>
                    <p className="text-sm text-gray-500">
                        Total: {totalUsuarios.toLocaleString('es-CO')}
                    </p>
                </div>

                <Table>
                    <THead>
                        <Tr>
                            <Th>Nombre completo</Th>
                            <Th>Teléfono</Th>
                            <Th>Tipo de usuario</Th>
                            <Th>Empresa</Th>
                            <Th>Estado</Th>
                            <Th>Fecha de creación</Th>
                            <Th>Acciones</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {cargandoUsuarios ? (
                            <Tr>
                                <Td colSpan={7}>
                                    <div className="py-6 text-center text-gray-500">
                                        Cargando usuarios...
                                    </div>
                                </Td>
                            </Tr>
                        ) : usuarios.length === 0 ? (
                            <Tr>
                                <Td colSpan={7}>
                                    <div className="py-6 text-center text-gray-500">
                                        No se encontraron usuarios con los filtros actuales.
                                    </div>
                                </Td>
                            </Tr>
                        ) : (
                            usuarios.map((usuario) => (
                                <Tr key={usuario.id}>
                                    <Td>
                                        <div className="min-w-[220px] flex items-center gap-3">
                                            <Avatar
                                                shape="circle"
                                                size={36}
                                                className="bg-primary-subtle text-primary font-semibold shadow-sm"
                                            >
                                                {obtenerInicialesUsuario(usuario)}
                                            </Avatar>
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
                                    <Td>{usuario.phone || '-'}</Td>
                                    <Td>
                                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                                            {obtenerTagsTipo(usuario).map((tag) => (
                                                <Tag
                                                    key={`${usuario.id}-${tag.label}`}
                                                    className={tag.className}
                                                    prefix={false}
                                                >
                                                    {tag.label}
                                                </Tag>
                                            ))}
                                        </div>
                                    </Td>
                                    <Td>{usuario.company_name || '-'}</Td>
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
                                    <Td>{formatearFecha(usuario.created_at)}</Td>
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="xs"
                                                variant="default"
                                                icon={<PiEyeDuotone />}
                                                onClick={() => abrirModalDetalle(usuario)}
                                            />
                                            <Button
                                                size="xs"
                                                variant="default"
                                                icon={<PiPencilSimpleLineDuotone />}
                                                onClick={() => abrirModalEditar(usuario)}
                                            />
                                            <Button
                                                size="xs"
                                                variant="default"
                                                icon={<PiPowerDuotone />}
                                                onClick={() => abrirConfirmarEstado(usuario)}
                                            >
                                                {usuario.active
                                                    ? 'Inhabilitar'
                                                    : 'Habilitar'}
                                            </Button>
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

            <Dialog
                isOpen={modalDetalleAbierto}
                width={760}
                onClose={cerrarModalDetalle}
                onRequestClose={cerrarModalDetalle}
            >
                <div className="max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                        <h5>Detalle del usuario</h5>
                        <p className="text-sm text-gray-500 mt-1">
                            Información de solo lectura para consulta administrativa.
                        </p>
                    </div>

                    <div className="flex-1 px-6 py-4 overflow-y-auto">
                        {cargandoDetalle ? (
                            <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                                Cargando detalle...
                            </div>
                        ) : detalleUsuario ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Nombres</p>
                                    <p className="mt-1">{detalleUsuario.first_name}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Apellidos</p>
                                    <p className="mt-1">{detalleUsuario.last_name}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Correo</p>
                                    <p className="mt-1 break-all">{detalleUsuario.email}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Teléfono</p>
                                    <p className="mt-1">{detalleUsuario.phone || '-'}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Es empresa</p>
                                    <p className="mt-1">
                                        {detalleUsuario.is_company ? 'Sí' : 'No'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Nombre empresa</p>
                                    <p className="mt-1">{detalleUsuario.company_name || '-'}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Premium</p>
                                    <p className="mt-1">
                                        {detalleUsuario.is_premium ? 'Sí' : 'No'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Conductor</p>
                                    <p className="mt-1">
                                        {detalleUsuario.is_driver ? 'Sí' : 'No'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Estado</p>
                                    <Tag
                                        className={
                                            detalleUsuario.active
                                                ? estadoBadge.habilitado
                                                : estadoBadge.inhabilitado
                                        }
                                        prefix={false}
                                    >
                                        {detalleUsuario.active
                                            ? 'Habilitado'
                                            : 'Inhabilitado'}
                                    </Tag>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Puntos</p>
                                    <p className="mt-1">
                                        {Number(detalleUsuario.points || 0).toLocaleString(
                                            'es-CO',
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Fecha de creación</p>
                                    <p className="mt-1">
                                        {formatearFecha(detalleUsuario.created_at)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-gray-500">Referido por</p>
                                    <p className="mt-1 break-all">
                                        {detalleUsuario.referred_by_email ||
                                            detalleUsuario.referred_by_id ||
                                            'No aplica'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                                No fue posible cargar el detalle del usuario.
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

            <ConfirmarExportacionExcelDialog
                isOpen={modalExportarAbierto}
                titulo="Exportar usuarios a Excel"
                mensaje="Antes de continuar, valida si tienes filtros activos. Solo esos registros quedarán incluidos en el archivo."
                resumen={resumenFiltrosExportacion}
                loading={exportandoExcel}
                onClose={cerrarModalExportar}
                onConfirm={confirmarExportacionExcel}
            />

            <Dialog
                isOpen={modalFormularioAbierto}
                width={940}
                onClose={cerrarModalFormulario}
                onRequestClose={cerrarModalFormulario}
            >
                <div className="max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                        <h5>
                            {modoFormulario === 'crear'
                                ? 'Crear usuario'
                                : 'Modificar usuario'}
                        </h5>
                        <p className="text-sm text-gray-500 mt-1">
                            {modoFormulario === 'crear'
                                ? 'Ingresa la información para crear un nuevo usuario.'
                                : 'Actualiza la información del usuario seleccionado.'}
                        </p>
                    </div>

                    <div className="flex-1 px-6 py-4 overflow-y-auto">
                        {cargandoFormulario ? (
                            <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                                Cargando información del usuario...
                            </div>
                        ) : (
                            <>
                                {erroresFormulario.length > 0 && (
                                    <div className="rounded-xl border border-error-subtle bg-error-subtle px-4 py-3 text-sm text-error">
                                        <ul className="list-disc ml-5 space-y-1">
                                            {erroresFormulario.map((error, index) => (
                                                <li key={`error-usuario-${index}`}>
                                                    {error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500">
                                            Nombres
                                        </label>
                                        <Input
                                            value={formulario.first_name}
                                            onChange={(event) =>
                                                actualizarCampoFormulario(
                                                    'first_name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Nombres"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">
                                            Apellidos
                                        </label>
                                        <Input
                                            value={formulario.last_name}
                                            onChange={(event) =>
                                                actualizarCampoFormulario(
                                                    'last_name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Apellidos"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">
                                            Correo
                                        </label>
                                        <Input
                                            value={formulario.email}
                                            onChange={(event) =>
                                                actualizarCampoFormulario(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="correo@dominio.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">
                                            Teléfono
                                        </label>
                                        <Input
                                            value={formulario.phone}
                                            onChange={(event) =>
                                                actualizarCampoFormulario(
                                                    'phone',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Teléfono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">
                                            {modoFormulario === 'crear'
                                                ? 'Contraseña'
                                                : 'Nueva contraseña (opcional)'}
                                        </label>
                                        <Input
                                            type="password"
                                            value={formulario.password}
                                            onChange={(event) =>
                                                actualizarCampoFormulario(
                                                    'password',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Mínimo 8 caracteres"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">
                                            Confirmar contraseña
                                        </label>
                                        <Input
                                            type="password"
                                            value={formulario.confirm_password}
                                            onChange={(event) =>
                                                actualizarCampoFormulario(
                                                    'confirm_password',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Repite la contraseña"
                                        />
                                    </div>

                                    <div className="rounded-xl border border-gray-200 px-3 py-2">
                                        <label className="text-sm text-gray-500 block mb-2">
                                            Es empresa
                                        </label>
                                        <Switcher
                                            checked={formulario.is_company}
                                            onChange={(checked) =>
                                                actualizarCampoFormulario(
                                                    'is_company',
                                                    checked,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="rounded-xl border border-gray-200 px-3 py-2">
                                        <label className="text-sm text-gray-500 block mb-2">
                                            Es premium
                                        </label>
                                        <Switcher
                                            checked={formulario.is_premium}
                                            onChange={(checked) =>
                                                actualizarCampoFormulario(
                                                    'is_premium',
                                                    checked,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="rounded-xl border border-gray-200 px-3 py-2">
                                        <label className="text-sm text-gray-500 block mb-2">
                                            Es conductor
                                        </label>
                                        <Switcher
                                            checked={formulario.is_driver}
                                            onChange={(checked) =>
                                                actualizarCampoFormulario(
                                                    'is_driver',
                                                    checked,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="rounded-xl border border-gray-200 px-3 py-2">
                                        <label className="text-sm text-gray-500 block mb-2">
                                            Administrador
                                        </label>
                                        <Switcher
                                            checked={formulario.is_admin}
                                            onChange={(checked) =>
                                                actualizarCampoFormulario(
                                                    'is_admin',
                                                    checked,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="rounded-xl border border-gray-200 px-3 py-2">
                                        <label className="text-sm text-gray-500 block mb-2">
                                            Estado activo
                                        </label>
                                        <Switcher
                                            checked={formulario.active}
                                            onChange={(checked) =>
                                                actualizarCampoFormulario(
                                                    'active',
                                                    checked,
                                                )
                                            }
                                        />
                                    </div>

                                    {formulario.is_company && (
                                        <div className="md:col-span-2">
                                            <label className="text-sm text-gray-500">
                                                Nombre empresa
                                            </label>
                                            <Input
                                                value={formulario.company_name}
                                                onChange={(event) =>
                                                    actualizarCampoFormulario(
                                                        'company_name',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Nombre de la empresa"
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="default" onClick={cerrarModalFormulario}>
                                Cancelar
                            </Button>
                            <Button
                                variant="solid"
                                loading={guardandoFormulario}
                                onClick={guardarFormulario}
                            >
                                {modoFormulario === 'crear'
                                    ? 'Crear usuario'
                                    : 'Guardar cambios'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={modalEstadoAbierto}
                width={520}
                onClose={cerrarModalEstado}
                onRequestClose={cerrarModalEstado}
            >
                <div className="p-6">
                    <h5>
                        {usuarioSeleccionado?.active
                            ? 'Inhabilitar usuario'
                            : 'Habilitar usuario'}
                    </h5>
                    <p className="text-sm text-gray-500 mt-1">
                        {usuarioSeleccionado?.active
                            ? 'Confirma si deseas inhabilitar este usuario.'
                            : 'Confirma si deseas habilitar este usuario.'}
                    </p>

                    {usuarioSeleccionado && (
                        <div className="mt-4 rounded-xl border border-gray-200 p-3 text-sm">
                            <p className="text-gray-500">Usuario seleccionado</p>
                            <p className="font-semibold mt-1">
                                {obtenerNombreCompleto(usuarioSeleccionado)}
                            </p>
                            <p className="text-gray-500 mt-1 break-all">
                                {usuarioSeleccionado.email}
                            </p>
                        </div>
                    )}

                    {errorCambioEstado && (
                        <div className="mt-4 rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3 text-sm">
                            {errorCambioEstado}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                        <Button variant="default" onClick={cerrarModalEstado}>
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            loading={cambiandoEstado}
                            onClick={confirmarCambioEstado}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default Users
