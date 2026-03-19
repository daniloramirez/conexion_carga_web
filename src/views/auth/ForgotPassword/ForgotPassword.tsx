import { useState, type FormEvent } from 'react'
import Alert from '@/components/ui/Alert'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Form, FormItem } from '@/components/ui/Form'
import ActionLink from '@/components/shared/ActionLink'
import PasswordInput from '@/components/shared/PasswordInput'
import { apiForgotPassword, apiResetPassword } from '@/services/AuthService'
import type { AxiosError } from 'axios'

type ForgotPasswordProps = {
    signInUrl?: string
}

type PasoRecuperacion = 'solicitar' | 'restablecer' | 'completado'

const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const regexCodigo = /^\d{6}$/
const regexSimbolo = /[!@#$%^&*(),.?":{}|<>_\-]/

const esContrasenaSegura = (value: string) => {
    const hasMinLength = value.length >= 8
    const hasLetter = /[A-Za-z]/.test(value)
    const hasNumber = /\d/.test(value)
    const hasSymbol = regexSimbolo.test(value)

    return hasMinLength && hasLetter && hasNumber && hasSymbol
}

const obtenerMensajeError = (error: unknown) => {
    const typedError = error as AxiosError<{ detail?: string; message?: string }>

    return (
        typedError?.response?.data?.detail ||
        typedError?.response?.data?.message ||
        'No fue posible procesar la solicitud en este momento.'
    )
}

export const ForgotPasswordBase = ({
    signInUrl = '/sign-in',
}: ForgotPasswordProps) => {
    const [paso, setPaso] = useState<PasoRecuperacion>('solicitar')
    const [correo, setCorreo] = useState('')
    const [codigo, setCodigo] = useState('')
    const [nuevaContrasena, setNuevaContrasena] = useState('')
    const [confirmarContrasena, setConfirmarContrasena] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const limpiarMensajes = () => {
        setError('')
        setSuccess('')
    }

    const validarCorreo = () => {
        const correoNormalizado = correo.trim()
        if (!correoNormalizado) {
            setError('Ingresa tu correo electrónico.')
            return false
        }

        if (!regexCorreo.test(correoNormalizado)) {
            setError('Ingresa un correo electrónico válido.')
            return false
        }

        return true
    }

    const handleSolicitarCodigo = async (event: FormEvent) => {
        event.preventDefault()
        limpiarMensajes()

        if (!validarCorreo()) {
            return
        }

        setIsSubmitting(true)
        try {
            await apiForgotPassword<{ ok: boolean; message?: string }>({
                email: correo.trim(),
            })
            setSuccess(`Te enviamos un código a ${correo.trim()}.`)
            setPaso('restablecer')
        } catch (requestError) {
            setError(obtenerMensajeError(requestError))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRestablecerContrasena = async (event: FormEvent) => {
        event.preventDefault()
        limpiarMensajes()

        if (!validarCorreo()) {
            return
        }

        if (!regexCodigo.test(codigo.trim())) {
            setError('Ingresa un código de 6 dígitos.')
            return
        }

        if (!esContrasenaSegura(nuevaContrasena)) {
            setError(
                'La contraseña debe tener mínimo 8 caracteres, letras, números y un símbolo.',
            )
            return
        }

        if (nuevaContrasena !== confirmarContrasena) {
            setError('Las contraseñas no coinciden.')
            return
        }

        setIsSubmitting(true)
        try {
            await apiResetPassword<{ ok: boolean; message?: string }>({
                email: correo.trim(),
                code: codigo.trim(),
                new_password: nuevaContrasena,
            })
            setPaso('completado')
            setSuccess(
                'Contraseña actualizada correctamente. Ahora puedes iniciar sesión.',
            )
        } catch (requestError) {
            setError(obtenerMensajeError(requestError))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div>
            <div className="mb-6">
                {paso === 'solicitar' ? (
                    <>
                        <h3 className="mb-2">¿Olvidaste tu contraseña?</h3>
                        <p className="font-semibold heading-text">
                            Ingresa tu correo y te enviaremos un código de
                            verificación.
                        </p>
                    </>
                ) : paso === 'restablecer' ? (
                    <>
                        <h3 className="mb-2">Restablecer contraseña</h3>
                        <p className="font-semibold heading-text">
                            Escribe el código recibido y define tu nueva
                            contraseña.
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="mb-2">Restablecimiento completado</h3>
                        <p className="font-semibold heading-text">
                            Tu contraseña fue actualizada exitosamente.
                        </p>
                    </>
                )}
            </div>

            {error && (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{error}</span>
                </Alert>
            )}

            {success && (
                <Alert showIcon className="mb-4" type="success">
                    <span className="break-all">{success}</span>
                </Alert>
            )}

            {paso === 'solicitar' && (
                <Form onSubmit={handleSolicitarCodigo}>
                    <FormItem label="Correo electrónico">
                        <Input
                            type="email"
                            value={correo}
                            onChange={(event) => setCorreo(event.target.value)}
                            placeholder="correo@empresa.com"
                            autoComplete="off"
                        />
                    </FormItem>
                    <Button block loading={isSubmitting} variant="solid" type="submit">
                        {isSubmitting ? 'Enviando código...' : 'Enviar código'}
                    </Button>
                </Form>
            )}

            {paso === 'restablecer' && (
                <Form onSubmit={handleRestablecerContrasena}>
                    <FormItem label="Correo electrónico">
                        <Input
                            type="email"
                            value={correo}
                            onChange={(event) => setCorreo(event.target.value)}
                            placeholder="correo@empresa.com"
                            autoComplete="off"
                        />
                    </FormItem>
                    <FormItem label="Código de verificación">
                        <Input
                            type="text"
                            value={codigo}
                            onChange={(event) => setCodigo(event.target.value)}
                            placeholder="123456"
                            autoComplete="off"
                            maxLength={6}
                        />
                    </FormItem>
                    <FormItem label="Nueva contraseña">
                        <PasswordInput
                            value={nuevaContrasena}
                            onChange={(event) =>
                                setNuevaContrasena(event.target.value)
                            }
                            placeholder="Ingresa tu nueva contraseña"
                            autoComplete="off"
                        />
                    </FormItem>
                    <FormItem label="Confirmar nueva contraseña">
                        <PasswordInput
                            value={confirmarContrasena}
                            onChange={(event) =>
                                setConfirmarContrasena(event.target.value)
                            }
                            placeholder="Confirma tu nueva contraseña"
                            autoComplete="off"
                        />
                    </FormItem>
                    <Button block loading={isSubmitting} variant="solid" type="submit">
                        {isSubmitting
                            ? 'Actualizando contraseña...'
                            : 'Cambiar contraseña'}
                    </Button>
                </Form>
            )}

            {paso === 'completado' && (
                <ActionLink
                    to={signInUrl}
                    className="inline-flex w-full justify-center rounded-lg bg-primary px-4 py-2 font-semibold text-white no-underline"
                    themeColor={false}
                >
                    Ir a iniciar sesión
                </ActionLink>
            )}

            <div className="mt-4 text-center">
                <span>Volver a </span>
                <ActionLink
                    to={signInUrl}
                    className="heading-text font-bold"
                    themeColor={false}
                >
                    iniciar sesión
                </ActionLink>
            </div>
        </div>
    )
}

const ForgotPassword = () => {
    return <ForgotPasswordBase />
}

export default ForgotPassword
