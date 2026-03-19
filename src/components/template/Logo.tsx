import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import { useState } from 'react'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
}

const LOGO_SRC_PATH = '/img/logo/'

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        className,
        imgClass,
        style,
        logoWidth = 'auto',
    } = props
    const [useLegacyAsset, setUseLegacyAsset] = useState(false)
    const [useTextFallback, setUseTextFallback] = useState(false)

    const logoSrc = useLegacyAsset
        ? `${LOGO_SRC_PATH}logo-${mode}-${type}.png`
        : `${LOGO_SRC_PATH}conexion-carga-${mode}-${type}.png`

    const handleImageError = () => {
        if (!useLegacyAsset) {
            setUseLegacyAsset(true)
            return
        }
        setUseTextFallback(true)
    }

    return (
        <div
            className={classNames('logo', className)}
            style={{
                ...style,
                ...{ width: logoWidth },
            }}
        >
            {useTextFallback ? (
                type === 'streamline' ? (
                    <div className="h-10 w-10 rounded-lg bg-primary text-neutral flex items-center justify-center font-bold">
                        CC
                    </div>
                ) : (
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-primary text-xl">
                            Conexion
                        </span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200 text-base">
                            Carga
                        </span>
                    </div>
                )
            ) : (
                <img
                    className={imgClass}
                    src={logoSrc}
                    alt={`${APP_NAME} logo`}
                    onError={handleImageError}
                />
            )}
        </div>
    )
}

export default Logo
