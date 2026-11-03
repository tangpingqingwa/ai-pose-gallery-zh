import type { LinkProps } from '@tanstack/react-router'
import {
  BookOpenIcon,
  ClipboardCheckIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  PersonStandingIcon,
  ShirtIcon,
  SparklesIcon,
  SmileIcon,
  ScissorsIcon,
  AccessibilityIcon,
  HandIcon,
  UserRoundIcon,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  to: NonNullable<LinkProps['to']>
  icon: LucideIcon
  badge?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: '工作台',
    items: [
      { title: '图库总览', to: '/', icon: LayoutDashboardIcon },
      { title: '自有 IP 角色库', to: '/characters', icon: UserRoundIcon },
      { title: 'AI 角色合成台', to: '/studio', icon: SparklesIcon, badge: 'PRO' },
    ],
  },
  {
    label: '人物素材库',
    items: [
      { title: '动作姿势库', to: '/poses', icon: PersonStandingIcon, badge: '1,439' },
      { title: '服装穿搭库', to: '/costumes', icon: ShirtIcon },
      { title: '人像参考库', to: '/portraits', icon: UserRoundIcon },
      { title: '表情神态库', to: '/expressions', icon: SmileIcon },
      { title: '妆发状态库', to: '/grooming', icon: ScissorsIcon },
      { title: '体型细节库', to: '/body-details', icon: AccessibilityIcon },
      { title: '习惯仪态库', to: '/mannerisms', icon: HandIcon },
    ],
  },
  {
    label: '配置与说明',
    items: [
      { title: '参考库检查', to: '/library-quality', icon: ClipboardCheckIcon },
      { title: 'API 接口配置', to: '/settings', icon: KeyRoundIcon },
      { title: '使用说明与免责声明', to: '/guide', icon: BookOpenIcon },
    ],
  },
]

const allItems = navGroups.flatMap((g) => g.items)

export function activeNavTo(pathname: string): string | undefined {
  let best: string | undefined
  for (const { to } of allItems) {
    const hit = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
    if (hit && (!best || to.length > best.length)) best = to
  }
  return best
}
