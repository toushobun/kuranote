import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-DRbcmy6F.js";import{n as i,t as a}from"./Box-e8KKMuCZ.js";import{n as o,t as s}from"./Typography-CwLqrFKa.js";import{a as c,i as l,n as u,r as d,t as f}from"./KuraIcon-n2W6TFyl.js";var p,m,h,g,_,v,y,b;e((()=>{p=t(),a(),r(),s(),u(),l(),m={title:`Atoms/Icons/KuraIcon`,component:f,args:{name:`quickRecord`,size:`md`}},h={name:`默认（记一笔）`},g={name:`全部图标`,render:()=>(0,p.jsx)(n,{direction:`row`,sx:{flexWrap:`wrap`,gap:4,p:2},children:d.map(e=>(0,p.jsxs)(i,{sx:{alignItems:`center`,display:`flex`,flexDirection:`column`,gap:1},children:[(0,p.jsx)(f,{name:e,size:`lg`}),(0,p.jsx)(o,{color:`text.secondary`,variant:`caption`,children:c[e].label})]},e))})},_={name:`尺寸变体`,render:()=>(0,p.jsxs)(n,{direction:`row`,sx:{alignItems:`flex-end`,gap:4,p:2},children:[[`sm`,`md`,`lg`].map(e=>(0,p.jsxs)(i,{sx:{alignItems:`center`,display:`flex`,flexDirection:`column`,gap:1},children:[(0,p.jsx)(f,{name:`merchant`,size:e}),(0,p.jsx)(o,{variant:`caption`,children:e})]},e)),(0,p.jsxs)(i,{sx:{alignItems:`center`,display:`flex`,flexDirection:`column`,gap:1},children:[(0,p.jsx)(f,{name:`merchant`,size:96}),(0,p.jsx)(o,{variant:`caption`,children:`96px`})]})]})},v={name:`有 label（覆盖默认）`,args:{name:`account`,label:`我的账户`,size:`lg`}},y={name:`装饰图标（decorative）`,args:{name:`category`,decorative:!0,size:`lg`}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "默认（记一笔）"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "全部图标",
  render: () => <Stack direction="row" sx={{
    flexWrap: "wrap",
    gap: 4,
    p: 2
  }}>
      {KURA_ICON_NAMES.map(name => <Box key={name} sx={{
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
      gap: 1
    }}>
          <KuraIcon name={name} size="lg" />
          <Typography color="text.secondary" variant="caption">
            {kuraIconRegistry[name].label}
          </Typography>
        </Box>)}
    </Stack>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "尺寸变体",
  render: () => <Stack direction="row" sx={{
    alignItems: "flex-end",
    gap: 4,
    p: 2
  }}>
      {(["sm", "md", "lg"] as const).map(size => <Box key={size} sx={{
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
      gap: 1
    }}>
          <KuraIcon name="merchant" size={size} />
          <Typography variant="caption">{size}</Typography>
        </Box>)}
      <Box sx={{
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
      gap: 1
    }}>
        <KuraIcon name="merchant" size={96} />
        <Typography variant="caption">96px</Typography>
      </Box>
    </Stack>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "有 label（覆盖默认）",
  args: {
    name: "account",
    label: "我的账户",
    size: "lg"
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "装饰图标（decorative）",
  args: {
    name: "category",
    decorative: true,
    size: "lg"
  }
}`,...y.parameters?.docs?.source}}},b=[`Default`,`AllIcons`,`Sizes`,`WithLabel`,`Decorative`]}))();export{g as AllIcons,y as Decorative,h as Default,_ as Sizes,v as WithLabel,b as __namedExportsOrder,m as default};