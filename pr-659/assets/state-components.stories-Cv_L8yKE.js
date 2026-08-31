import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-DRbcmy6F.js";import{n as i,t as a}from"./Typography-CwLqrFKa.js";import{n as o,t as s}from"./CircularProgress-DxhrkFLR.js";import{n as c,t as l}from"./Button-BvhFbL6z.js";import{n as u,t as d}from"./SectionCard-br0B6v8I.js";import{n as f,t as p}from"./EmptyState-ACl3fhfO.js";import{n as m,r as h,t as g}from"./ErrorState-zUuiMZEp.js";import{n as _,t as v}from"./FormActions-BaKxrAs4.js";function y({description:e=`数据读取中，请稍等。`,title:t=`读取中`}){return(0,b.jsx)(d,{role:`status`,children:(0,b.jsxs)(n,{spacing:2,sx:{alignItems:`center`,textAlign:`center`},children:[(0,b.jsx)(o,{"aria-hidden":`true`,size:28}),(0,b.jsx)(i,{variant:`h6`,sx:{fontWeight:700},children:t}),e?(0,b.jsx)(i,{color:`text.secondary`,children:e}):null]})})}var b,x=e((()=>{b=t(),s(),r(),a(),u(),y.__docgenInfo={description:``,methods:[],displayName:`LoadingState`,props:{description:{required:!1,tsType:{name:`ReactNode`},description:``,defaultValue:{value:`"数据读取中，请稍等。"`,computed:!1}},title:{required:!1,tsType:{name:`ReactNode`},description:``,defaultValue:{value:`"读取中"`,computed:!1}}}}})),S,C,w,T,E,D,O;e((()=>{S=t(),l(),r(),f(),h(),_(),x(),u(),C={title:`Molecules/UI/StateComponents`},w={name:`EmptyState`,render:()=>(0,S.jsx)(p,{title:`还没有账户`,description:`请先新增一个账户。`,action:(0,S.jsx)(c,{variant:`contained`,children:`新增账户`})})},T={name:`LoadingState`,render:()=>(0,S.jsx)(y,{title:`读取账户中`,description:`正在读取账户列表。`})},E={name:`ErrorState`,render:()=>(0,S.jsx)(m,{title:`账户操作失败`,description:`账户新增失败。请确认账户名称是否重复。`,action:(0,S.jsx)(g,{})})},D={name:`SectionCard + FormActions`,render:()=>(0,S.jsx)(d,{children:(0,S.jsxs)(n,{spacing:2,children:[(0,S.jsx)(`div`,{children:`表单内容区域`}),(0,S.jsxs)(v,{children:[(0,S.jsx)(c,{variant:`outlined`,children:`取消`}),(0,S.jsx)(c,{variant:`contained`,children:`保存`})]})]})})},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "EmptyState",
  render: () => <EmptyState title="还没有账户" description="请先新增一个账户。" action={<Button variant="contained">新增账户</Button>} />
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "LoadingState",
  render: () => <LoadingState title="读取账户中" description="正在读取账户列表。" />
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "ErrorState",
  render: () => <ErrorState title="账户操作失败" description="账户新增失败。请确认账户名称是否重复。" action={<ErrorRetryButton />} />
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "SectionCard + FormActions",
  render: () => <SectionCard>
      <Stack spacing={2}>
        <div>表单内容区域</div>
        <FormActions>
          <Button variant="outlined">取消</Button>
          <Button variant="contained">保存</Button>
        </FormActions>
      </Stack>
    </SectionCard>
}`,...D.parameters?.docs?.source}}},O=[`Empty`,`Loading`,`Error`,`CardAndActions`]}))();export{D as CardAndActions,w as Empty,E as Error,T as Loading,O as __namedExportsOrder,C as default};