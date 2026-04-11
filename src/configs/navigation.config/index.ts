import {
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'
import { ADMIN } from '@/constants/roles.constant'

import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    {
        key: 'dashboard',
        path: '/dashboard',
        title: 'Inicio',
        translateKey: 'nav.dashboard',
        icon: 'dashboard',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN],
        subMenu: [],
    },
    {
        key: 'trips',
        path: '/viajes',
        title: 'Viajes',
        translateKey: 'nav.trips',
        icon: 'trips',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN],
        subMenu: [],
    },
    {
        key: 'tripsDeleted',
        path: '/viajes/eliminados',
        title: 'Historial Eliminados',
        translateKey: 'nav.tripsDeleted',
        icon: 'tripsDeleted',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN],
        subMenu: [],
    },
    // Oculto temporalmente del menú. La ruta y el módulo se conservan.
    // {
    //     key: 'reports',
    //     path: '/informes',
    //     title: 'Informes',
    //     translateKey: 'nav.reports',
    //     icon: 'reports',
    //     type: NAV_ITEM_TYPE_ITEM,
    //     authority: [ADMIN],
    //     subMenu: [],
    // },
    {
        key: 'users',
        path: '/usuarios',
        title: 'Usuarios',
        translateKey: 'nav.users',
        icon: 'users',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN],
        subMenu: [],
    },
    {
        key: 'referralPoints',
        path: '/puntos-referidos',
        title: 'Puntos por referidos',
        translateKey: 'nav.referralPoints',
        icon: 'referralPoints',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN],
        subMenu: [],
    },
]

export default navigationConfig
