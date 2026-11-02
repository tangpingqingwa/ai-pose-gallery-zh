import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { validateCharacter } from '@/lib/characters'
import type { CharacterProfile } from '@/types/character'

function emptyProfile(): CharacterProfile {
  const id = `IP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  return {
    schemaVersion: 1, id, slug: id.toLowerCase(), version: 1, name: '', displayName: '', age: 28, gender: '女性',
    market: ['欧洲', '北美'], baseCity: '', tagline: '', status: 'draft',
    persona: { positioning: '', topics: [], personality: [], bio: '', voice: '' },
    appearance: { skin: '', hair: '', eyes: '', face: '', nose: '', lips: '', brows: '', marks: [], bodyType: '匀称', promptEn: '', bodyEn: '' },
    body: { basis: 'design_target', heightCm: 170, weightKg: 64, chestCm: 91, waistCm: 73, hipsCm: 99, shoulderCm: 40, inseamCm: 79 },
    style: { signatureOutfit: '', palette: [], outfitEn: '' }, assets: [],
    rights: { origin: 'original_design', generator: 'Codex built-in image generation', licenseNote: '项目自制角色，输入素材的来源逐项记录。', source: 'user_project', createdAt: new Date().toISOString() },
    updatedAt: new Date().toISOString(),
  }
}

const FACE_FIELDS = { face: '脸型与下颌', eyes: '眼睛与眼睑', nose: '鼻梁与鼻尖', lips: '唇形', brows: '眉形', skin: '肤色与纹理', hair: '发型与发色', bodyType: '体型轮廓' } as const
const BODY_FIELDS = { heightCm: '身高 cm', weightKg: '体重 kg', chestCm: '胸围 cm', waistCm: '腰围 cm', hipsCm: '臀围 cm', shoulderCm: '肩宽 cm', inseamCm: '内侧腿长 cm' } as const
const list = (value: string) => value.split(/[，,、;；]/).map((s) => s.trim())

export function CharacterEditor({ initial, onClose, onSave }: { initial?: CharacterProfile; onClose: () => void; onSave: (profile: CharacterProfile) => void }) {
  const [draft, setDraft] = useState(() => initial ? structuredClone(initial) : emptyProfile())
  const [step, setStep] = useState(0)
  function field(label: string, value: string, change: (value: string) => void, multiline = false) {
    const id = `edit-${label}`
    return <div className="space-y-2" key={label}><Label htmlFor={id}>{label}</Label>{multiline ? <Textarea id={id} value={value} onChange={(e) => change(e.target.value)} rows={3} /> : <Input id={id} value={value} onChange={(e) => change(e.target.value)} />}</div>
  }
  function save() {
    const cleaned = { ...draft, market: draft.market.filter(Boolean), appearance: { ...draft.appearance, marks: draft.appearance.marks.filter(Boolean) }, persona: { ...draft.persona, topics: draft.persona.topics.filter(Boolean), personality: draft.persona.personality.filter(Boolean) }, style: { ...draft.style, palette: draft.style.palette.filter(Boolean) } }
    try { validateCharacter(cleaned); onSave(cleaned); onClose() } catch (error) { toast.error(error instanceof Error ? error.message : '档案保存失败') }
  }
  return <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{initial ? '编辑角色档案' : '建立新角色'}</DialogTitle><DialogDescription>先确定身份，再描述固定外貌和体型。图片可在建档后上传收录。</DialogDescription></DialogHeader>
      <div className="flex gap-2" aria-label="建档步骤">
        {['身份与人设', '固定外貌', '身材与形象'].map((name, index) => <Button key={name} variant={step === index ? 'default' : 'ghost'} size="sm" onClick={() => setStep(index)}>{index + 1}. {name}</Button>)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (step < 2) setStep(step + 1); else save() }} className="space-y-5">
        {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
          {field('角色名称', draft.name, (name) => setDraft({ ...draft, name }))}
          {field('中文称呼', draft.displayName, (displayName) => setDraft({ ...draft, displayName }))}
          <div className="space-y-2"><Label htmlFor="edit-age">成年年龄</Label><Input id="edit-age" type="number" min={18} max={100} value={Number.isFinite(draft.age) ? draft.age : ''} onChange={(e) => setDraft({ ...draft, age: e.target.valueAsNumber })} /></div>
          {field('性别形象', draft.gender, (gender) => setDraft({ ...draft, gender }))}
          {field('生活城市设定', draft.baseCity, (baseCity) => setDraft({ ...draft, baseCity }))}
          {field('目标市场（逗号分隔）', draft.market.join('，'), (value) => setDraft({ ...draft, market: list(value) }))}
          <div className="sm:col-span-2">{field('内容定位', draft.persona.positioning, (positioning) => setDraft({ ...draft, persona: { ...draft.persona, positioning } }))}</div>
          <div className="sm:col-span-2">{field('人设背景', draft.persona.bio, (bio) => setDraft({ ...draft, persona: { ...draft.persona, bio } }), true)}</div>
          {field('内容话题（逗号分隔）', draft.persona.topics.join('，'), (value) => setDraft({ ...draft, persona: { ...draft.persona, topics: list(value) } }))}
          {field('个性（逗号分隔）', draft.persona.personality.join('，'), (value) => setDraft({ ...draft, persona: { ...draft.persona, personality: list(value) } }))}
        </div>}
        {step === 1 && <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(FACE_FIELDS).map(([key, label]) => field(label, draft.appearance[key as keyof typeof FACE_FIELDS], (value) => setDraft({ ...draft, appearance: { ...draft.appearance, [key]: value } })))}
          <div className="sm:col-span-2">{field('辨识特征（逗号分隔）', draft.appearance.marks.join('，'), (value) => setDraft({ ...draft, appearance: { ...draft.appearance, marks: list(value) } }))}</div>
          <div className="sm:col-span-2">{field('一句话形象', draft.tagline, (tagline) => setDraft({ ...draft, tagline }))}</div>
        </div>}
        {step === 2 && <>
          <p className="text-sm leading-6 text-muted-foreground">以下数值用于设定目标比例，不能作为从生成图中精确测量的数据。</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{Object.entries(BODY_FIELDS).map(([key, label]) => <div className="space-y-2" key={key}><Label htmlFor={`body-${key}`}>{label}</Label><Input id={`body-${key}`} type="number" step="0.5" value={Number.isFinite(draft.body[key as keyof typeof BODY_FIELDS]) ? draft.body[key as keyof typeof BODY_FIELDS] : ''} onChange={(e) => setDraft({ ...draft, body: { ...draft.body, [key]: e.target.valueAsNumber } })} /></div>)}</div>
          {field('标志性穿搭', draft.style.signatureOutfit, (signatureOutfit) => setDraft({ ...draft, style: { ...draft.style, signatureOutfit } }))}
          {field('配色（逗号分隔）', draft.style.palette.join('，'), (value) => setDraft({ ...draft, style: { ...draft.style, palette: list(value) } }))}
          {field('声音设定', draft.persona.voice, (voice) => setDraft({ ...draft, persona: { ...draft.persona, voice } }))}
        </>}
        <div className="flex justify-between border-t pt-4"><Button type="button" variant="ghost" onClick={() => step ? setStep(step - 1) : onClose()}>{step ? '上一步' : '取消'}</Button><Button type="submit">{step < 2 ? '下一步' : '保存角色档案'}</Button></div>
      </form>
    </DialogContent>
  </Dialog>
}
