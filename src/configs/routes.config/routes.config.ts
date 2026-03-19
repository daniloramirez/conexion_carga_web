import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import { ADMIN } from '@/constants/roles.constant'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'dashboard',
        path: '/dashboard',
        component: lazy(() => import('@/views/admin/Dashboard')),
        authority: [ADMIN],
        meta: {
            header: {
                title: 'Inicio',
            },
        },
    },
    {
        key: 'profile',
        path: '/perfil',
        component: lazy(() => import('@/views/admin/Profile')),
        authority: [ADMIN],
        meta: {
            header: {
                title: 'Perfil',
            },
        },
    },
    {
        key: 'trips',
        path: '/viajes',
        component: lazy(() => import('@/views/admin/Trips')),
        authority: [ADMIN],
        meta: {
            header: {
                title: 'Administracion de Viajes',
            },
        },
    },
    {
        key: 'tripsDeleted',
        path: '/viajes/eliminados',
        component: lazy(() => import('@/views/admin/TripsDeleted')),
        authority: [ADMIN],
        meta: {
            header: {
                title: 'Historial de Viajes Eliminados',
            },
        },
    },
    {
        key: 'reports',
        path: '/informes',
        component: lazy(() => import('@/views/admin/Reports')),
        authority: [ADMIN],
        meta: {
            header: {
                title: 'Informes Administrativos',
            },
        },
    },
    {
        key: 'users',
        path: '/usuarios',
        component: lazy(() => import('@/views/admin/Users')),
        authority: [ADMIN],
        meta: {
            header: {
                title: 'Administración de Usuarios',
            },
        },
    },
    {
        key: 'referralPoints',
        path: '/puntos-referidos',
        component: lazy(() => import('@/views/admin/ReferralPoints')),
        authority: [ADMIN],
        meta: {
            header: {
                title: 'Puntos por referidos',
            },
        },
    },
    ...othersRoute,
]
