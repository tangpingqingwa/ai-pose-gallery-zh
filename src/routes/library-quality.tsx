import { createFileRoute, Link } from '@tanstack/react-router'
import report from '../../data/catalog-audit.json'
import { whiteModels } from '@/lib/whiteModels'
import { useSettingLibrary } from '@/store/settingStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/library-quality')({ staticData: { title: '参考库检查' }, component: LibraryQualityPage })

function LibraryQualityPage() {
  const { records } = useSettingLibrary()
  const c = report.costumes
  const p = report.portraits
  return <>
    <PageHeader title="参考库检查" description={`检查分类、记录关联与索引完整性。基础数据检查日期 ${report.date}。`} />
    <section className="rounded-xl border p-5"><h2 className="text-lg font-semibold">图像与设定记录关联</h2><p className="mt-3 text-sm leading-7">表情、妆发、体型细节与习惯仪态使用 {whiteModels.length} 组通用白模。个性、生活、语言口音与个人声线共有 {records.length} 条设定记录，可以独立选择、随机组合或固定到自有 IP。</p><p className="mt-2 text-sm leading-7 text-muted-foreground">图库按人物与素材特征统一分类；缺失信息显示未标注。固定关联会保留所选内容，编辑记录库不会悄悄改变已保存的人物。</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" asChild><Link to="/traits">个性与生活库</Link></Button><Button variant="outline" asChild><Link to="/voices">语言与声音库</Link></Button><Button asChild><Link to="/studio">人物创作与关联</Link></Button></div></section>
    <div className="grid gap-5 md:grid-cols-2" aria-label="原库检查结果">
      <section className="rounded-xl border p-5"><h2 className="text-lg font-semibold">服装：数量与描述区分度</h2><dl className="mt-4 grid grid-cols-2 gap-4 text-sm">{Object.entries({ '参考图片': c.total, '不同文字描述': c.distinctDescriptions, '相同描述分组': c.repeatedDescriptionGroups, '涉及记录': c.recordsInRepeatedGroups }).map(([label, count]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{count}</dd></div>)}</dl><p className="mt-5 text-sm leading-7">同一段描述最多对应 {c.duplicates[0].count} 套图。不能仅凭描述判断图片重复，现已提供分组查看，保留每一张参考图。</p><Button className="mt-4" variant="outline" asChild><Link to="/costumes">查看穿搭参考</Link></Button></section>
      <section className="rounded-xl border p-5"><h2 className="text-lg font-semibold">人像：发型索引多于身份档案</h2><dl className="mt-4 grid grid-cols-2 gap-4 text-sm">{Object.entries({ '参考图片': p.total, '不同标题': p.titles, '标准基础款': p.genericStyle, '氛围图缺少细分发型': p.genericAtmosphere }).map(([label, count]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{count}</dd></div>)}</dl><p className="mt-5 text-sm leading-7">原库只有 {p.featured} 张精选标记、{p.flaggedHot} 张热门标记，热门标记都在短发中。现改为按所选发长读取原库榜单；榜单为静态来源数据。</p><Button className="mt-4" variant="outline" asChild><Link to="/portraits">查看人像参考</Link></Button></section>
    </div>
    <div className="grid gap-6 border-t pt-6 md:grid-cols-2">{[['服装尚未记录的维度', c.missingDimensions], ['人像尚未记录的维度', p.missingDimensions]].map(([title, items]) => <section key={title as string}><h2 className="font-semibold">{title}</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{(items as string[]).map((item) => <li key={item}>{item}</li>)}</ul></section>)}</div>
    <section className="rounded-xl bg-muted p-5"><h2 className="font-semibold">如何用于自己的 IP</h2><p className="mt-3 max-w-3xl text-sm leading-7">人像固定身份，服装与动作控制穿搭和姿势，通用白模控制表情、妆发、体型细节和仪态。每张参考有独立的使用目标，角色档案继续记录性格、经历、语言与口音。背景保持简洁。</p><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{report.interpretation.map((item) => <li key={item}>{item}</li>)}</ul><Button className="mt-4" asChild><Link to="/characters" search={{ id: undefined }}>打开自有角色库</Link></Button></section>
    <details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">查看重复描述的实际编号（前 12 组）</summary><div className="mt-4 space-y-4">{c.duplicates.slice(0, 12).map((group) => <div key={group.prompt} className="text-xs leading-6"><p className="font-medium">{group.prompt} · {group.count} 套</p><p className="break-words font-mono text-muted-foreground">{group.ids.join(' · ')}</p></div>)}</div></details>
  </>
}
