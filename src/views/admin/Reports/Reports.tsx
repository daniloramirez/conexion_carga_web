import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'

type ReportPreset = {
    id: string
    title: string
    description: string
}

const reportPresets: ReportPreset[] = [
    {
        id: 'RP-01',
        title: 'Informe operativo de viajes',
        description:
            'Resumen de viajes activos, inactivos y eliminados por rango de fechas.',
    },
    {
        id: 'RP-02',
        title: 'Informe de eliminaciones',
        description:
            'Trazabilidad de retiros con observacion, usuario y fecha de gestion.',
    },
    {
        id: 'RP-03',
        title: 'Informe de gestion de usuarios',
        description:
            'Cambios administrativos sobre usuarios activos, inactivos y eliminados.',
    },
]

const Reports = () => {
    return (
        <div className="flex flex-col gap-6">
            <AdaptiveCard>
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    <div>
                        <h5>Centro de informes</h5>
                        <p className="text-sm text-gray-500 mt-1">
                            Scaffold base para generacion y exportacion
                            administrativa.
                        </p>
                    </div>
                    <Tag className="bg-primary-subtle text-primary" prefix={false}>
                        Fase 1
                    </Tag>
                </div>
            </AdaptiveCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {reportPresets.map((preset) => (
                    <AdaptiveCard key={preset.id}>
                        <p className="text-xs text-gray-400">{preset.id}</p>
                        <h5 className="mt-1">{preset.title}</h5>
                        <p className="text-sm text-gray-500 mt-2">
                            {preset.description}
                        </p>
                        <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="solid">
                                Preparar
                            </Button>
                            <Button size="sm" variant="default">
                                Exportar
                            </Button>
                        </div>
                    </AdaptiveCard>
                ))}
            </div>
        </div>
    )
}

export default Reports
