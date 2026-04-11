import { useEffect, useState } from 'react'
import classNames from '@/utils/classNames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import {
    PiArrowsIn,
    PiArrowsOut,
    PiPrinterDuotone,
} from 'react-icons/pi'
import type { CommonProps } from '@/@types/common'

const _ImprimirVista = ({ className }: CommonProps) => {
    const imprimirVistaActual = () => {
        window.print()
    }

    return (
        <button
            type="button"
            className={classNames(className, 'text-2xl')}
            onClick={imprimirVistaActual}
            aria-label="Imprimir"
            title="Imprimir"
        >
            <PiPrinterDuotone />
        </button>
    )
}

const BotonImprimir = withHeaderItem(_ImprimirVista)

const _PantallaCompleta = ({ className }: CommonProps) => {
    const [pantallaCompletaActiva, setPantallaCompletaActiva] = useState(false)

    useEffect(() => {
        const actualizarEstado = () => {
            setPantallaCompletaActiva(Boolean(document.fullscreenElement))
        }

        actualizarEstado()
        document.addEventListener('fullscreenchange', actualizarEstado)

        return () => {
            document.removeEventListener('fullscreenchange', actualizarEstado)
        }
    }, [])

    const alternarPantallaCompleta = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen()
            } else {
                await document.exitFullscreen()
            }
        } catch (_error) {
            // En navegadores donde fullscreen esté restringido, no rompemos la UI.
        }
    }

    return (
        <button
            type="button"
            className={classNames(
                className,
                'text-2xl bg-transparent border-0 shadow-none',
            )}
            onClick={alternarPantallaCompleta}
            aria-label="Pantalla completa"
            title="Pantalla completa"
        >
            {pantallaCompletaActiva ? (
                <PiArrowsIn />
            ) : (
                <PiArrowsOut />
            )}
        </button>
    )
}

const BotonPantallaCompleta = withHeaderItem(_PantallaCompleta)

const HeaderQuickActions = () => {
    return (
        <>
            <BotonImprimir />
            <BotonPantallaCompleta />
        </>
    )
}

export default HeaderQuickActions
