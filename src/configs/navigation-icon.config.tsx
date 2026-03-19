import {
    PiHouseLineDuotone,
    PiArrowsInDuotone,
    PiTruckTrailerDuotone,
    PiBookOpenUserDuotone,
    PiBookBookmarkDuotone,
    PiAcornDuotone,
    PiBagSimpleDuotone,
    PiMedalDuotone,
    PiTrashDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    dashboard: <PiHouseLineDuotone />,
    trips: <PiTruckTrailerDuotone />,
    tripsDeleted: <PiTrashDuotone />,
    reports: <PiBookOpenUserDuotone />,
    users: <PiBagSimpleDuotone />,
    referralPoints: <PiMedalDuotone />,
    home: <PiHouseLineDuotone />,
    singleMenu: <PiAcornDuotone />,
    collapseMenu: <PiArrowsInDuotone />,
    groupSingleMenu: <PiBookOpenUserDuotone />,
    groupCollapseMenu: <PiBookBookmarkDuotone />,
    groupMenu: <PiBagSimpleDuotone />,
}

export default navigationIcon
