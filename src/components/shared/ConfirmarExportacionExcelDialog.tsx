import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'

type ConfirmarExportacionExcelDialogProps = {
    isOpen: boolean
    titulo: string
    mensaje: string
    resumen?: string[]
    loading?: boolean
    onClose: () => void
    onConfirm: () => void
}

const ConfirmarExportacionExcelDialog = ({
    isOpen,
    titulo,
    mensaje,
    resumen = [],
    loading = false,
    onClose,
    onConfirm,
}: ConfirmarExportacionExcelDialogProps) => {
    return (
        <Dialog
            isOpen={isOpen}
            width={560}
            onClose={onClose}
            onRequestClose={onClose}
        >
            <div className="max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                    <h5>{titulo}</h5>
                    <p className="text-sm text-gray-500 mt-1">{mensaje}</p>
                </div>

                <div className="flex-1 px-6 py-4 overflow-y-auto">
                    {resumen.length > 0 && (
                        <div className="rounded-xl border border-primary-subtle bg-primary-subtle/40 px-4 py-3 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">
                                Filtros activos a exportar
                            </p>
                            <ul className="list-disc ml-5 mt-2 space-y-1">
                                {resumen.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {resumen.length === 0 && (
                        <div className="rounded-xl border border-warning-subtle bg-warning-subtle/40 px-4 py-3 text-sm text-gray-700">
                            No tienes filtros activos. Se exportará el conjunto completo
                            disponible para este módulo.
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-white">
                    <div className="flex justify-end gap-2">
                        <Button variant="default" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            loading={loading}
                            onClick={onConfirm}
                        >
                            Exportar a Excel
                        </Button>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}

export default ConfirmarExportacionExcelDialog
