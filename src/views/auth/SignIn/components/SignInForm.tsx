import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import classNames from '@/utils/classNames'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    HiOutlineMail,
    HiOutlineLockClosed,
    HiArrowNarrowRight,
} from 'react-icons/hi'
import type { CommonProps } from '@/@types/common'
import type { ReactNode } from 'react'

interface SignInFormProps extends CommonProps {
    disableSubmit?: boolean
    passwordHint?: string | ReactNode
    setMessage?: (message: string) => void
}

type SignInFormSchema = {
    email: string
    password: string
}

const validationSchema = z.object({
    email: z
        .string()
        .min(1, { message: 'Ingresa tu correo' })
        .email({ message: 'Ingresa un correo válido' }),
    password: z
        .string()
        .min(1, { message: 'Ingresa tu contraseña' }),
})

const SignInForm = (props: SignInFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { disableSubmit = false, className, setMessage, passwordHint } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<SignInFormSchema>({
        defaultValues: {
            email: '',
            password: '',
        },
        resolver: zodResolver(validationSchema),
    })

    const { signIn } = useAuth()

    const onSignIn = async (values: SignInFormSchema) => {
        const { email, password } = values

        if (!disableSubmit) {
            setSubmitting(true)

            const result = await signIn({ email, password })

            if (result?.status === 'failed') {
                setMessage?.(result.message)
            }
        }

        setSubmitting(false)
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onSignIn)}>
                <FormItem
                    label="Correo"
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                placeholder="correo@empresa.com"
                                autoComplete="off"
                                prefix={<HiOutlineMail className="text-lg" />}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Contraseña"
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                    className={classNames(
                        passwordHint ? 'mb-0' : '',
                        errors.password?.message ? 'mb-8' : '',
                    )}
                >
                    <Controller
                        name="password"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <PasswordInput
                                type="text"
                                placeholder="Contraseña"
                                autoComplete="off"
                                prefix={
                                    <HiOutlineLockClosed className="text-lg" />
                                }
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                {passwordHint}
                <div className="flex justify-center">
                    <Button
                        loading={isSubmitting}
                        variant="solid"
                        type="submit"
                        icon={<HiArrowNarrowRight />}
                        iconAlignment="end"
                        className="w-[220px]"
                    >
                        {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
                    </Button>
                </div>
            </Form>
        </div>
    )
}

export default SignInForm
