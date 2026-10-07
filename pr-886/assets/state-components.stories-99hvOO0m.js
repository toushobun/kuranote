import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-Blj2xom2.js";import{n as i,t as a}from"./Button-DJTTRrLP.js";import{n as o,t as s}from"./SectionCard-CbGcYsjd.js";import{n as c,t as l}from"./EmptyState-_J63krNZ.js";import{n as u,r as d,t as f}from"./ErrorState-D9N-srka.js";import{n as p,t as m}from"./FormActions-rxMv2Wml.js";import{n as h,t as g}from"./LoadingState-DpZk-rQB.js";var _,v,y,b,x,S,C;e((()=>{_=t(),a(),r(),c(),d(),p(),h(),o(),v={title:`Molecules/UI/StateComponents`},y={name:`EmptyState`,render:()=>(0,_.jsx)(l,{title:`还没有账户`,description:`请先新增一个账户。`,action:(0,_.jsx)(i,{variant:`contained`,children:`新增账户`})})},b={name:`LoadingState`,render:()=>(0,_.jsx)(g,{title:`读取账户中`,description:`正在读取账户列表。`})},x={name:`ErrorState`,render:()=>(0,_.jsx)(u,{title:`账户操作失败`,description:`账户新增失败。请确认账户名称是否重复。`,action:(0,_.jsx)(f,{})})},S={name:`SectionCard + FormActions`,render:()=>(0,_.jsx)(s,{children:(0,_.jsxs)(n,{spacing:2,children:[(0,_.jsx)(`div`,{children:`表单内容区域`}),(0,_.jsxs)(m,{children:[(0,_.jsx)(i,{variant:`outlined`,children:`取消`}),(0,_.jsx)(i,{variant:`contained`,children:`保存`})]})]})})},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "EmptyState",
  render: () => <EmptyState title="还没有账户" description="请先新增一个账户。" action={<Button variant="contained">新增账户</Button>} />
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "LoadingState",
  render: () => <LoadingState title="读取账户中" description="正在读取账户列表。" />
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "ErrorState",
  render: () => <ErrorState title="账户操作失败" description="账户新增失败。请确认账户名称是否重复。" action={<ErrorRetryButton />} />
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}},C=[`Empty`,`Loading`,`Error`,`CardAndActions`]}))();export{S as CardAndActions,y as Empty,x as Error,b as Loading,C as __namedExportsOrder,v as default};