import { createFileRoute } from '@tanstack/react-router'
import { Section } from '@/components/common/FormSection'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/guide')({
  staticData: { title: '使用指南与免责声明' },
  component: GuidePage,
})

function GuidePage() {
  return (
    <>
      <PageHeader title="使用指南与免责声明" />

      <Section title="角色合成流程" className="md:grid-cols-3">
        <div className="rounded-2xl bg-background p-4">
          <Badge>1. 人像</Badge>
          <h3 className="mt-2 text-sm font-semibold">人像参考库</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            新增与自有人像优先展示，按年龄、性别形象、肤色、体型筛选。原库按发型与正脸/氛围分类。选定人像后固定五官与年龄。
          </p>
        </div>

        <div className="rounded-2xl bg-background p-4">
          <Badge>2. 服装</Badge>
          <h3 className="mt-2 text-sm font-semibold">多样穿搭与动作</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            按男款、女款、中性、用途、季节及松量选择穿搭，再选择整体姿势。服装人台的身材不会作为人物体型要求。
          </p>
        </div>

        <div className="rounded-2xl bg-background p-4">
          <Badge>3. 状态与细节</Badge>
          <h3 className="mt-2 text-sm font-semibold">表情、妆发、体型细节、习惯仪态</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            四个图片库均可直接加入配方并编辑参考目标。创作台导出 Codex 内置生图任务；超过 5 张时使用人像原图与参考拼图两个附件。
          </p>
        </div>
      </Section>

      <Section title="免责声明与合规使用规范（必读）" className="md:grid-cols-1">
        <div className="space-y-2.5 rounded-2xl bg-background p-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">1. 仅供学习与合法艺术创作（严禁违法）：</strong>
            本项目（含网页工作台、本地 ComfyUI 插件与工作流模板）
            <strong className="text-foreground">仅供个人学习、人体结构研究、插画构图参考与技术交流使用</strong>
            。严禁使用本工具生成、制作或传播任何违反法律法规、淫秽色情、暴力违禁内容，严禁未经他人明确授权上传真实人物照片进行换脸或深伪合成（Deepfake）等侵犯他人肖像权、隐私权与名誉权的行为。
          </p>
          <p>
            <strong className="text-foreground">2. NSFW（18+）敏感内容提示：</strong>
            图库中包含部分成人向 3D 素体姿势（全身单人・性感系、双人缠绵）与内衣/性感穿搭参考，旨在服务绘画与动作设计练习。系统默认开启「安全模式 (SFW)」屏蔽上述分类，
            <strong className="text-rose-600 dark:text-rose-400">未满 18 周岁的未成年人严禁关闭安全模式或访问相关内容</strong>。
          </p>
          <p>
            <strong className="text-foreground">3. 隐私保护与使用者责任归属：</strong>
            本工作台的角色、配方和生成记录保存在当前浏览器。可导出任务交给 Codex 内置生图，也可自行配置云端 API 或本机 ComfyUI。
            <strong className="text-foreground">因使用者违规使用或不当传播所产生的一切法律责任，均由使用者本人独立承担，与本项目及维护者无关。</strong>
          </p>
        </div>
      </Section>

      <Section title="数据来源与版权说明" className="md:grid-cols-1">
        <div className="space-y-2.5 rounded-2xl bg-background p-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">• 原作者版权归属：</strong>
            原库姿势（<code>ai-pose-gallery.pages.dev</code>、<code>ai-pose-depth-gallery.pages.dev</code>）、服装（<code>ai-costume-gallery.pages.dev</code>）、人像（<code>ai-portrait-gallery.pages.dev</code>）参考图与原始元数据源自原作者{' '}
            <strong className="text-foreground">ギア（@giaaibusi）</strong> 公开站点，著作权归原作者所有。本仓库仅为中文本地化翻译整理与前端工程学习存档，不对原始图片主张任何所有权。
          </p>
          <p>
            <strong className="text-foreground">• 使用与分发限制：</strong>
            新增素材与自有角色图片由 Codex 内置生图生成，均为虚构成年人物或服装设计，来源与生成提示词单独记录。原库按各自的来源说明使用；新增图片不沿用原库的许可标签。
          </p>
        </div>
      </Section>
    </>
  )
}
