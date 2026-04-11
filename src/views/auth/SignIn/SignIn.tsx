import Alert from '@/components/ui/Alert'
import SignInForm from './components/SignInForm'
import ActionLink from '@/components/shared/ActionLink'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { HiOutlineKey } from 'react-icons/hi'

type SignInProps = {
    forgetPasswordUrl?: string
    disableSubmit?: boolean
}

export const SignInBase = ({
    forgetPasswordUrl = '/forgot-password',
    disableSubmit,
}: SignInProps) => {
    const [message, setMessage] = useTimeOutMessage()

    return (
        <>
            <div className="mb-10 flex justify-center">
                <img
                    src="/img/logo/logo-light-full.png"
                    alt="Conexión Carga"
                    className="w-[220px] max-w-full"
                />
            </div>
            {message && (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            )}
            <SignInForm
                disableSubmit={disableSubmit}
                setMessage={setMessage}
                passwordHint={
                    <div className="mb-8 mt-6 text-center">
                        <ActionLink
                            to={forgetPasswordUrl}
                            className="inline-flex items-center gap-2 font-semibold heading-text underline"
                            themeColor={false}
                        >
                            <HiOutlineKey className="text-base" />
                            ¿Olvidaste tu contraseña?
                        </ActionLink>
                    </div>
                }
            />
        </>
    )
}

const SignIn = () => {
    return <SignInBase />
}

export default SignIn
