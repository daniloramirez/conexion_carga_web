import { Navigate } from 'react-router'

export const ResetPasswordBase = () => {
    return <Navigate replace to="/forgot-password" />
}

const ResetPassword = () => {
    return <ResetPasswordBase />
}

export default ResetPassword
