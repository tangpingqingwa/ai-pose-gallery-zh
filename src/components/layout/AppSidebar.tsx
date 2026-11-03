import { Link, useLocation } from '@tanstack/react-router'
import { ExternalLinkIcon, LayersIcon, SparklesIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useStudio } from '@/store/studioStore'
import { activeNavTo, navGroups } from './nav'
import expansion from '../../../data/catalog-expansion.json'
import { useCharacterLibrary } from '@/store/characterStore'
import { whiteModels } from '@/lib/whiteModels'
import { useSettingLibrary } from '@/store/settingStore'
import { SETTING_CATEGORIES } from '@/lib/settingLibrary'

export function AppSidebar() {
  const pathname = useLocation({ select: (l) => l.pathname })
  const active = activeNavTo(pathname)
  const { recipe } = useStudio()
  const { profiles } = useCharacterLibrary()
  const references = whiteModels
  const { records } = useSettingLibrary()
  const libraryCounts: Record<string, number> = { '/costumes': 1407 + expansion.costumes.length, '/portraits': 1499 + expansion.portraits.length + profiles.filter((profile) => profile.assets.some((asset) => asset.kind === 'portrait')).length,
    '/expressions': references.filter((item) => item.kind === 'expressions').length,
    '/grooming': references.filter((item) => item.kind === 'grooming').length,
    '/body-details': references.filter((item) => item.kind === 'body-details').length,
    '/mannerisms': references.filter((item) => item.kind === 'mannerisms').length,
    '/traits': records.filter((record) => SETTING_CATEGORIES[record.category].group === 'life').length,
    '/voices': records.filter((record) => SETTING_CATEGORIES[record.category].group === 'voice').length,
  }
  const count = [recipe.portrait, recipe.costume, recipe.pose].filter(Boolean).length + (recipe.extraImages?.length ?? 0) + Object.keys(recipe.settingBindings ?? {}).length
  const onCharacters = pathname.startsWith('/characters')

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LayersIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">POSE &amp; CHARACTER</span>
                  <span className="truncate text-xs text-muted-foreground">IP 人物档案与创作台</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={item.to === active} tooltip={item.title}>
                    <Link to={item.to}>
                      <item.icon />
                      <span className="flex-1 truncate">{item.title}</span>
                      {(libraryCounts[item.to] !== undefined || item.badge) && (
                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] font-medium">
                          {libraryCounts[item.to]?.toLocaleString('en-US') ?? item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="当前角色配方">
              <Link to={onCharacters && !recipe.character ? '/characters' : '/studio'} className="bg-sidebar-accent/70 hover:bg-sidebar-accent">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SparklesIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-semibold">{recipe.character ? recipe.character.name : onCharacters ? '人物档案与创作' : `参考组合（${count} 项）`}</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {recipe.character ? '身份 · 人物状态 · 语言声音' : onCharacters ? '选择角色，补充个性与口音' : count === 0 ? '选择参考，或从角色档案开始' : '点击进入 AI 合成台'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild tooltip="访问 GitHub 仓库">
              <a
                href="https://github.com/anhao/ai-pose-gallery-zh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground"
              >
                <ExternalLinkIcon className="size-3.5" />
                <span>GitHub · @anhao_ai</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
