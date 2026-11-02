import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, `data/${name}.json`), 'utf8'))
const costumes = read('costume-zh')
const portraits = read('portrait-zh')
const counts = (rows, key) => Object.fromEntries([...new Set(rows.map((row) => row[key]))].map((value) => [value, rows.filter((row) => row[key] === value).length]))
const grouped = new Map()
for (const item of costumes) {
  const key = item.关键词.trim().toLowerCase().replace(/\s+/g, ' ')
  grouped.set(key, [...(grouped.get(key) ?? []), item])
}
const duplicates = [...grouped.entries()].filter(([, rows]) => rows.length > 1).map(([prompt, rows]) => ({ prompt, count: rows.length, ids: rows.map((row) => row.id) })).sort((a, b) => b.count - a.count || a.prompt.localeCompare(b.prompt))
const sample = { costumes: [], portraits: [] }
for (const category of ['春季穿搭', '夏季穿搭', '秋季穿搭', '冬季穿搭', '泳装・度假', '派对・礼服']) {
  const rows = costumes.filter((row) => row.分类 === category)
  sample.costumes.push(...[0, Math.floor(rows.length / 2), rows.length - 1].map((index) => rows[index].id))
}
for (const section of ['正脸参考', '造型氛围']) for (const hair of ['短发', '中发', '中长发', '长发']) {
  const rows = portraits.filter((row) => row.分区 === section && row.发长 === hair)
  sample.portraits.push(...[0, Math.floor(rows.length / 2), rows.length - 1].map((index) => rows[index].id))
}
const report = {
  schemaVersion: 1, date: '2026-11-02', scope: '全量元数据检查；另人工查看 18 套服装、24 张人像的分层抽样，未进行全库图像相似度检测。',
  costumes: { total: costumes.length, categories: counts(costumes, '分类'), tags: new Set(costumes.flatMap((row) => row.标签)).size, distinctDescriptions: grouped.size, repeatedDescriptionGroups: duplicates.length, recordsInRepeatedGroups: duplicates.reduce((sum, row) => sum + row.count, 0), repeatedDescriptionExcess: costumes.length - grouped.size, duplicateImagePaths: costumes.length - new Set(costumes.map((row) => row.原图)).size, duplicates,
    missingDimensions: ['单品结构与层次', '目标版型与松量', '适用职业/活动', '穿着状态与磨损', '角色衣橱归属', '每件单品的多视角', '标签审核来源/时间'] },
  portraits: { total: portraits.length, sections: counts(portraits, '分区'), hairLengths: counts(portraits, '发长'), titles: new Set(portraits.map((row) => row.标题)).size, genericStyle: portraits.filter((row) => row.发型名称 === '标准基础款').length, genericAtmosphere: portraits.filter((row) => row.分区 === '造型氛围' && row.发型名称 === '标准基础款').length, featured: portraits.filter((row) => row.精选).length, flaggedHot: portraits.filter((row) => row.热门).length, hotHairLengths: counts(portraits.filter((row) => row.热门), '发长'), duplicateImagePaths: portraits.length - new Set(portraits.map((row) => row.原图)).size,
    missingDimensions: ['同一身份的关联 ID', '年龄设定', '五官结构与不对称', '身体比例与细节', '素颜/妆发状态', '表情与仪态', '语言与口音', '角色经历与个性'] },
  visualSample: sample,
  interpretation: ['描述重复不等于图片重复，原图不删除。', '图片数量不等于独立人物数量，不从人脸推断国籍、族裔或口音。', '人台的腿长、腰围与姿势不能覆盖角色自身的体型。', '原库热门标记为静态数据；分发长的榜单与总榜分开使用。', '新增维度围绕人物，场景只用简短背景说明，不建立空间图片库。'],
}
fs.writeFileSync(path.join(root, 'data/catalog-audit.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ costumes: costumes.length, portraits: portraits.length, duplicateDescriptionGroups: duplicates.length, visualSample: 42 }))
