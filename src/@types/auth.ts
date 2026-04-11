export type SignInCredential = {
    email: string
    password: string
}

export type AuthUserResponse = {
    id?: string
    userId?: string
    avatar?: string
    userName?: string
    email?: string
    first_name?: string
    last_name?: string
    rol?: string
    authority?: string[]
    active?: boolean
}

export type SignInResponse = {
    access_token?: string
    token?: string
    token_type?: string
    user?: AuthUserResponse
}

export type SignUpResponse = SignInResponse

export type SignUpCredential = {
    userName: string
    email: string
    password: string
}

export type ForgotPassword = {
    email: string
}

export type ResetPassword = {
    email: string
    code: string
    new_password: string
}

export type AuthRequestStatus = 'success' | 'failed' | ''

export type AuthResult = Promise<{
    status: AuthRequestStatus
    message: string
}>

export type User = {
    userId?: string | null
    avatar?: string | null
    userName?: string | null
    email?: string | null
    firstName?: string | null
    lastName?: string | null
    rol?: string | null
    authority?: string[]
}

export type Token = {
    accessToken: string
    refereshToken?: string
}

export type OauthSignInCallbackPayload = {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}
