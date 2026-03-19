import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import Tag from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import { useSessionUser } from '@/store/authStore'
import acronym from '@/utils/acronym'
import {
    actualizarMiPerfil,
    cambiarMiPassword,
    eliminarMiFotoPerfil,
    obtenerMiPerfil,
    subirMiFotoPerfil,
} from '@/services/ProfileService'
import {
    construirUsuarioSesionDesdePerfil,
    resolverUrlFotoPerfil,
} from '@/utils/perfilSesion'
import { FcBusinessman } from 'react-icons/fc'
import {
    PiPencilSimpleLineDuotone,
    PiTrashDuotone,
    PiUserDuotone,
} from 'react-icons/pi'
import type { PerfilActual } from '@/@types/profile'

type FormularioPerfil = {
    first_name: string
    last_name: string
    phone: string
    company_name: string
    email: string
}

type FormularioPassword = {
    password_actual: string
    nueva_password: string
    confirmar_nueva_password: string
}

const formularioPasswordVacio: FormularioPassword = {
    password_actual: '',
    nueva_password: '',
    confirmar_nueva_password: '',
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

const construirFormularioPerfil = (perfil: PerfilActual): FormularioPerfil => ({
    first_name: perfil.first_name || '',
    last_name: perfil.last_name || '',
    phone: perfil.phone || '',
    company_name: perfil.company_name || '',
    email: perfil.email || '',
})

const formatearFecha = (fechaISO?: string | null) => {
    if (!fechaISO) {
        return '-'
    }

    const fecha = new Date(fechaISO)
    if (Number.isNaN(fecha.getTime())) {
        return '-'
    }

    return fecha.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    })
}

const obtenerInicialesPerfil = (perfil?: PerfilActual | null) => {
    const nombre = perfil?.full_name?.trim()
    if (nombre) {
        return acronym(nombre).slice(0, 2).toUpperCase()
    }

    const email = perfil?.email?.trim()
    if (email) {
        return acronym(email.split('@')[0]).slice(0, 2).toUpperCase() || 'US'
    }

    return 'US'
}

