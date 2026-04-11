import { useEffect, useMemo, useState } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Avatar from '@/components/ui/Avatar'
import Chart from '@/components/shared/Chart'
import Segment from '@/components/ui/Segment'
import Tag from '@/components/ui/Tag'
import { useSessionUser } from '@/store/authStore'
import classNames from '@/utils/classNames'
import {
    obtenerResumenDashboard,
    obtenerTopEmpresasPublicadoras,
    obtenerTopRutasPublicadas,
    obtenerTopUsuariosPublicadores,
    obtenerUltimosViajesPublicados,
} from '@/services/DashboardService'
import {
    FcConferenceCall,
    FcFactory,
    FcInTransit,
} from 'react-icons/fc'
import { HiCheckCircle, HiPause, HiTrash, HiTruck } from 'react-icons/hi'
import { PiMedalDuotone, PiSealDuotone } from 'react-icons/pi'
import type { IconType } from 'react-icons'
import type { ApexOptions } from 'apexcharts'
import type {
    FiltroDashboard,
    PeriodoDashboard,
    TopHistoricoDashboard,
    TarjetasDashboard,
    UltimoViajePublicado,
} from '@/@types/dashboard'

type DefinicionTarjeta = {
    filtro: FiltroDashboard
    claveTarjeta: keyof TarjetasDashboard
    titulo: string
    icono: IconType
    colorLinea: string
    claseIcono: string
    claseTag: string
    claseActiva: string
}

const definicionesTarjetas: DefinicionTarjeta[] = [
    {
        filtro: 'publicados',
        claveTarjeta: 'viajes_publicados',
        titulo: 'Viajes publicados',
        icono: HiTruck,
        colorLinea: '#19B300',
        claseIcono: 'bg-primary text-white',
        claseTag: 'bg-primary-subtle text-primary',
        claseActiva:
            'border-primary bg-primary-subtle shadow-[0_12px_28px_-18px_rgba(25,179,0,0.85)]',
    },
    {
        filtro: 'activos',
        claveTarjeta: 'viajes_activos',
        titulo: 'Viajes activos',
        icono: HiCheckCircle,
        colorLinea: '#10B981',
        claseIcono: 'bg-success text-white',
        claseTag: 'bg-success-subtle text-success',
        claseActiva:
            'border-success bg-success-subtle shadow-[0_12px_28px_-18px_rgba(16,185,129,0.85)]',
    },
    {
        filtro: 'inactivos',
        claveTarjeta: 'viajes_inactivos',
        titulo: 'Viajes inactivos',
        icono: HiPause,
        colorLinea: '#F59E0B',
        claseIcono: 'bg-warning text-white',
        claseTag: 'bg-warning-subtle text-warning',
        claseActiva:
            'border-warning bg-warning-subtle shadow-[0_12px_28px_-18px_rgba(245,158,11,0.85)]',
    },
    {
        filtro: 'eliminados',
        claveTarjeta: 'viajes_eliminados',
        titulo: 'Viajes eliminados',
        icono: HiTrash,
        colorLinea: '#FF6A55',
        claseIcono: 'bg-error text-white',
        claseTag: 'bg-error-subtle text-error',
        claseActiva:
            'border-error bg-error-subtle shadow-[0_12px_28px_-18px_rgba(255,106,85,0.85)]',
    },
]

const definicionPorFiltro = definicionesTarjetas.reduce(
    (acumulado, item) => {
        acumulado[item.filtro] = item
        return acumulado
    },
    {} as Record<FiltroDashboard, DefinicionTarjeta>,
)

const periodosDisponibles: PeriodoDashboard[] = ['mes', 'semana', 'anual']

const textoPeriodo: Record<PeriodoDashboard, string> = {
    mes: 'Mes',
    semana: 'Semana',
    anual: 'Anual',
}

const tarjetasVacias: TarjetasDashboard = {
    viajes_publicados: 0,
    viajes_activos: 0,
    viajes_inactivos: 0,
    viajes_eliminados: 0,
}

