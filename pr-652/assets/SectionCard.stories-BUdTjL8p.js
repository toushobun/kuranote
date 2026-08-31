import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-DRbcmy6F.js";import{n as i,t as a}from"./Typography-CwLqrFKa.js";import{n as o,t as s}from"./Button-DfoJRk0N.js";import{n as c,t as l}from"./SectionCard-B0RSfjnM.js";var u,d,f,p,m;e((()=>{u=t(),s(),r(),a(),c(),d={title:`Molecules/UI/SectionCard`,component:l,args:{children:`区块内容`}},f={name:`基本卡片`,render:()=>(0,u.jsx)(l,{sx:{maxWidth:420},children:(0,u.jsxs)(n,{spacing:.75,children:[(0,u.jsx)(i,{sx:{fontWeight:900},children:`本月概览`}),(0,u.jsx)(i,{color:`text.secondary`,variant:`body2`,children:`用于承载页面中的独立信息区块。`})]})})},p={name:`带操作内容`,render:()=>(0,u.jsx)(l,{sx:{maxWidth:420},children:(0,u.jsxs)(n,{spacing:1.5,children:[(0,u.jsx)(i,{sx:{fontWeight:900},children:`家庭账本`}),(0,u.jsx)(i,{color:`text.secondary`,variant:`body2`,children:`当前共有 3 位成员共同记账。`}),(0,u.jsx)(o,{size:`small`,variant:`outlined`,children:`查看详情`})]})})},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "基本卡片",
  render: () => <SectionCard sx={{
    maxWidth: 420
  }}>
      <Stack spacing={0.75}>
        <Typography sx={{
        fontWeight: 900
      }}>本月概览</Typography>
        <Typography color="text.secondary" variant="body2">
          用于承载页面中的独立信息区块。
        </Typography>
      </Stack>
    </SectionCard>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "带操作内容",
  render: () => <SectionCard sx={{
    maxWidth: 420
  }}>
      <Stack spacing={1.5}>
        <Typography sx={{
        fontWeight: 900
      }}>家庭账本</Typography>
        <Typography color="text.secondary" variant="body2">
          当前共有 3 位成员共同记账。
        </Typography>
        <Button size="small" variant="outlined">
          查看详情
        </Button>
      </Stack>
    </SectionCard>
}`,...p.parameters?.docs?.source}}},m=[`Default`,`WithAction`]}))();export{f as Default,p as WithAction,m as __namedExportsOrder,d as default};