const Profile = () => {
    const setUser = useSessionUser((state) => state.setUser)

    const [perfil, setPerfil] = useState<PerfilActual | null>(null)
    const [formularioPerfil, setFormularioPerfil] = useState<FormularioPerfil>({
        first_name: '',
        last_name: '',
        phone: '',
        company_name: '',
        email: '',
    })
    const [formularioPassword, setFormularioPassword] =
        useState<FormularioPassword>(formularioPasswordVacio)

    const [cargandoPerfil, setCargandoPerfil] = useState(true)
    const [guardandoPerfil, setGuardandoPerfil] = useState(false)
    const [guardandoPassword, setGuardandoPassword] = useState(false)
    const [subiendoFoto, setSubiendoFoto] = useState(false)
    const [eliminandoFoto, setEliminandoFoto] = useState(false)

    const [errorPerfil, setErrorPerfil] = useState('')
    const [errorPassword, setErrorPassword] = useState('')
    const [errorCarga, setErrorCarga] = useState('')

    const inputArchivoRef = useRef<HTMLInputElement | null>(null)

    const mostrarToast = (
        tipo: 'success' | 'danger',
        mensaje: string,
    ) => {
        toast.push(
            <Notification title="Perfil" type={tipo}>
                {mensaje}
            </Notification>,
            { placement: 'top-end' },
        )
    }

    const sincronizarPerfil = (perfilActualizado: PerfilActual) => {
        setPerfil(perfilActualizado)
        setFormularioPerfil(construirFormularioPerfil(perfilActualizado))
        setUser(construirUsuarioSesionDesdePerfil(perfilActualizado))
    }

    useEffect(() => {
        let activo = true

        const cargarPerfil = async () => {
            setCargandoPerfil(true)
            setErrorCarga('')

            try {
                const response = await obtenerMiPerfil()

                if (!activo) {
                    return
                }

                sincronizarPerfil(response)
            } catch (error) {
                if (!activo) {
                    return
                }

                setErrorCarga(
                    extraerMensajeError(
                        error,
                        'No fue posible cargar la información del perfil.',
                    ),
                )
            } finally {
                if (activo) {
                    setCargandoPerfil(false)
                }
            }
        }

        cargarPerfil()

        return () => {
            activo = false
        }
    }, [])

    const resumenCuenta = useMemo(() => {
        if (!perfil) {
            return 'Cuenta administrativa'
        }

        if (perfil.is_company) {
            return perfil.company_name?.trim() || 'Cuenta de empresa'
        }

        return 'Cuenta personal'
    }, [perfil])

    const fotoPerfilActual = resolverUrlFotoPerfil(
        perfil?.foto_url || perfil?.foto || '',
    )

    const manejarCambioPerfil = (
        campo: keyof FormularioPerfil,
        valor: string,
    ) => {
        setFormularioPerfil((prev) => ({
            ...prev,
            [campo]: valor,
        }))
    }

    const manejarCambioPassword = (
        campo: keyof FormularioPassword,
        valor: string,
    ) => {
        setFormularioPassword((prev) => ({
            ...prev,
            [campo]: valor,
        }))
    }

    const guardarPerfil = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!perfil) {
            return
        }

        const nombres = formularioPerfil.first_name.trim()
        const apellidos = formularioPerfil.last_name.trim()

        if (!nombres || !apellidos) {
            setErrorPerfil('Los nombres y apellidos son obligatorios.')
            return
        }

        setGuardandoPerfil(true)
        setErrorPerfil('')

        try {
            const response = await actualizarMiPerfil({
                first_name: nombres,
                last_name: apellidos,
                phone: formularioPerfil.phone.trim() || null,
                company_name: perfil.is_company
                    ? formularioPerfil.company_name.trim() || null
                    : null,
            })

            sincronizarPerfil(response)
            mostrarToast('success', 'La información básica se actualizó correctamente.')
        } catch (error) {
            setErrorPerfil(
                extraerMensajeError(
                    error,
                    'No fue posible actualizar la información del perfil.',
                ),
            )
        } finally {
            setGuardandoPerfil(false)
        }
    }

    const guardarPassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (
            !formularioPassword.password_actual.trim() ||
            !formularioPassword.nueva_password.trim() ||
            !formularioPassword.confirmar_nueva_password.trim()
        ) {
            setErrorPassword('Completa los tres campos de contraseña.')
            return
        }

        if (
            formularioPassword.nueva_password !==
            formularioPassword.confirmar_nueva_password
        ) {
            setErrorPassword('La confirmación de la nueva contraseña no coincide.')
            return
        }

        setGuardandoPassword(true)
        setErrorPassword('')

        try {
            const response = await cambiarMiPassword(formularioPassword)
            setFormularioPassword(formularioPasswordVacio)
            mostrarToast('success', response.message)
        } catch (error) {
            setErrorPassword(
                extraerMensajeError(
                    error,
                    'No fue posible actualizar la contraseña.',
                ),
            )
        } finally {
            setGuardandoPassword(false)
        }
    }

    const abrirSelectorFoto = () => {
        inputArchivoRef.current?.click()
    }

    const manejarCambioFoto = async (event: ChangeEvent<HTMLInputElement>) => {
        const archivo = event.target.files?.[0]
        event.target.value = ''

        if (!archivo) {
            return
        }

        setSubiendoFoto(true)

        try {
            const response = await subirMiFotoPerfil(archivo)
            sincronizarPerfil(response)
            mostrarToast('success', 'La foto de perfil se actualizó correctamente.')
        } catch (error) {
            mostrarToast(
                'danger',
                extraerMensajeError(error, 'No fue posible actualizar la foto de perfil.'),
            )
        } finally {
            setSubiendoFoto(false)
        }
    }

    const eliminarFoto = async () => {
        if (!perfil?.foto_url) {
            return
        }

        setEliminandoFoto(true)

        try {
            const response = await eliminarMiFotoPerfil()
            sincronizarPerfil(response)
            mostrarToast('success', 'La foto de perfil se eliminó correctamente.')
        } catch (error) {
            mostrarToast(
                'danger',
                extraerMensajeError(error, 'No fue posible eliminar la foto de perfil.'),
            )
        } finally {
            setEliminandoFoto(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <AdaptiveCard>
                <div className="flex flex-col gap-2">
                    <h5 className="inline-flex items-center gap-2">
                        <span className="text-[1.5rem] leading-none">
                            <FcBusinessman />
                        </span>
                        <span>Perfil</span>
                    </h5>
                    <p className="text-sm text-gray-500">
                        Administra tu información básica, tu contraseña y tu foto
                        de perfil.
                    </p>
                </div>
            </AdaptiveCard>

            {errorCarga && (
                <div className="rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3">
                    {errorCarga}
                </div>
            )}

            {cargandoPerfil ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <AdaptiveCard className="xl:col-span-4">
                        <div className="animate-pulse flex flex-col items-center gap-4">
                            <div className="h-28 w-28 rounded-full bg-gray-100" />
                            <div className="h-5 w-48 rounded bg-gray-100" />
                            <div className="h-4 w-56 rounded bg-gray-100" />
                        </div>
                    </AdaptiveCard>
                    <AdaptiveCard className="xl:col-span-8">
                        <div className="animate-pulse space-y-4">
                            <div className="h-10 rounded-xl bg-gray-100" />
                            <div className="h-10 rounded-xl bg-gray-100" />
                            <div className="h-10 rounded-xl bg-gray-100" />
                            <div className="h-10 rounded-xl bg-gray-100" />
                        </div>
                    </AdaptiveCard>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        <AdaptiveCard className="xl:col-span-4 h-full">
                            <div className="flex h-full flex-col items-center text-center gap-4">
                                <input
                                    ref={inputArchivoRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={manejarCambioFoto}
                                />

                                <Avatar
                                    shape="circle"
                                    size={112}
                                    className="bg-primary-subtle text-primary font-semibold shadow-sm"
                                    {...(fotoPerfilActual
                                        ? { src: fotoPerfilActual }
                                        : { icon: <PiUserDuotone /> })}
                                >
                                    {!fotoPerfilActual
                                        ? obtenerInicialesPerfil(perfil)
                                        : undefined}
                                </Avatar>

                                <div className="space-y-2">
                                    <div>
                                        <h4>{perfil?.full_name || '-'}</h4>
                                        <p className="text-sm text-gray-500 mt-1 break-all">
                                            {perfil?.email || '-'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        <Tag
                                            className="bg-primary-subtle text-primary"
                                            prefix={false}
                                        >
                                            {resumenCuenta}
                                        </Tag>
                                        <Tag
                                            className={
                                                perfil?.active
                                                    ? 'bg-success-subtle text-success'
                                                    : 'bg-warning-subtle text-warning'
                                            }
                                            prefix={false}
                                        >
                                            {perfil?.active ? 'Activo' : 'Inactivo'}
                                        </Tag>
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        Miembro desde {formatearFecha(perfil?.created_at)}
                                    </p>
                                </div>

                                <div className="flex w-full flex-col gap-2 sm:flex-row">
                                    <Button
                                        block
                                        variant="default"
                                        icon={<PiPencilSimpleLineDuotone />}
                                        onClick={abrirSelectorFoto}
                                        loading={subiendoFoto}
                                    >
                                        Cambiar foto
                                    </Button>
                                    <Button
                                        block
                                        variant="default"
                                        icon={<PiTrashDuotone />}
                                        onClick={eliminarFoto}
                                        loading={eliminandoFoto}
                                        disabled={!fotoPerfilActual}
                                    >
                                        Eliminar foto
                                    </Button>
                                </div>
                            </div>
                        </AdaptiveCard>

                        <AdaptiveCard className="xl:col-span-8">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <h5>Información básica</h5>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Actualiza tus datos principales. El correo se
                                        mantiene solo para consulta.
                                    </p>
                                </div>

                                {errorPerfil && (
                                    <Notification type="danger">
                                        {errorPerfil}
                                    </Notification>
                                )}

                                <form className="space-y-4" onSubmit={guardarPerfil}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Nombres
                                            </label>
                                            <Input
                                                value={formularioPerfil.first_name}
                                                onChange={(event) =>
                                                    manejarCambioPerfil(
                                                        'first_name',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ingresa tus nombres"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Apellidos
                                            </label>
                                            <Input
                                                value={formularioPerfil.last_name}
                                                onChange={(event) =>
                                                    manejarCambioPerfil(
                                                        'last_name',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ingresa tus apellidos"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Correo
                                            </label>
                                            <Input
                                                value={formularioPerfil.email}
                                                disabled
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Teléfono
                                            </label>
                                            <Input
                                                value={formularioPerfil.phone}
                                                onChange={(event) =>
                                                    manejarCambioPerfil(
                                                        'phone',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ingresa tu teléfono"
                                            />
                                        </div>
                                        {perfil?.is_company && (
                                            <div className="md:col-span-2">
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Empresa
                                                </label>
                                                <Input
                                                    value={formularioPerfil.company_name}
                                                    onChange={(event) =>
                                                        manejarCambioPerfil(
                                                            'company_name',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Nombre de la empresa"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            loading={guardandoPerfil}
                                        >
                                            Guardar cambios
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </AdaptiveCard>
                    </div>

                    <AdaptiveCard>
                        <div className="flex flex-col gap-4">
                            <div>
                                <h5>Cambio de contraseña</h5>
                                <p className="text-sm text-gray-500 mt-1">
                                    Usa una contraseña segura con letras, números y
                                    un símbolo.
                                </p>
                            </div>

                            {errorPassword && (
                                <Notification type="danger">
                                    {errorPassword}
                                </Notification>
                            )}

                            <form className="space-y-4" onSubmit={guardarPassword}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Contraseña actual
                                        </label>
                                        <Input
                                            type="password"
                                            value={formularioPassword.password_actual}
                                            onChange={(event) =>
                                                manejarCambioPassword(
                                                    'password_actual',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Ingresa tu contraseña actual"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Nueva contraseña
                                        </label>
                                        <Input
                                            type="password"
                                            value={formularioPassword.nueva_password}
                                            onChange={(event) =>
                                                manejarCambioPassword(
                                                    'nueva_password',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Ingresa la nueva contraseña"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Confirmar nueva contraseña
                                        </label>
                                        <Input
                                            type="password"
                                            value={
                                                formularioPassword.confirmar_nueva_password
                                            }
                                            onChange={(event) =>
                                                manejarCambioPassword(
                                                    'confirmar_nueva_password',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Confirma la nueva contraseña"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        loading={guardandoPassword}
                                    >
                                        Actualizar contraseña
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </AdaptiveCard>
                </>
            )}
        </div>
    )
}

export default Profile
