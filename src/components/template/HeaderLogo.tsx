import Logo from '@/components/template/Logo'
import { useThemeStore } from '@/store/themeStore'
import appConfig from '@/configs/app.config'
import { Link } from 'react-router'
import type { Mode } from '@/@types/theme'

const HeaderLogo = ({ mode }: { mode?: Mode }) => {
    const defaultMode = useThemeStore((state) => state.mode)

    return (
        <Link to={appConfig.authenticatedEntryPath}>
            <Logo
                imgClass="h-16 w-auto"
                logoWidth={260}
                mode={mode || defaultMode}
                className="hidden lg:block origin-left scale-[1.35]"
            />
        </Link>
    )
}

export default HeaderLogo