const obtenerMensajeError = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any,
    mensajePorDefecto: string,
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

    return mensajePorDefecto
}

const formatearMoneda = (valor: number) => {
    const numero = Number(valor || 0)
    return `$ ${numero.toLocaleString('es-CO', {
        maximumFractionDigits: 0,
    })}`
}

const construirOpcionesGraficaTop = (
    categorias: string[],
    color: string,
): ApexOptions => ({
    chart: {
        toolbar: {
            show: false,
        },
    },
    legend: {
        show: false,
    },
    plotOptions: {
        bar: {
            horizontal: true,
            borderRadius: 6,
            barHeight: '58%',
        },
    },
    colors: [color],
    dataLabels: {
        enabled: false,
    },
    grid: {
        borderColor: '#EAEAEA',
        strokeDashArray: 4,
    },
    xaxis: {
        categories: categorias,
        labels: {
            formatter: (value) => `${Math.round(Number(value || 0))}`,
        },
    },
    tooltip: {
        theme: 'light',
        y: {
            formatter: (value) =>
                `${Number(value || 0).toLocaleString('es-CO')} publicaciones`,
        },
    },
})

type TarjetaTopHistoricoProps = {
    titulo: string
    descripcion: string
    data: TopHistoricoDashboard[]
    color: string
    icono: IconType
    chipTitulo: string
    cargando: boolean
    error: string
}

const obtenerEstiloRanking = (posicion: number) => {
    if (posicion === 1) {
        return {
            icono: PiMedalDuotone,
            claseInsignia: 'bg-amber-100 text-amber-500',
            claseFila:
                'border-amber-200 bg-linear-to-r from-amber-50 to-white shadow-[0_12px_28px_-20px_rgba(245,158,11,0.55)]',
            etiqueta: 'Líder',
        }
    }

    if (posicion === 2) {
        return {
            icono: PiMedalDuotone,
            claseInsignia: 'bg-slate-100 text-slate-500',
            claseFila:
                'border-slate-200 bg-linear-to-r from-slate-50 to-white shadow-[0_12px_28px_-20px_rgba(100,116,139,0.45)]',
            etiqueta: 'Top 2',
        }
    }

    if (posicion === 3) {
        return {
            icono: PiMedalDuotone,
            claseInsignia: 'bg-orange-100 text-orange-500',
            claseFila:
                'border-orange-200 bg-linear-to-r from-orange-50 to-white shadow-[0_12px_28px_-20px_rgba(249,115,22,0.45)]',
            etiqueta: 'Top 3',
        }
    }

    return {
        icono: PiSealDuotone,
        claseInsignia: 'bg-rose-100 text-rose-500',
        claseFila: 'border-gray-200 bg-white',
        etiqueta: `Puesto ${posicion}`,
    }
}

