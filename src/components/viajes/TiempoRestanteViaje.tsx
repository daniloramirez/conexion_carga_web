import { useEffect, useMemo, useState } from 'react'
import Progress from '@/components/ui/Progress'
import Tag from '@/components/ui/Tag'
import classNames from '@/utils/classNames'
import { PiTimerDuotone } from 'react-icons/pi'
import type { EstadoViajeAdmin } from '@/@types/viajesAdmin'

type TiempoRestanteViajeProps = {
    estado: EstadoViajeAdmin
    createdAt?: string | null
    duracionPublicacion?: number | null
    duracionPublicacionUnidad?: 'minutos' | 'horas' | null
    expiresAt?: string | null
}

const parseFechaSegura = (valor?: string | null) => {
    if (!valor) {
        return null
    }

    const timestamp = new Date(valor).getTime()
    if (Number.isNaN(timestamp)) {
        return null
    }

    return timestamp
}

const pad = (valor: number) => String(Math.max(0, valor)).padStart(2, '0')

const formatearTiempoRestante = (totalSegundos: number) => {
    const dias = Math.floor(totalSegundos / 86400)
    const horas = Math.floor((totalSegundos % 86400) / 3600)
    const minutos = Math.floor((totalSegundos % 3600) / 60)
    const segundos = totalSegundos % 60

    if (dias > 0) {
        return `${pad(dias)}d ${pad(horas)}h ${pad(minutos)}m ${pad(segundos)}s`
    }

    return `${pad(horas)}h ${pad(minutos)}m ${pad(segundos)}s`
}

const formatearFechaVencimiento = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const clamp = (valor: number, min: number, max: number) =>
    Math.min(max, Math.max(min, valor))

const TiempoRestanteViaje = (props: TiempoRestanteViajeProps) => {
    const { estado, createdAt, duracionPublicacion, duracionPublicacionUnidad, expiresAt } =
        props

    const modeloTiempo = useMemo(() => {
        const createdAtMs = parseFechaSegura(createdAt)
        const expiresAtMs = parseFechaSegura(expiresAt)
        const unidad = duracionPublicacionUnidad || 'horas'
        const duracionNumerica = Number(duracionPublicacion)
        const duracionMs =
            Number.isFinite(duracionNumerica) && duracionNumerica > 0
                ? duracionNumerica * (unidad === 'minutos' ? 60_000 : 3_600_000)
                : null

        const vencimientoMs =
            expiresAtMs ??
            (createdAtMs && duracionMs ? createdAtMs + duracionMs : null)

        const duracionTotalMs =
            duracionMs ??
            (createdAtMs && vencimientoMs && vencimientoMs > createdAtMs
                ? vencimientoMs - createdAtMs
                : null)

        return {
            createdAtMs,
            vencimientoMs,
            duracionTotalMs,
            unidad,
            duracionNumerica,
        }
    }, [createdAt, duracionPublicacion, duracionPublicacionUnidad, expiresAt])

    const [tiempoRestanteMs, setTiempoRestanteMs] = useState<number | null>(null)

    useEffect(() => {
        const vencimientoMs = modeloTiempo.vencimientoMs
        if (estado !== 'activo' || !vencimientoMs) {
            setTiempoRestanteMs(null)
            return
        }

        const calcularRestante = () => Math.max(0, vencimientoMs - Date.now())

        setTiempoRestanteMs(calcularRestante())

        const intervalId = window.setInterval(() => {
            const restante = calcularRestante()
            setTiempoRestanteMs(restante)

            if (restante <= 0) {
                window.clearInterval(intervalId)
            }
        }, 1000)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [estado, modeloTiempo.vencimientoMs])

    useEffect(() => {
        if (!import.meta.env.DEV) {
            return
        }

        // Log controlado para depurar parseo/unidades sin afectar produccion.
        console.debug('[TiempoRestanteViaje]', {
            estado,
            createdAt,
            createdAtMs: modeloTiempo.createdAtMs,
            duracionPublicacion: modeloTiempo.duracionNumerica,
            duracionPublicacionUnidad: modeloTiempo.unidad,
            expiresAt,
            vencimientoMs: modeloTiempo.vencimientoMs,
            ahoraMs: Date.now(),
        })
    }, [
        createdAt,
        estado,
        expiresAt,
        modeloTiempo.createdAtMs,
        modeloTiempo.duracionNumerica,
        modeloTiempo.unidad,
        modeloTiempo.vencimientoMs,
    ])

    const restanteSegundos = useMemo(() => {
        if (tiempoRestanteMs === null) {
            return null
        }
        return Math.max(0, Math.floor(tiempoRestanteMs / 1000))
    }, [tiempoRestanteMs])

    const vencido = restanteSegundos !== null && restanteSegundos <= 0
    const porcentajeRestante = useMemo(() => {
        if (
            restanteSegundos === null ||
            tiempoRestanteMs === null ||
            !modeloTiempo.duracionTotalMs ||
            modeloTiempo.duracionTotalMs <= 0
        ) {
            return null
        }

        return clamp(
            Math.round((tiempoRestanteMs / modeloTiempo.duracionTotalMs) * 100),
            0,
            100,
        )
    }, [modeloTiempo.duracionTotalMs, restanteSegundos, tiempoRestanteMs])

    const enRiesgo = porcentajeRestante !== null && porcentajeRestante <= 20

    const colorRing = vencido
        ? 'text-error'
        : enRiesgo
          ? 'text-warning'
          : 'text-success'

    const colorBadge = vencido
        ? 'bg-error-subtle text-error'
        : enRiesgo
          ? 'bg-warning-subtle text-warning'
          : 'bg-success-subtle text-success'

    return (
        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        <PiTimerDuotone className="text-lg text-primary" />
                        Tiempo restante
                    </p>
                </div>
                <Tag
                    className={
                        estado === 'activo'
                            ? colorBadge
                            : 'bg-gray-100 text-gray-600'
                    }
                    prefix={false}
                >
                    {estado === 'activo' ? (vencido ? 'Vencido' : 'Activo') : 'No aplica'}
                </Tag>
            </div>

            {estado !== 'activo' && (
                <p className="mt-3 text-sm text-gray-500">
                    El contador solo aplica para viajes activos.
                </p>
            )}

            {estado === 'activo' && !modeloTiempo.vencimientoMs && (
                <p className="mt-3 text-sm text-gray-500">
                    Sin información de vencimiento.
                </p>
            )}

            {estado === 'activo' && modeloTiempo.vencimientoMs && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <p
                            className={classNames(
                                'text-2xl font-bold tracking-wide tabular-nums',
                                vencido ? 'text-error' : 'heading-text',
                            )}
                        >
                            {formatearTiempoRestante(restanteSegundos || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Vence: {formatearFechaVencimiento(modeloTiempo.vencimientoMs)}
                        </p>
                    </div>

                    <div className="shrink-0 self-center">
                        <Progress
                            variant="circle"
                            width={86}
                            percent={porcentajeRestante ?? 0}
                            customColorClass={colorRing}
                            customInfo={`${porcentajeRestante ?? 0}%`}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default TiempoRestanteViaje