const TarjetaTopHistorico = ({
    titulo,
    descripcion,
    data,
    color,
    icono: IconoEncabezado,
    chipTitulo,
    cargando,
    error,
}: TarjetaTopHistoricoProps) => {
    const series = [
        {
            name: titulo,
            data: data.map((item) => item.total),
        },
    ]

    const categorias = data.map((item) => item.label)

    return (
        <AdaptiveCard className="relative overflow-hidden">
            <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundColor: color }}
            />
            <div className="flex flex-col gap-4 pt-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
                            <IconoEncabezado className="h-7 w-7" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h5>{titulo}</h5>
                                <Tag
                                    className="bg-primary-subtle text-primary"
                                    prefix={false}
                                >
                                    {chipTitulo}
                                </Tag>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {descripcion}
                            </p>
                        </div>
                    </div>
                    <Tag
                        className="bg-gray-100 text-gray-700 whitespace-nowrap"
                        prefix={false}
                    >
                        Top {data.length || 10}
                    </Tag>
                </div>

                {cargando && (
                    <div className="rounded-2xl border border-gray-200 p-4 animate-pulse">
                        <div className="h-[320px] bg-gray-100 rounded-xl" />
                    </div>
                )}

                {!cargando && error && (
                    <div className="rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3">
                        {error}
                    </div>
                )}

                {!cargando && !error && data.length === 0 && (
                    <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                        No hay datos históricos disponibles para este ranking.
                    </div>
                )}

                {!cargando && !error && data.length > 0 && (
                    <>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
                            <Chart
                                type="bar"
                                height={360}
                                series={series}
                                xAxis={categorias}
                                customOptions={construirOpcionesGraficaTop(
                                    categorias,
                                    color,
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            {data.slice(0, 5).map((item, index) => {
                                const posicion = index + 1
                                const estiloRanking =
                                    obtenerEstiloRanking(posicion)
                                const IconoPosicion = estiloRanking.icono

                                return (
                                    <div
                                        key={`${titulo}-${item.label}-${index}`}
                                        className={classNames(
                                            'flex items-start justify-between gap-3 rounded-2xl border px-3 py-3 transition-all duration-200',
                                            estiloRanking.claseFila,
                                        )}
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <span
                                                className={classNames(
                                                    'inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full px-2 shadow-sm',
                                                    estiloRanking.claseInsignia,
                                                )}
                                            >
                                                <IconoPosicion className="h-5 w-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold heading-text truncate">
                                                        {item.label}
                                                    </p>
                                                    <Tag
                                                        className="bg-white/80 text-gray-700"
                                                        prefix={false}
                                                    >
                                                        {estiloRanking.etiqueta}
                                                    </Tag>
                                                </div>
                                                {item.secondary_label && (
                                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                                        {item.secondary_label}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p
                                                className="text-lg font-bold"
                                                style={{ color }}
                                            >
                                                {item.total.toLocaleString('es-CO')}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                publicaciones
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </AdaptiveCard>
    )
}

const Dashboard = () => {
    const usuarioSesion = useSessionUser((state) => state.user)

    const [periodoSeleccionado, setPeriodoSeleccionado] =
        useState<PeriodoDashboard>('anual')
    const [filtroSeleccionado, setFiltroSeleccionado] =
        useState<FiltroDashboard>('publicados')

    const [resumenTarjetas, setResumenTarjetas] =
        useState<TarjetasDashboard>(tarjetasVacias)
    const [resumenSerie, setResumenSerie] = useState<
        { label: string; value: number }[]
    >([])
    const [cargandoResumen, setCargandoResumen] = useState(true)
    const [errorResumen, setErrorResumen] = useState('')

    const [ultimosViajes, setUltimosViajes] = useState<UltimoViajePublicado[]>([])
    const [cargandoUltimosViajes, setCargandoUltimosViajes] = useState(true)
    const [errorUltimosViajes, setErrorUltimosViajes] = useState('')
    const [topUsuarios, setTopUsuarios] = useState<TopHistoricoDashboard[]>([])
    const [topRutas, setTopRutas] = useState<TopHistoricoDashboard[]>([])
    const [topEmpresas, setTopEmpresas] = useState<TopHistoricoDashboard[]>([])
    const [cargandoTops, setCargandoTops] = useState(true)
    const [errorTops, setErrorTops] = useState('')

    useEffect(() => {
        let activo = true

        const cargarResumen = async () => {
            setCargandoResumen(true)
            setErrorResumen('')

            try {
                const data = await obtenerResumenDashboard(
                    periodoSeleccionado,
                    filtroSeleccionado,
                )

                if (!activo) {
                    return
                }

                setResumenTarjetas(data.tarjetas || tarjetasVacias)
                setResumenSerie(data.serie || [])
            } catch (error) {
                if (!activo) {
                    return
                }

                setErrorResumen(
                    obtenerMensajeError(
                        error,
                        'No fue posible cargar el resumen del dashboard.',
                    ),
                )
                setResumenTarjetas(tarjetasVacias)
                setResumenSerie([])
            } finally {
                if (activo) {
                    setCargandoResumen(false)
                }
            }
        }

        cargarResumen()

        return () => {
            activo = false
        }
    }, [periodoSeleccionado, filtroSeleccionado])

    useEffect(() => {
        let activo = true

        const cargarUltimosViajes = async () => {
            setCargandoUltimosViajes(true)
            setErrorUltimosViajes('')

            try {
                const data = await obtenerUltimosViajesPublicados(8)
                if (!activo) {
                    return
                }
                setUltimosViajes(data)
            } catch (error) {
                if (!activo) {
                    return
                }
                setErrorUltimosViajes(
                    obtenerMensajeError(
                        error,
                        'No fue posible cargar los últimos viajes publicados.',
                    ),
                )
            } finally {
                if (activo) {
                    setCargandoUltimosViajes(false)
                }
            }
        }

        cargarUltimosViajes()

        return () => {
            activo = false
        }
    }, [])

    useEffect(() => {
        let activo = true

        const cargarTopsHistoricos = async () => {
            setCargandoTops(true)
            setErrorTops('')

            try {
                const [usuariosData, rutasData, empresasData] = await Promise.all([
                    obtenerTopUsuariosPublicadores(10),
                    obtenerTopRutasPublicadas(10),
                    obtenerTopEmpresasPublicadoras(10),
                ])

                if (!activo) {
                    return
                }

                setTopUsuarios(usuariosData || [])
                setTopRutas(rutasData || [])
                setTopEmpresas(empresasData || [])
            } catch (error) {
                if (!activo) {
                    return
                }

                setErrorTops(
                    obtenerMensajeError(
                        error,
                        'No fue posible cargar los tops históricos del dashboard.',
                    ),
                )
                setTopUsuarios([])
                setTopRutas([])
                setTopEmpresas([])
            } finally {
                if (activo) {
                    setCargandoTops(false)
                }
            }
        }

        cargarTopsHistoricos()

        return () => {
            activo = false
        }
    }, [])

    const definicionFiltroActivo = definicionPorFiltro[filtroSeleccionado]
    const totalFiltroActivo = resumenTarjetas[definicionFiltroActivo.claveTarjeta] || 0

    const series = useMemo(() => {
        return [
            {
                name: definicionFiltroActivo.titulo,
                data: resumenSerie.map((item) => item.value),
            },
        ]
    }, [definicionFiltroActivo.titulo, resumenSerie])

    const categoriasEjeX = useMemo(() => {
        return resumenSerie.map((item) => item.label)
    }, [resumenSerie])

    const opcionesGraficaResumen: ApexOptions = useMemo(() => {
        return {
            chart: {
                toolbar: {
                    show: false,
                },
            },
            legend: {
                show: false,
            },
            stroke: {
                curve: 'smooth',
                width: 3,
            },
            markers: {
                size: 4,
                strokeWidth: 0,
                colors: [definicionFiltroActivo.colorLinea],
            },
            colors: [definicionFiltroActivo.colorLinea],
            grid: {
                borderColor: '#EAEAEA',
                strokeDashArray: 4,
            },
            yaxis: {
                labels: {
                    formatter: (value) => `${Math.round(value)}`,
                },
            },
            tooltip: {
                theme: 'light',
                y: {
                    formatter: (value) =>
                        `${Number(value || 0).toLocaleString('es-CO')} viajes`,
                },
            },
        }
    }, [definicionFiltroActivo.colorLinea])

    const onChangePeriodo = (valor: string | string[]) => {
        if (typeof valor !== 'string') {
            return
        }

        if (periodosDisponibles.includes(valor as PeriodoDashboard)) {
            setPeriodoSeleccionado(valor as PeriodoDashboard)
        }
    }

    const nombreUsuario =
        `${usuarioSesion.firstName || ''} ${usuarioSesion.lastName || ''}`.trim() ||
        usuarioSesion.userName ||
        'usuario'

    return (
        <div className="flex flex-col gap-4">
            <AdaptiveCard>
                <div
                    className={classNames(
                        'flex flex-col gap-4 sm:flex-row sm:items-center',
                        usuarioSesion.avatar && 'sm:gap-5',
                    )}
                >
                    {usuarioSesion.avatar ? (
                        <Avatar
                            shape="circle"
                            size={92}
                            src={usuarioSesion.avatar}
                            className="shadow-sm"
                        />
                    ) : null}
                    <div>
                        <h2 className="text-2xl font-bold heading-text">
                            Hola, {nombreUsuario}.
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Bienvenido al panel administrativo de Conexión Carga.
                        </p>
                    </div>
                </div>
            </AdaptiveCard>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <AdaptiveCard className="xl:col-span-8">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <h4>Resumen</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    Vista general de viajes según periodo y estado.
                                </p>
                            </div>
                            <Segment
                                value={periodoSeleccionado}
                                onChange={onChangePeriodo}
                                size="sm"
                            >
                                {periodosDisponibles.map((item) => (
                                    <Segment.Item key={item} value={item}>
                                        {textoPeriodo[item]}
                                    </Segment.Item>
                                ))}
                            </Segment>
                        </div>

                        {cargandoResumen && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={`skeleton-card-${index}`}
                                        className="rounded-2xl border border-gray-200 p-4 animate-pulse"
                                    >
                                        <div className="h-3 w-24 bg-gray-200 rounded-md" />
                                        <div className="h-7 w-20 bg-gray-200 rounded-md mt-3" />
                                        <div className="h-9 w-9 bg-gray-200 rounded-full mt-3" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!cargandoResumen && errorResumen && (
                            <div className="rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3">
                                {errorResumen}
                            </div>
                        )}

                        {!cargandoResumen && !errorResumen && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                {definicionesTarjetas.map((tarjeta) => {
                                    const Icono = tarjeta.icono
                                    const valor =
                                        resumenTarjetas[tarjeta.claveTarjeta] || 0
                                    const activa =
                                        filtroSeleccionado === tarjeta.filtro

                                    return (
                                        <button
                                            key={tarjeta.filtro}
                                            type="button"
                                            onClick={() =>
                                                setFiltroSeleccionado(tarjeta.filtro)
                                            }
                                            className={classNames(
                                                'rounded-2xl border p-4 text-left transition-all duration-200',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                                                activa
                                                    ? tarjeta.claseActiva
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-[0_8px_20px_-16px_rgba(0,0,0,0.35)]',
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs uppercase tracking-wide text-gray-500">
                                                    {tarjeta.titulo}
                                                </p>
                                                <Tag
                                                    className={tarjeta.claseTag}
                                                    prefix={false}
                                                >
                                                    {textoPeriodo[periodoSeleccionado]}
                                                </Tag>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                <p className="text-2xl font-bold heading-text">
                                                    {valor.toLocaleString('es-CO')}
                                                </p>
                                                <span
                                                    className={classNames(
                                                        'h-10 w-10 rounded-full flex items-center justify-center text-lg',
                                                        tarjeta.claseIcono,
                                                    )}
                                                >
                                                    <Icono />
                                                </span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {cargandoResumen && (
                            <div className="rounded-2xl border border-gray-200 p-4 animate-pulse">
                                <div className="h-[320px] bg-gray-100 rounded-xl" />
                            </div>
                        )}

                        {!cargandoResumen && !errorResumen && (
                            <div className="rounded-2xl border border-gray-200 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Tendencia de{' '}
                                            {definicionFiltroActivo.titulo}
                                        </p>
                                        <h3 className="mt-1">
                                            {totalFiltroActivo.toLocaleString(
                                                'es-CO',
                                            )}
                                        </h3>
                                    </div>
                                    <Tag
                                        className={definicionFiltroActivo.claseTag}
                                        prefix={false}
                                    >
                                        {textoPeriodo[periodoSeleccionado]}
                                    </Tag>
                                </div>

                                {resumenSerie.length > 0 ? (
                                    <div className="mt-3">
                                        <Chart
                                            type="line"
                                            height={320}
                                            series={series}
                                            xAxis={categoriasEjeX}
                                            customOptions={opcionesGraficaResumen}
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-xl border border-gray-200 px-4 py-8 text-center text-gray-500">
                                        No hay datos para el periodo y estado
                                        seleccionados.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </AdaptiveCard>

                <AdaptiveCard
                    className="xl:col-span-4 h-full"
                    header={{
                        content: 'Últimos viajes publicados',
                    }}
                >
                    <div className="flex flex-col gap-2">
                        {cargandoUltimosViajes &&
                            Array.from({ length: 8 }).map((_, index) => (
                                <div
                                    key={`skeleton-trip-${index}`}
                                    className="rounded-xl border border-gray-200 px-3 py-3 animate-pulse"
                                >
                                    <div className="h-4 w-3/4 bg-gray-200 rounded-md" />
                                    <div className="h-3 w-1/2 bg-gray-200 rounded-md mt-2" />
                                </div>
                            ))}

                        {!cargandoUltimosViajes && errorUltimosViajes && (
                            <div className="rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3">
                                {errorUltimosViajes}
                            </div>
                        )}

                        {!cargandoUltimosViajes &&
                            !errorUltimosViajes &&
                            ultimosViajes.length === 0 && (
                                <div className="rounded-xl border border-gray-200 px-4 py-6 text-sm text-gray-500">
                                    No hay viajes recientes para mostrar.
                                </div>
                            )}

                        {!cargandoUltimosViajes &&
                            !errorUltimosViajes &&
                            ultimosViajes.length > 0 && (
                                <ul className="divide-y divide-gray-200">
                                    {ultimosViajes.map((viaje) => (
                                        <li
                                            key={viaje.id}
                                            className="py-3 flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-semibold heading-text truncate">
                                                    {viaje.origen} - {viaje.destino}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {formatearMoneda(viaje.valor)}
                                                </p>
                                            </div>
                                            <Tag
                                                className={
                                                    viaje.estado === 'activo'
                                                        ? 'bg-success-subtle text-success'
                                                        : 'bg-warning-subtle text-warning'
                                                }
                                                prefix={false}
                                            >
                                                {viaje.estado === 'activo'
                                                    ? 'Activo'
                                                    : 'Inactivo'}
                                            </Tag>
                                        </li>
                                    ))}
                                </ul>
                            )}
                    </div>
                </AdaptiveCard>
            </div>

            {errorTops && (
                <div className="rounded-xl border border-error-subtle bg-error-subtle text-error px-4 py-3">
                    {errorTops}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <TarjetaTopHistorico
                    titulo="Top publicadores"
                    descripcion="Usuarios con mayor volumen histórico de publicaciones."
                    data={topUsuarios}
                    color="#19B300"
                    icono={FcConferenceCall}
                    chipTitulo="Usuarios"
                    cargando={cargandoTops}
                    error={errorTops}
                />
                <TarjetaTopHistorico
                    titulo="Rutas más publicadas"
                    descripcion="Ranking histórico con agrupación normalizada de origen y destino."
                    data={topRutas}
                    color="#FF7800"
                    icono={FcInTransit}
                    chipTitulo="Rutas"
                    cargando={cargandoTops}
                    error={errorTops}
                />
                <TarjetaTopHistorico
                    titulo="Empresas líderes"
                    descripcion="Empresas con mayor cantidad histórica de viajes publicados."
                    data={topEmpresas}
                    color="#2F4D2A"
                    icono={FcFactory}
                    chipTitulo="Empresas"
                    cargando={cargandoTops}
                    error={errorTops}
                />
            </div>
        </div>
    )
}

export default Dashboard
